import logging
from typing import Optional

from celery import shared_task
from celery import chain
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from .services.ContactsService import HubSpotClient, build_contact_properties
from .models import HubSpotContactLink
from .services.CompaniesService import (
    HubSpotClient as HubSpotCompanyClient,
    build_company_properties,
)
from .models import HubSpotCompanyLink
from accounts.models import BusinessDetail
from projects.models import Project
from .services.DealsService import (
    HubSpotClient as HubSpotDealsClient,
    build_deal_properties,
)
from disputes.models import Dispute
from .models import HubSpotTicketLink
from .models import HubSpotMilestoneLink
from .services.MilestonesService import HubSpotMilestonesClient, build_milestone_properties
from projects.models import Milestone as ProjectMilestone
from .services.TicketsService import HubSpotTicketsClient
from .services.FeedbackService import HubSpotFeedbackClient
from .services.RevenueService import HubSpotRevenueClient
from adminpanelApp.models import PlatformRevenue
from payments.models import Payment
from django.db.models import Sum
from datetime import datetime
from .services.ContactMessageService import HubSpotContactMessageClient


logger = logging.getLogger(__name__)
User = get_user_model()

# Deal pipeline id (Sales pipeline is "default")
DEALS_PIPELINE_ID = getattr(settings, "HUBSPOT_DEALS_PIPELINE_ID", "default")

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def sync_contact_task(self, user_id: int) -> Optional[str]:
    """Create or update a HubSpot contact for the given user and persist mapping."""
    logger.info("HubSpot: sync_contact_task started for user_id=%s", user_id)
    user = User.objects.filter(id=user_id).first()
    if not user:
        logger.warning("HubSpot: sync_contact_task abort - user %s not found", user_id)
        return None

    client = HubSpotClient()
    props = build_contact_properties(user)
    logger.info("HubSpot: built contact props for %s -> %s", user.email, {k: props[k] for k in ["email","firstname","lastname","role","language","is_email_verified","onboarding_complete"]})

    # Try mapping record first
    link = HubSpotContactLink.objects.filter(user=user).first()
    hubspot_id = link.hubspot_id if link else None
    try:
        if hubspot_id:
            logger.info("HubSpot: updating existing contact id=%s", hubspot_id)
            data = client.update_contact(hubspot_id, props)
            if link:
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["status", "last_error", "last_synced_at"])
            return data.get("id")

        # No stored ID: search by email
        existing = client.search_contact_by_email(props["email"]) if props.get("email") else None
        if existing:
            hubspot_id = existing.get("id")
            logger.info("HubSpot: found existing contact by email id=%s", hubspot_id)
            client.update_contact(hubspot_id, props)
        else:
            logger.info("HubSpot: creating new contact for email=%s", props.get("email"))
            created = client.create_contact(props)
            hubspot_id = created.get("id")

        # Persist mapping
        if hubspot_id:
            if link:
                link.hubspot_id = hubspot_id
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])
            else:
                HubSpotContactLink.objects.create(
                    user=user,
                    hubspot_id=hubspot_id,
                    status="success",
                    last_error="",
                )

        logger.info("HubSpot: sync_contact_task finished for user_id=%s with id=%s", user_id, hubspot_id)
        return hubspot_id

    except Exception as exc:
        logger.exception("HubSpot: sync_contact_task failed for user %s: %s", user_id, exc)
        if link:
            link.status = "failed"
            link.last_error = str(exc)
            link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def sync_company_task(self, business_detail_id: int) -> Optional[str]:
    logger.info("HubSpot: sync_company_task started for business_detail_id=%s", business_detail_id)
    bd = BusinessDetail.objects.filter(id=business_detail_id).first()
    if not bd:
        logger.warning("HubSpot: sync_company_task abort - business_detail %s not found", business_detail_id)
        return None
    # Guard: only seller or professional-buyer should create/update companies
    role = getattr(getattr(bd, "user", None), "role", None)
    if role not in ["seller", "professional-buyer"]:
        logger.info("HubSpot: skipping company sync for role=%s (bd=%s)", role, business_detail_id)
        return None

    # Avoid creating empty companies
    if not (getattr(bd, "company_name", None) and getattr(bd, "siret_number", None)):
        logger.info(
            "HubSpot: skipping company sync due to missing required fields (name=%s, siret=%s) for bd=%s",
            getattr(bd, "company_name", None), getattr(bd, "siret_number", None), business_detail_id,
        )
        return None

    client = HubSpotCompanyClient()
    props = build_company_properties(bd)
    logger.info(
        "HubSpot: built company props -> name=%s, siret=%s, address=%s, type=%s",
        props.get("name"), props.get("siret_number"), props.get("address"), props.get("type_of_activity"),
    )

    link = HubSpotCompanyLink.objects.filter(business_detail=bd).first()
    hubspot_id = link.hubspot_id if link else None
    try:
        if hubspot_id:
            logger.info("HubSpot: updating existing company id=%s", hubspot_id)
            data = client.update_company(hubspot_id, props)
            if link:
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["status", "last_error", "last_synced_at"])
            return data.get("id")

        # No stored ID: search by siret, then by name (fallback) to avoid duplicates
        existing = None
        if props.get("siret_number"):
            existing = client.search_company_by_siret(props.get("siret_number"))
        if not existing and props.get("name"):
            existing = client.search_company_by_name(props.get("name"))
        if existing:
            hubspot_id = existing.get("id")
            logger.info("HubSpot: found existing company by %s id=%s", "siret" if props.get("siret_number") else "name", hubspot_id)
            client.update_company(hubspot_id, props)
        else:
            logger.info("HubSpot: creating new company name=%s", props.get("name"))
            created = client.create_company(props)
            hubspot_id = created.get("id")

        if hubspot_id:
            if link:
                link.hubspot_id = hubspot_id
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])
            else:
                HubSpotCompanyLink.objects.create(
                    business_detail=bd,
                    hubspot_id=hubspot_id,
                    status="success",
                    last_error="",
                )

        # Association intentionally disabled for now

        logger.info("HubSpot: sync_company_task finished for business_detail_id=%s with id=%s", business_detail_id, hubspot_id)
        return hubspot_id

    except Exception as exc:
        logger.exception("HubSpot: sync_company_task failed for business_detail_id %s: %s", business_detail_id, exc)
        if link:
            link.status = "failed"
            link.last_error = str(exc)
            link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def sync_deal_task(self, project_id: int) -> Optional[str]:
    logger.info("HubSpot: sync_deal_task started for project_id=%s", project_id)
    project = Project.objects.filter(id=project_id).select_related("user").first()
    if not project:
        logger.warning("HubSpot: sync_deal_task abort - project %s not found", project_id)
        return None

    client = HubSpotDealsClient()
    # Resolve stage id dynamically from pipeline labels (no env map needed)
    deal_client = client  # same auth
    dealstage_id = deal_client.resolve_stage_id(DEALS_PIPELINE_ID, project.status)
    props = build_deal_properties(project, DEALS_PIPELINE_ID, dealstage_id)
    logger.info("HubSpot: built deal props for project %s -> name=%s, stage_id=%s", project.id, props.get("dealname"), props.get("dealstage"))

    try:
        existing = client.search_deal_by_project_id(str(project.id))
        if existing:
            deal_id = existing.get("id")
            logger.info("HubSpot: updating existing deal id=%s for project_id=%s", deal_id, project_id)
            client.update_deal(deal_id, props)
            return deal_id
        created = client.create_deal(props)
        deal_id = created.get("id")
        logger.info("HubSpot: created new deal id=%s for project_id=%s", deal_id, project_id)
        return deal_id
    except Exception as exc:
        logger.exception("HubSpot: sync_deal_task failed for project_id %s: %s", project_id, exc)
        raise

# Removed: sync_contact_company_and_associate (association disabled)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def create_dispute_ticket_task(self, dispute_id: int) -> str:
    """Create a HubSpot ticket for a newly created dispute and persist mapping."""
    logger.info("HubSpot: create_dispute_ticket_task start dispute_id=%s", dispute_id)
    dispute = Dispute.objects.filter(id=dispute_id).select_related("project", "initiator", "respondent").first()
    if not dispute:
        logger.warning("HubSpot: dispute not found id=%s", dispute_id)
        return ""

    client = HubSpotTicketsClient()

    pipeline = getattr(settings, "HUBSPOT_TICKETS_PIPELINE", "0")
    # Determine a valid stage id for creation (HubSpot requires it).
    stage = client.get_first_stage_id(str(pipeline))

    subject = f"Dispute {dispute.dispute_id}"
    content = "\n".join([
        f"Project: {getattr(dispute.project, 'name', '')}",
        f"Type: {dispute.get_dispute_type_display()}",
        f"Status: {dispute.get_status_display()}",
        f"Initiator: {getattr(dispute.initiator, 'email', '')}",
        f"Respondent: {getattr(dispute.respondent, 'email', '')}",
        "",
        dispute.description or "",
    ])

    properties = {
        "hs_pipeline": str(pipeline),
        "hs_pipeline_stage": str(stage or "0"),
        "subject": subject[:255],
        "content": content[:65000],
        # Custom properties (must exist in HubSpot)
        "dispute_id": dispute.dispute_id,
        "safebill_project_name": getattr(dispute.project, "name", ""),
        "safebill_dispute_title": (dispute.title or "")[:255],
        "safebill_dispute_type": dispute.dispute_type,
        "safebill_dispute_status": dispute.status,
        "description": (dispute.description or "")[:65000],
        "safebill_initiator_email": getattr(dispute.initiator, "email", ""),
        "safebill_respondent_email": getattr(dispute.respondent, "email", ""),
        "safebill_assigned_mediator_email": getattr(getattr(dispute, "assigned_mediator", None), "email", ""),
    }

    created = client.create_ticket(properties)
    ticket_id = created.get("id", "")

    if ticket_id:
        HubSpotTicketLink.objects.update_or_create(
            dispute=dispute,
            defaults={
                "hubspot_id": ticket_id,
                "status": "success",
                "last_error": "",
            },
        )

    logger.info("HubSpot: created ticket id=%s for dispute=%s", ticket_id, dispute_id)
    return ticket_id


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def update_dispute_ticket_task(self, dispute_id: int) -> None:
    """Update HubSpot ticket when dispute mediator/status/details change."""
    logger.info("HubSpot: update_dispute_ticket_task start dispute_id=%s", dispute_id)
    dispute = Dispute.objects.filter(id=dispute_id).select_related("project", "initiator", "respondent", "assigned_mediator").first()
    if not dispute:
        logger.warning("HubSpot: dispute not found id=%s", dispute_id)
        return

    link = HubSpotTicketLink.objects.filter(dispute=dispute).first()
    if not link or not link.hubspot_id:
        logger.info("HubSpot: no ticket link found for dispute=%s; creating now", dispute_id)
        create_dispute_ticket_task.delay(dispute_id)
        return

    client = HubSpotTicketsClient()

    pipeline = getattr(settings, "HUBSPOT_TICKETS_PIPELINE", "0")

    # Resolve a stage id for the new status
    stage_map = getattr(settings, "HUBSPOT_TICKETS_STAGE_MAP", None)
    stage_id = None
    if isinstance(stage_map, dict):
        stage_id = stage_map.get(dispute.status)
    if not stage_id:
        # Build a best-effort mapping from current pipeline labels
        try:
            data = client.get_pipeline(str(pipeline))
            labels_to_id = {str(s.get("label", "")).strip().lower(): str(s.get("id")) for s in data.get("stages", [])}
            target_label_candidates = {
                "submitted": ["submitted", "new", "open"],
                "in_progress": ["in progress", "working", "waiting on us", "open"],
                "mediation_initiated": ["mediation initiated", "in progress", "open"],
                "awaiting_decision": ["awaiting decision", "waiting on contact", "pending", "open"],
                "resolved": ["resolved", "done", "closed"],
                "closed": ["closed", "resolved"],
            }
            for label in target_label_candidates.get(dispute.status, []):
                key = label.strip().lower()
                if key in labels_to_id:
                    stage_id = labels_to_id[key]
                    break
        except Exception:
            stage_id = None

    properties = {
        "hs_pipeline": str(pipeline),
        "subject": (f"Dispute {dispute.dispute_id}")[:255],
        # Keep content shorter on updates; optionally include latest notes/status
        "safebill_dispute_title": (dispute.title or "")[:255],
        "safebill_dispute_status": dispute.status,
        "description": (dispute.description or "")[:65000],
        "safebill_assigned_mediator_email": getattr(getattr(dispute, "assigned_mediator", None), "email", ""),
    }
    if stage_id:
        properties["hs_pipeline_stage"] = str(stage_id)

    try:
        client.update_ticket(link.hubspot_id, properties)
        link.status = "success"
        link.last_error = ""
        link.save(update_fields=["status", "last_error", "last_synced_at"])
    except Exception as exc:
        link.status = "failed"
        link.last_error = str(exc)
        link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def create_contact_us_ticket_task(self, subject: str, message: str, user_email: str, metadata: Optional[dict] = None) -> str:
    """Create a HubSpot ticket for a Contact Us submission.

    - Ticket name (subject): "Contact us - {subject}"
    - Initiator email -> safebill_initiator_email (custom)
    - Description/message -> description (custom or built-in if you created it as such)
    - Pipeline -> HUBSPOT_TICKETS_PIPELINE; first stage auto-selected
    """
    logger.info("HubSpot: create_contact_us_ticket_task subject=%s email=%s", subject, user_email)

    client = HubSpotTicketsClient()
    pipeline = getattr(settings, "HUBSPOT_TICKETS_PIPELINE", "0")
    stage = client.get_first_stage_id(str(pipeline))

    ticket_subject = f"Contact us - {subject or ''}".strip()
    properties = {
        "hs_pipeline": str(pipeline),
        "hs_pipeline_stage": str(stage or "0"),
        "subject": ticket_subject[:255],
        "description": (message or "")[:65000],
        "safebill_initiator_email": (user_email or "").strip(),
    }

    # Optional categorization: only include if you've created the property in HubSpot
    if getattr(settings, "HUBSPOT_ENABLE_RECORD_TYPE", False):
        properties["safebill_record_type"] = "contact_us"

    if metadata and isinstance(metadata, dict):
        # Add a few known optional properties if provided
        for key in ["safebill_support_subject", "safebill_support_message", "safebill_page", "safebill_severity"]:
            value = metadata.get(key)
            if value:
                properties[key] = str(value)[:65000]

    created = client.create_ticket(properties)
    ticket_id = created.get("id", "")
    logger.info("HubSpot: created Contact Us ticket id=%s", ticket_id)
    return ticket_id


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def create_contact_message_object_task(self, name: str, initiator_email: str, subject: str, description: str) -> str:
    """Create a record in HubSpot custom object "ContactMessage" with required properties.

    Expected HubSpot properties:
    - name (text) [primary display]
    - initiator_email (text)
    - subject (text)
    - description (long text)
    """
    logger.info("HubSpot: create_contact_message_object_task name=%s email=%s", name, initiator_email)

    client = HubSpotContactMessageClient()
    properties = {
        "name": (name or "").strip(),
        "initiator_email": (initiator_email or "").strip(),
        "subject": (subject or "")[:255],
        "description": (description or "")[:65000],
    }

    created = client.create(properties)
    object_id = created.get("id", "")
    logger.info("HubSpot: created ContactMessage object id=%s", object_id)
    return object_id


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def create_feedback_ticket_task(self, user_email: str, feedback_message: str) -> str:
    """Create a HubSpot ticket for a Feedback submission.

    - Ticket name (subject): "Feedback"
    - Initiator email -> safebill_initiator_email (custom)
    - Description/message -> description (built-in)
    - Pipeline -> HUBSPOT_TICKETS_PIPELINE; first stage auto-selected
    """
    logger.info("HubSpot: create_feedback_ticket_task email=%s", user_email)

    client = HubSpotTicketsClient()
    pipeline = getattr(settings, "HUBSPOT_TICKETS_PIPELINE", "0")
    stage = client.get_first_stage_id(str(pipeline))

    properties = {
        "hs_pipeline": str(pipeline),
        "hs_pipeline_stage": str(stage or "0"),
        "subject": "Feedback",
        "description": (feedback_message or "")[:65000],
        "safebill_initiator_email": (user_email or "").strip(),
    }

    # Optional categorization: only include if you've created the property in HubSpot
    if getattr(settings, "HUBSPOT_ENABLE_RECORD_TYPE", False):
        properties["safebill_record_type"] = "feedback"

    created = client.create_ticket(properties)
    ticket_id = created.get("id", "")
    logger.info("HubSpot: created Feedback ticket id=%s", ticket_id)
    return ticket_id


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def create_feedback_object_task(self, username: str, initiator_email: str, description: str, metadata: Optional[dict] = None) -> str:
    """Create a record in HubSpot custom object "Feedback" with required properties.

    Expected HubSpot properties on the custom object (configure in HubSpot):
    - username (text) [required, primary display]
    - initiator_email (text) [required]
    - description (long text) [required]
    Optional:
    - source (text)
    - page_url (text)
    - severity (text or enumeration)
    - submitted_at (datetime, ISO8601)
    """
    logger.info("HubSpot: create_feedback_object_task username=%s email=%s", username, initiator_email)

    client = HubSpotFeedbackClient()

    properties = {
        "username": (username or "").strip(),
        "initiator_email": (initiator_email or "").strip(),
        "description": (description or "")[:65000],
    }

    if metadata and isinstance(metadata, dict):
        if metadata.get("page_url"):
            properties["page_url"] = str(metadata["page_url"])[:2048]
        if metadata.get("severity"):
            properties["severity"] = str(metadata["severity"])[:255]
        if metadata.get("submitted_at"):
            properties["submitted_at"] = str(metadata["submitted_at"])  # ISO8601 if provided

    created = client.create(properties)
    feedback_id = created.get("id", "")
    logger.info("HubSpot: created Feedback object id=%s", feedback_id)
    return feedback_id


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def sync_milestone_task(self, milestone_id: int) -> Optional[str]:
    """Create or update a HubSpot custom object for a milestone and persist mapping."""
    logger.info("HubSpot: sync_milestone_task start milestone_id=%s", milestone_id)
    m = ProjectMilestone.objects.filter(id=milestone_id).select_related("project", "project__user", "project__client").first()
    if not m:
        logger.warning("HubSpot: milestone not found id=%s", milestone_id)
        return None

    client = HubSpotMilestonesClient()
    props = build_milestone_properties(m)
    logger.info("HubSpot: built milestone summary props for project=%s total=%s", props.get("project_name"), props.get("total_milestones"))

    link = HubSpotMilestoneLink.objects.filter(milestone=m).first()
    hubspot_id = link.hubspot_id if link else None

    try:
        if hubspot_id:
            logger.info("HubSpot: updating existing milestone id=%s", hubspot_id)
            data = client.update(hubspot_id, props)
            if link:
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["status", "last_error", "last_synced_at"])
            return data.get("id")

        # Upsert summary record by unique SafeBill project id
        existing = client.search_by_project_id(props.get("safebill_project_id", ""))
        if existing:
            hubspot_id = existing.get("id")
            logger.info("HubSpot: found existing milestone summary id=%s", hubspot_id)
            client.update(hubspot_id, props)
        else:
            created = client.create(props)
            hubspot_id = created.get("id")
            logger.info("HubSpot: created milestone summary id=%s for project=%s", hubspot_id, props.get("project_name"))

        if hubspot_id:
            if link:
                link.hubspot_id = hubspot_id
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])
            else:
                HubSpotMilestoneLink.objects.create(
                    milestone=m,
                    hubspot_id=hubspot_id,
                    status="success",
                    last_error="",
                )

        return hubspot_id

    except Exception as exc:
        logger.exception("HubSpot: sync_milestone_task failed for milestone %s: %s", milestone_id, exc)
        if link:
            link.status = "failed"
            link.last_error = str(exc)
            link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def sync_revenue_month_task(self, year: int, month: int) -> Optional[str]:
    """Upsert monthly revenue summary into HubSpot Revenue custom object."""
    logger.info("HubSpot: sync_revenue_month_task start year=%s month=%s", year, month)
    try:
        # Load PlatformRevenue for the month (auto creates on access patterns in services)
        revenue = PlatformRevenue.objects.filter(year=year, month=month).first()

        # Compute totals if record missing or fields needed
        total_payments_amount = (
            Payment.objects.filter(status="paid", created_at__year=year, created_at__month=month)
            .aggregate(total=Sum("amount"))
            .get("total")
            or 0
        )

        seller_revenue = getattr(revenue, "seller_revenue", 0) if revenue else 0
        vat_collected = getattr(revenue, "vat_collected", 0) if revenue else 0
        total_revenue = getattr(revenue, "total_revenue", 0) if revenue else (seller_revenue)
        total_milestones_approved = getattr(revenue, "total_milestones_approved", 0) if revenue else 0

        period_key = f"{year}-{month:02d}"

        client = HubSpotRevenueClient()
        existing = client.search_by_period(period_key)
        # Create period start date (first day of month at midnight UTC)
        period_start_date = f"{year}-{month:02d}-01T00:00:00Z"
        
        props = {
            client.period_key_property: period_key,
            "year": year,
            # Save month as zero-padded string ("01".."12")
            "month": f"{month:02d}",
            "period_start_date": period_start_date,
            "total_payments_amount": float(total_payments_amount),
            "vat_collected": float(vat_collected),
            "seller_revenue": float(seller_revenue),
            "total_revenue": float(total_revenue),
            "total_milestones_approved": int(total_milestones_approved),
        }

        if existing:
            hs_id = existing.get("id")
            logger.info("HubSpot: updating Revenue %s", period_key)
            client.update(hs_id, props)
            return hs_id
        created = client.create(props)
        hs_id = created.get("id")
        logger.info("HubSpot: created Revenue %s id=%s", period_key, hs_id)
        return hs_id
    except Exception as exc:
        logger.exception("HubSpot: sync_revenue_month_task failed for %s-%s: %s", year, month, exc)
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def update_milestone_task(self, milestone_id: int) -> Optional[str]:
    """Update an existing HubSpot milestone custom object when status/amount/etc. changes."""
    logger.info("HubSpot: update_milestone_task start milestone_id=%s", milestone_id)
    m = ProjectMilestone.objects.filter(id=milestone_id).select_related("project", "project__user", "project__client").first()
    if not m:
        logger.warning("HubSpot: milestone not found id=%s", milestone_id)
        return None

    link = HubSpotMilestoneLink.objects.filter(milestone=m).first()
    if not link or not link.hubspot_id:
        logger.info("HubSpot: no milestone link found for %s; creating now", milestone_id)
        return sync_milestone_task.delay(milestone_id)

    client = HubSpotMilestonesClient()
    props = build_milestone_properties(m)
    try:
        client.update(link.hubspot_id, props)
        link.status = "success"
        link.last_error = ""
        link.save(update_fields=["status", "last_error", "last_synced_at"])
        return link.hubspot_id
    except Exception as exc:
        link.status = "failed"
        link.last_error = str(exc)
        link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise

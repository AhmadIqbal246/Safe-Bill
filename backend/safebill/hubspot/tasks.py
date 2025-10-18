"""
CLEAN HUBSPOT TASKS STRUCTURE
============================

Core Sync Tasks (5):
- sync_contact_task(user_id, queue_item_id)
- sync_company_task(business_detail_id, queue_item_id)  
- sync_deal_task(project_id, queue_item_id)
- sync_milestone_task(milestone_id, queue_item_id)
- sync_revenue_task(year, month, queue_item_id)

Specialized Tasks (3):
- create_dispute_ticket_task(dispute_id)
- create_feedback_task(username, email, description, create_ticket, metadata)
- create_contact_message_task(name, email, subject, description, create_ticket, metadata)

Queue Management (3):
- process_sync_queue(batch_size)
- retry_failed_sync_items()
- cleanup_old_sync_queue_items(days_old)

Total: 11 clean, organized tasks (reduced from 15+ messy tasks)
"""

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

# Simple in-memory task deduplication
_running_tasks = set()

def _is_task_running(task_key):
    """Check if a task is already running"""
    return task_key in _running_tasks

def _mark_task_running(task_key):
    """Mark a task as running"""
    _running_tasks.add(task_key)

def _mark_task_finished(task_key):
    """Mark a task as finished"""
    _running_tasks.discard(task_key)


# =============================================================================
# CORE SYNC TASKS (UNIFIED - SUPPORT BOTH DIRECT AND QUEUE MODES)
# =============================================================================

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def sync_contact_task(self, user_id: int = None, queue_item_id: int = None) -> Optional[str]:
    """Unified contact sync task that works in both direct and queue modes."""
    from .models import HubSpotSyncQueue
    
    # Handle queue mode
    if queue_item_id:
        try:
            queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
            user = queue_item.content_object
            user_id = user.id
            logger.info("HubSpot: sync_contact_task start (queue mode) user_id=%s", user_id)
        except Exception as e:
            logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
            return None
    else:
        logger.info("HubSpot: sync_contact_task start (direct mode) user_id=%s", user_id)
    
    task_key = f"sync_contact_task_{user_id}"
    
    # Check if task is already running
    if _is_task_running(task_key):
        logger.info("HubSpot: sync_contact_task already running for user_id=%s, skipping", user_id)
        return None
    
    _mark_task_running(task_key)
    
    try:
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
            try:
                created = client.create_contact(props)
                hubspot_id = created.get("id")
            except Exception as create_error:
                # Handle conflict - contact might have been created by another task
                if "409" in str(create_error) or "Conflict" in str(create_error):
                    logger.info("HubSpot: contact creation conflict, searching for existing contact")
                    existing = client.search_contact_by_email(props["email"])
                    if existing:
                        hubspot_id = existing.get("id")
                        logger.info("HubSpot: found existing contact after conflict id=%s", hubspot_id)
                        client.update_contact(hubspot_id, props)
                    else:
                        raise create_error
                else:
                    raise create_error

        # Persist mapping with duplicate prevention
        if hubspot_id:
            if link:
                link.hubspot_id = hubspot_id
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])
            else:
                # Use get_or_create to prevent duplicate link creation
                link, created = HubSpotContactLink.objects.get_or_create(
                    user=user,
                    defaults={
                        'hubspot_id': hubspot_id,
                        'status': "success",
                        'last_error': "",
                    }
                )
                if not created:
                    # Update existing link
                    link.hubspot_id = hubspot_id
                    link.status = "success"
                    link.last_error = ""
                    link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])

        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_synced()
                logger.info(f"HubSpot: Marked contact queue item {queue_item_id} as synced")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark contact queue item as synced: {e}")

        logger.info("HubSpot: sync_contact_task finished for user_id=%s with id=%s", user_id, hubspot_id)
        return hubspot_id

    except Exception as exc:
        logger.exception("HubSpot: sync_contact_task failed for user %s: %s", user_id, exc)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_failed(str(exc), {"error_type": "sync_error"})
                logger.info(f"HubSpot: Marked contact queue item {queue_item_id} as failed")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark contact queue item as failed: {e}")
        
        if link:
            link.status = "failed"
            link.last_error = str(exc)
            link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise
    finally:
        _mark_task_finished(task_key)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def sync_company_task(self, business_detail_id: int = None, queue_item_id: int = None) -> Optional[str]:
    """Unified company sync task that works in both direct and queue modes."""
    from .models import HubSpotSyncQueue
    
    # Handle queue mode
    if queue_item_id:
        try:
            queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
            bd = queue_item.content_object
            business_detail_id = bd.id
            logger.info("HubSpot: sync_company_task start (queue mode) business_detail_id=%s", business_detail_id)
        except Exception as e:
            logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
            return None
    else:
        logger.info("HubSpot: sync_company_task start (direct mode) business_detail_id=%s", business_detail_id)
    
    task_key = f"sync_company_task_{business_detail_id}"
    
    # Check if task is already running
    if _is_task_running(task_key):
        logger.info("HubSpot: sync_company_task already running for business_detail_id=%s, skipping", business_detail_id)
        return None
    
    _mark_task_running(task_key)
    
    try:
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
                # Use get_or_create to prevent duplicate link creation
                link, created = HubSpotCompanyLink.objects.get_or_create(
                    business_detail=bd,
                    defaults={
                        'hubspot_id': hubspot_id,
                        'status': "success",
                        'last_error': "",
                    }
                )
                if not created:
                    # Update existing link
                    link.hubspot_id = hubspot_id
                    link.status = "success"
                    link.last_error = ""
                    link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])

        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_synced()
                logger.info(f"HubSpot: Marked company queue item {queue_item_id} as synced")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark company queue item as synced: {e}")

        logger.info("HubSpot: sync_company_task finished for business_detail_id=%s with id=%s", business_detail_id, hubspot_id)
        return hubspot_id

    except Exception as exc:
        logger.exception("HubSpot: sync_company_task failed for business_detail_id %s: %s", business_detail_id, exc)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_failed(str(exc), {"error_type": "sync_error"})
                logger.info(f"HubSpot: Marked company queue item {queue_item_id} as failed")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark company queue item as failed: {e}")
        
        if link:
            link.status = "failed"
            link.last_error = str(exc)
            link.save(update_fields=["status", "last_error", "last_synced_at"])
        raise
    finally:
        _mark_task_finished(task_key)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def sync_deal_task(self, project_id: int = None, queue_item_id: int = None) -> Optional[str]:
    """Unified deal sync task that works in both direct and queue modes."""
    from .models import HubSpotSyncQueue
    
    # Handle queue mode
    if queue_item_id:
        try:
            queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
            project = queue_item.content_object
            project_id = project.id
            logger.info("HubSpot: sync_deal_task start (queue mode) project_id=%s", project_id)
        except Exception as e:
            logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
            return None
    else:
        logger.info("HubSpot: sync_deal_task start (direct mode) project_id=%s", project_id)
    
    task_key = f"sync_deal_task_{project_id}"
    
    # Check if task is already running
    if _is_task_running(task_key):
        logger.info("HubSpot: sync_deal_task already running for project_id=%s, skipping", project_id)
        return None
    
    _mark_task_running(task_key)
    
    try:
        project = Project.objects.filter(id=project_id).select_related("user").first()
        if not project:
            logger.warning("HubSpot: sync_deal_task abort - project %s not found", project_id)
            return None

        client = HubSpotDealsClient()
        # Resolve stage id dynamically from pipeline labels (no env map needed)
        # Do not manage HubSpot pipeline/stages; rely only on custom properties
        dealstage_id = None
        props = build_deal_properties(project, None, None)
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
    finally:
        _mark_task_finished(task_key)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def sync_milestone_task(self, milestone_id: int = None, queue_item_id: int = None) -> Optional[str]:
    """Unified milestone sync task that works in both direct and queue modes."""
    from .models import HubSpotSyncQueue
    
    # Handle queue mode
    if queue_item_id:
        try:
            queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
            project = queue_item.content_object  # Now it's a PROJECT, not milestone
            logger.info("HubSpot: sync_milestone_task start (queue mode) project_id=%s", project.id)
        except Exception as e:
            logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
            return None
    else:
        logger.info("HubSpot: sync_milestone_task start (direct mode) milestone_id=%s", milestone_id)
        # For direct mode, get the project from the milestone
        m = ProjectMilestone.objects.filter(id=milestone_id).select_related("project", "project__user", "project__client").first()
        if not m:
            logger.error(f"HubSpot: Milestone {milestone_id} not found")
            return None
        project = m.project
    
    # Get all milestones for the project
    milestones = ProjectMilestone.objects.filter(project=project).select_related("project", "project__user", "project__client")
    if not milestones.exists():
        logger.error(f"HubSpot: No milestones found for project {project.id}")
        return None
    
    # Use the first milestone for context (they all belong to the same project)
    m = milestones.first()
    if not m:
        logger.warning("HubSpot: milestone not found id=%s", milestone_id)
        return None

    client = HubSpotMilestonesClient()
    props = build_milestone_properties(m)  # This already handles all milestones for the project
    logger.info("HubSpot: built milestone summary props for project=%s total=%s", props.get("project_name"), props.get("total_milestones"))

    link = HubSpotMilestoneLink.objects.filter(milestone=m).first()
    hubspot_id = link.hubspot_id if link else None

    try:
        # Check if we have a real HubSpot ID (not the temporary 'PROCESSING' marker)
        if hubspot_id and hubspot_id != 'PROCESSING':
            logger.info("HubSpot: updating existing milestone id=%s", hubspot_id)
            data = client.update(hubspot_id, props)
            if link:
                link.status = "success"
                link.last_error = ""
                link.save(update_fields=["status", "last_error", "last_synced_at"])
            return data.get("id")

        # Create-only semantics: if a milestone summary already exists for this project,
        # do NOT update it; simply return the existing id. This avoids duplicate writes on retries.
        project_id_str = props.get("safebill_project_id", "")
        existing = client.search_by_project_id(project_id_str)
        if existing:
            hubspot_id = existing.get("id")
            logger.info("HubSpot: milestone summary already exists for project=%s, id=%s — skipping update", props.get("project_name"), hubspot_id)
        else:
            try:
                created = client.create(props)
                hubspot_id = created.get("id")
                logger.info("HubSpot: created milestone summary id=%s for project=%s", hubspot_id, props.get("project_name"))
            except Exception as create_error:
                # If another worker created it concurrently, resolve by search and then skip
                if "409" in str(create_error) or "Conflict" in str(create_error):
                    existing = client.search_by_project_id(project_id_str)
                    if existing:
                        hubspot_id = existing.get("id")
                        logger.info("HubSpot: found milestone summary after conflict id=%s — skipping update", hubspot_id)
                    else:
                        raise create_error
                else:
                    raise create_error

        # If neither branch produced an id (extremely defensive), try a final search/update
        if not hubspot_id:
            existing = existing or client.search_by_project_id(project_id_str)
            if existing:
                hubspot_id = existing.get("id")
                client.update(hubspot_id, props)
            else:
                created = client.create(props)
                hubspot_id = created.get("id")

        if hubspot_id:
            # Update ALL milestone links for this project with the same HubSpot ID
            # This ensures all milestones point to the same summary record
            for milestone in milestones:
                link, created = HubSpotMilestoneLink.objects.get_or_create(
                    milestone=milestone,
                    defaults={
                        "hubspot_id": hubspot_id,
                        "status": "success",
                        "last_error": "",
                    }
                )
                if not created:
                    # Update existing link
                    link.hubspot_id = hubspot_id
                    link.status = "success"
                    link.last_error = ""
                    link.save(update_fields=["hubspot_id", "status", "last_error", "last_synced_at"])

        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_synced()
                logger.info(f"HubSpot: Marked milestone queue item {queue_item_id} as synced")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark milestone queue item as synced: {e}")

        return hubspot_id

    except Exception as exc:
        logger.exception("HubSpot: sync_milestone_task failed for milestone %s: %s", milestone_id, exc)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_failed(str(exc), {"error_type": "sync_error"})
                logger.info(f"HubSpot: Marked milestone queue item {queue_item_id} as failed")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark milestone queue item as failed: {e}")
        
        # Update link status for direct mode
        if link:
            link.status = "failed"
            link.last_error = str(exc)
            link.save(update_fields=["status", "last_error", "last_synced_at"])
        
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def sync_revenue_task(self, year: int = None, month: int = None, queue_item_id: int = None, sync_type: str = "all") -> Optional[str]:
    """
    Unified revenue sync task that works in both direct and queue modes.
    
    Args:
        year: Year for revenue sync
        month: Month for revenue sync
        queue_item_id: Queue item ID for queue mode
        sync_type: Type of sync - "payment" (VAT + total payments) or "milestone" (seller revenue + milestones) or "all" (everything)
    """
    from .models import HubSpotSyncQueue
    
    # Handle queue mode
    if queue_item_id:
        try:
            queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
            # Extract year/month from queue item metadata or use current
            metadata = getattr(queue_item, 'error_details', {}) or {}
            year = metadata.get('year') or timezone.now().year
            month = metadata.get('month') or timezone.now().month
            logger.info("HubSpot: sync_revenue_task start (queue mode) year=%s month=%s", year, month)
        except Exception as e:
            logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
            return None
    else:
        logger.info("HubSpot: sync_revenue_task start (direct mode) year=%s month=%s", year, month)
    
    try:
        # Initialize all revenue values
        total_payments_amount = 0
        vat_collected = 0
        seller_revenue = 0
        total_revenue = 0
        total_milestones_approved = 0
        
        # Calculate revenue values based on sync type
        if sync_type in ["payment", "all"]:
            # 1. Total payments amount (what buyers paid)
            total_payments_amount = (
                Payment.objects.filter(status="paid", created_at__year=year, created_at__month=month)
                .aggregate(total=Sum("amount"))
                .get("total")
                or 0
            )
            
            # 2. VAT collected (difference between buyer_total and amount)
            payments_with_vat = Payment.objects.filter(
                status="paid", created_at__year=year, created_at__month=month
            )
            vat_collected = sum(
                (p.buyer_total_amount or 0) - (p.amount or 0) for p in payments_with_vat
            )
        
        if sync_type in ["milestone", "all"]:
            # 3. Seller revenue (platform fees from approved milestones)
            from projects.models import Milestone
            from payments.services import FeeCalculationService
            
            # FIXED: Only count milestones from projects that received payments in this month
            # This prevents counting milestones from projects without payments
            paid_projects_in_month = Payment.objects.filter(
                status="paid",
                created_at__year=year,
                created_at__month=month
            ).values_list('project_id', flat=True).distinct()
            
            # Get approved milestones for this month but ONLY from projects with payments
            milestones = Milestone.objects.filter(
                status="approved",
                completion_date__year=year,
                completion_date__month=month,
                project_id__in=paid_projects_in_month  # Only count milestones from paid projects
            ).select_related('project')
            
            total_milestones_approved = milestones.count()
            
            for milestone in milestones:
                try:
                    # Calculate platform fee for this milestone
                    fees = FeeCalculationService.calculate_fees(
                        milestone.relative_payment,
                        milestone.project.platform_fee_percentage,
                        milestone.project.vat_rate
                    )
                    seller_revenue += float(fees["platform_fee"])
                except Exception as e:
                    logger.warning(f"Error calculating fees for milestone {milestone.id}: {e}")
            
            # 4. Total revenue (same as seller revenue for now)
            total_revenue = seller_revenue
        
        # Debug logging for revenue calculation transparency
        logger.info(
            f"HubSpot revenue calculation for {year}-{month:02d} (sync_type={sync_type}): "
            f"total_payments={total_payments_amount}, vat_collected={vat_collected}, "
            f"seller_revenue={seller_revenue}, total_revenue={total_revenue}, "
            f"milestones_approved={total_milestones_approved}"
        )

        period_key = f"{year}-{month:02d}"

        client = HubSpotRevenueClient()
        existing = client.search_by_period(period_key)
        # Create period start date (first day of month at midnight UTC)
        period_start_date = f"{year}-{month:02d}-01T00:00:00Z"
        
        # Build properties based on sync type
        props = {
            client.period_key_property: period_key,
            "year": year,
            # Save month as zero-padded string ("01".."12")
            "month": f"{month:02d}",
            "period_start_date": period_start_date,
        }
        
        # Add payment-related properties
        if sync_type in ["payment", "all"]:
            props.update({
                "total_payments_amount": float(total_payments_amount),
                "vat_collected": float(vat_collected),
            })
        
        # Add milestone-related properties
        if sync_type in ["milestone", "all"]:
            props.update({
                "seller_revenue": float(seller_revenue),
                "total_revenue": float(total_revenue),
                "total_milestones_approved": int(total_milestones_approved),
            })

        if existing:
            hs_id = existing.get("id")
            logger.info("HubSpot: updating Revenue %s", period_key)
            client.update(hs_id, props)
            return hs_id
        created = client.create(props)
        hs_id = created.get("id")
        logger.info("HubSpot: created Revenue %s id=%s", period_key, hs_id)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_synced()
                logger.info(f"HubSpot: Marked revenue queue item {queue_item_id} as synced")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark revenue queue item as synced: {e}")
        
        return hs_id
    except Exception as exc:
        logger.exception("HubSpot: sync_revenue_task failed for %s-%s: %s", year, month, exc)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_failed(str(exc), {"error_type": "sync_error"})
                logger.info(f"HubSpot: Marked revenue queue item {queue_item_id} as failed")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark revenue queue item as failed: {e}")
        
        raise


# =============================================================================
# SPECIALIZED TASKS (SPECIFIC PURPOSES)
# =============================================================================

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
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


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def create_feedback_task(self, username: str = None, initiator_email: str = None, description: str = None, create_ticket: bool = True, metadata: Optional[dict] = None, queue_item_id: int = None) -> str:
    """Unified feedback task that works in both direct and queue modes.
    
    Args:
        username: User's username (for direct mode)
        initiator_email: User's email (for direct mode)
        description: Feedback message (for direct mode)
        create_ticket: If True, create ticket; if False, create custom object
        metadata: Optional metadata for custom object
        queue_item_id: Queue item ID (for batch processing)
    """
    from .models import HubSpotSyncQueue
    from feedback.models import Feedback
    
    try:
        # Handle queue mode
        if queue_item_id:
            try:
                queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
                feedback = queue_item.content_object
                
                if not isinstance(feedback, Feedback):
                    raise ValueError(f"Expected Feedback object, got {type(feedback)}")
                
                # Extract data from feedback object (no placeholders if data exists)
                username = None
                if hasattr(feedback, 'user') and getattr(feedback.user, 'id', None):
                    username = getattr(feedback.user, 'get_full_name', lambda: None)() or getattr(feedback.user, 'username', None)
                    if not username and getattr(feedback.user, 'email', None):
                        username = str(feedback.user.email).split('@')[0]
                if not username and hasattr(feedback, 'username'):
                    username = getattr(feedback, 'username')
                if not username and hasattr(feedback, 'name'):
                    username = getattr(feedback, 'name')
                if not username and getattr(feedback, 'email', None):
                    username = str(feedback.email).split('@')[0]

                initiator_email = None
                if hasattr(feedback, 'email') and feedback.email:
                    initiator_email = feedback.email
                elif hasattr(feedback, 'user') and getattr(feedback.user, 'email', None):
                    initiator_email = feedback.user.email

                description = getattr(feedback, 'message', None) or str(feedback)

                # Validate required email
                if not initiator_email:
                    raise ValueError("Feedback email missing; refusing to send placeholder to HubSpot")
                create_ticket = False  # Use custom object for queue processing
                metadata = {'feedback_id': feedback.id}
                
                logger.info(f"🔄 Processing feedback sync from queue: {feedback.id}")
            except Exception as e:
                logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
                return ""
        else:
            logger.info("HubSpot: create_feedback_task start (direct mode)")
        
        logger.info("HubSpot: create_feedback_task username=%s email=%s ticket=%s", username, initiator_email, create_ticket)

        if create_ticket:
            # Create as ticket
            client = HubSpotTicketsClient()
            pipeline = getattr(settings, "HUBSPOT_TICKETS_PIPELINE", "0")
            stage = client.get_first_stage_id(str(pipeline))

            properties = {
                "hs_pipeline": str(pipeline),
                "hs_pipeline_stage": str(stage or "0"),
                "subject": "Feedback",
                "description": (description or "")[:65000],
                "safebill_initiator_email": (initiator_email or "").strip(),
            }

            # Optional categorization
            if getattr(settings, "HUBSPOT_ENABLE_RECORD_TYPE", False):
                properties["safebill_record_type"] = "feedback"

            created = client.create_ticket(properties)
            feedback_id = created.get("id", "")
            logger.info("HubSpot: created Feedback ticket id=%s", feedback_id)
            return feedback_id
        else:
            # Create as custom object
            client = HubSpotFeedbackClient()

            properties = {
                "username": (username or "").strip(),
                "initiator_email": initiator_email.strip(),
                "description": (description or "")[:65000],
            }

            if metadata and isinstance(metadata, dict):
                if metadata.get("page_url"):
                    properties["page_url"] = str(metadata["page_url"])[:2048]
                if metadata.get("severity"):
                    properties["severity"] = str(metadata["severity"])[:255]
                if metadata.get("submitted_at"):
                    properties["submitted_at"] = str(metadata["submitted_at"])

            created = client.create(properties)
            feedback_id = created.get("id", "")
            logger.info("HubSpot: created Feedback object id=%s", feedback_id)
            
            # Update queue item status if in queue mode
            if queue_item_id:
                try:
                    queue_item.mark_synced()
                    logger.info(f"HubSpot: Marked feedback queue item {queue_item_id} as synced")
                except Exception as e:
                    logger.error(f"HubSpot: Failed to mark feedback queue item as synced: {e}")
            
            return feedback_id

    except Exception as exc:
        logger.exception("HubSpot: create_feedback_task failed: %s", exc)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_failed(str(exc), {"error_type": "sync_error"})
                logger.info(f"HubSpot: Marked feedback queue item {queue_item_id} as failed")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark feedback queue item as failed: {e}")
        
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def create_contact_message_task(self, name: str = None, initiator_email: str = None, subject: str = None, description: str = None, create_ticket: bool = True, metadata: Optional[dict] = None, queue_item_id: int = None) -> str:
    """Unified contact message task that works in both direct and queue modes.
    
    Args:
        name: Contact name (for direct mode)
        initiator_email: Contact email (for direct mode)
        subject: Message subject (for direct mode)
        description: Message content (for direct mode)
        create_ticket: If True, create ticket; if False, create custom object
        metadata: Optional metadata for ticket
        queue_item_id: Queue item ID (for batch processing)
    """
    from .models import HubSpotSyncQueue
    from feedback.models import ContactMessage
    
    try:
        # Handle queue mode
        if queue_item_id:
            try:
                queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
                contact_message = queue_item.content_object
                
                if not isinstance(contact_message, ContactMessage):
                    raise ValueError(f"Expected ContactMessage object, got {type(contact_message)}")
                
                # Extract data from contact message object (no placeholders)
                name = getattr(contact_message, 'name', None)
                initiator_email = getattr(contact_message, 'email', None)
                subject = getattr(contact_message, 'subject', None) or 'Contact Message'
                description = getattr(contact_message, 'message', None) or str(contact_message)

                # Derive sensible name if missing
                if not name and initiator_email:
                    name = initiator_email.split('@')[0]

                # Validate required email
                if not initiator_email:
                    raise ValueError("Contact message email missing; refusing to send placeholder to HubSpot")
                create_ticket = False  # Use custom object for queue processing
                
                logger.info(f"🔄 Processing contact message sync from queue: {contact_message.id}")
            except Exception as e:
                logger.error(f"HubSpot: Failed to get queue item {queue_item_id}: {e}")
                return ""
        else:
            logger.info("HubSpot: create_contact_message_task start (direct mode)")
        
        logger.info("HubSpot: create_contact_message_task name=%s email=%s ticket=%s", name, initiator_email, create_ticket)

        if create_ticket:
            # Create as ticket
            client = HubSpotTicketsClient()
            pipeline = getattr(settings, "HUBSPOT_TICKETS_PIPELINE", "0")
            stage = client.get_first_stage_id(str(pipeline))

            ticket_subject = f"Contact us - {subject or ''}".strip()
            properties = {
                "hs_pipeline": str(pipeline),
                "hs_pipeline_stage": str(stage or "0"),
                "subject": ticket_subject[:255],
                "description": (description or "")[:65000],
                "safebill_initiator_email": (initiator_email or "").strip(),
            }

            # Optional categorization
            if getattr(settings, "HUBSPOT_ENABLE_RECORD_TYPE", False):
                properties["safebill_record_type"] = "contact_us"

            if metadata and isinstance(metadata, dict):
                for key in ["safebill_support_subject", "safebill_support_message", "safebill_page", "safebill_severity"]:
                    value = metadata.get(key)
                    if value:
                        properties[key] = str(value)[:65000]

            created = client.create_ticket(properties)
            message_id = created.get("id", "")
            logger.info("HubSpot: created Contact Us ticket id=%s", message_id)
            return message_id
        else:
            # Create as custom object
            client = HubSpotContactMessageClient()
            properties = {
                "name": (name or "").strip(),
                "initiator_email": initiator_email.strip(),
                "subject": (subject or "")[:255],
                "description": (description or "")[:65000],
            }

            created = client.create(properties)
            message_id = created.get("id", "")
            logger.info("HubSpot: created ContactMessage object id=%s", message_id)
            
            # Update queue item status if in queue mode
            if queue_item_id:
                try:
                    queue_item.mark_synced()
                    logger.info(f"HubSpot: Marked contact message queue item {queue_item_id} as synced")
                except Exception as e:
                    logger.error(f"HubSpot: Failed to mark contact message queue item as synced: {e}")
            
            return message_id

    except Exception as exc:
        logger.exception("HubSpot: create_contact_message_task failed: %s", exc)
        
        # Update queue item status if in queue mode
        if queue_item_id:
            try:
                queue_item.mark_failed(str(exc), {"error_type": "sync_error"})
                logger.info(f"HubSpot: Marked contact message queue item {queue_item_id} as failed")
            except Exception as e:
                logger.error(f"HubSpot: Failed to mark contact message queue item as failed: {e}")
        
        raise


# =============================================================================
# QUEUE PROCESSING TASKS (SYSTEM MANAGEMENT)
# =============================================================================

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=3, queue='emails')
def process_sync_queue(self, batch_size=50):
    """Process pending items in the HubSpot sync queue."""
    from .models import HubSpotSyncQueue
    from django.utils import timezone
    from django.db import models
    import uuid
    
    worker_id = f"{self.request.hostname}-{uuid.uuid4().hex[:8]}"
    logger.info(f"🔄 Starting sync queue processing (worker: {worker_id}, batch_size: {batch_size})")
    
    try:
        # Get pending items that are ready to process
        now = timezone.now()
        pending_items = HubSpotSyncQueue.objects.filter(
            status__in=['pending', 'retry']
        ).filter(
            # Either scheduled_at is None (immediate) or scheduled_at <= now
            models.Q(scheduled_at__isnull=True) | models.Q(scheduled_at__lte=now)
        ).filter(
            # Either next_retry_at is None (no retry needed) or next_retry_at <= now
            models.Q(next_retry_at__isnull=True) | models.Q(next_retry_at__lte=now)
        ).order_by('priority', 'created_at')[:batch_size]
        
        if not pending_items:
            logger.info("📭 No pending sync items found")
            return {"processed": 0, "success": 0, "failed": 0}
        
        logger.info(f"📋 Processing {len(pending_items)} sync items")
        
        processed = 0
        success = 0
        failed = 0
        
        for item in pending_items:
            try:
                # Mark as processing
                item.mark_processing(worker_id)
                
                # Process based on sync type using unified tasks
                if item.sync_type == 'feedback':
                    result = create_feedback_task.delay(queue_item_id=item.id)
                elif item.sync_type == 'dispute':
                    result = sync_dispute_from_queue.delay(item.id)
                elif item.sync_type == 'milestone':
                    result = sync_milestone_task.delay(queue_item_id=item.id)
                elif item.sync_type == 'contact_message':
                    result = create_contact_message_task.delay(queue_item_id=item.id)
                else:
                    logger.warning(f"⚠️ Unknown sync type: {item.sync_type}")
                    item.mark_failed(f"Unknown sync type: {item.sync_type}")
                    failed += 1
                    continue
                
                processed += 1
                logger.info(f"✅ Queued {item.sync_type} sync for {item.content_object}")
                
            except Exception as e:
                logger.error(f"❌ Failed to queue {item.sync_type} sync: {e}", exc_info=True)
                item.mark_failed(str(e), {"error_type": "queue_error"})
                failed += 1
        
        # Count items that were synced since last run (approximate)
        # This gives a better indication of actual success
        from django.utils import timezone
        from datetime import timedelta
        
        # Count items synced in the last 5 minutes (approximate success rate)
        recent_synced = HubSpotSyncQueue.objects.filter(
            status='synced',
            processed_at__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        logger.info(f"🎯 Queue processing completed: {processed} queued, {recent_synced} recently synced, {failed} failed")
        return {"processed": processed, "success": recent_synced, "failed": failed}
        
    except Exception as e:
        logger.error(f"💥 Queue processing failed: {e}", exc_info=True)
        raise


# REMOVED: sync_feedback_from_queue() - functionality merged into create_feedback_task()


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5, queue='emails')
def sync_dispute_from_queue(self, queue_item_id):
    """Process dispute sync from queue."""
    from .models import HubSpotSyncQueue
    from disputes.models import Dispute
    
    try:
        queue_item = HubSpotSyncQueue.objects.get(id=queue_item_id)
        dispute = queue_item.content_object
        
        if not isinstance(dispute, Dispute):
            raise ValueError(f"Expected Dispute object, got {type(dispute)}")
        
        logger.info(f"🔄 Processing dispute sync from queue: {dispute.id}")
        
        # Call the existing dispute sync task
        result = create_dispute_ticket_task(dispute.id)
        
        # Mark as synced
        queue_item.mark_synced()
        
        logger.info(f"✅ Dispute sync completed: {dispute.id}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Dispute sync from queue failed: {e}", exc_info=True)
        if 'queue_item' in locals():
            queue_item.mark_failed(str(e), {"error_type": "sync_error"})
        raise


# REMOVED: sync_contact_message_from_queue() - functionality merged into create_contact_message_task()


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=3, queue='emails')
def cleanup_old_sync_queue_items(self, days_old=7):
    """Clean up old synced items from the queue to prevent database bloat."""
    from .models import HubSpotSyncQueue
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days_old)
        
        # Delete old synced items
        deleted_count = HubSpotSyncQueue.objects.filter(
            status='synced',
            processed_at__lt=cutoff_date
        ).delete()[0]
        
        # Delete old failed items (keep for longer debugging)
        failed_cutoff = timezone.now() - timedelta(days=days_old * 2)
        failed_deleted_count = HubSpotSyncQueue.objects.filter(
            status='failed',
            processed_at__lt=failed_cutoff
        ).delete()[0]
        
        logger.info(f"🧹 Cleaned up {deleted_count} synced items and {failed_deleted_count} failed items")
        return {"synced_deleted": deleted_count, "failed_deleted": failed_deleted_count}
        
    except Exception as e:
        logger.error(f"❌ Queue cleanup failed: {e}", exc_info=True)
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=3, queue='emails')
def retry_failed_sync_items(self):
    """Retry failed sync items that are ready for retry."""
    from .models import HubSpotSyncQueue
    from django.utils import timezone
    
    try:
        now = timezone.now()
        
        # Get items ready for retry
        retry_items = HubSpotSyncQueue.objects.filter(
            status='retry',
            next_retry_at__lte=now
        ).order_by('next_retry_at')[:20]  # Limit to 20 items per run
        
        if not retry_items:
            logger.info("📭 No items ready for retry")
            return {"retried": 0}
        
        retried = 0
        for item in retry_items:
            try:
                # Reset status to pending for retry
                item.status = 'pending'
                item.next_retry_at = None
                item.save(update_fields=['status', 'next_retry_at'])
                
                # Queue for processing using unified tasks
                if item.sync_type == 'feedback':
                    create_feedback_task.delay(queue_item_id=item.id)
                elif item.sync_type == 'dispute':
                    sync_dispute_from_queue.delay(item.id)
                elif item.sync_type == 'milestone':
                    sync_milestone_task.delay(queue_item_id=item.id)
                elif item.sync_type == 'contact_message':
                    create_contact_message_task.delay(queue_item_id=item.id)
                
                retried += 1
                logger.info(f"🔄 Retrying {item.sync_type} sync for {item.content_object}")
                
            except Exception as e:
                logger.error(f"❌ Failed to retry {item.sync_type} sync: {e}", exc_info=True)
                item.mark_failed(str(e), {"error_type": "retry_error"})
        
        logger.info(f"🔄 Retry processing completed: {retried} items retried")
        return {"retried": retried}
        
    except Exception as e:
        logger.error(f"❌ Retry processing failed: {e}", exc_info=True)
        raise

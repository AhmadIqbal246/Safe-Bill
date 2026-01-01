import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotClient:
    def __init__(self) -> None:
        token = getattr(settings, "HUBSPOT_PRIVATE_APP_TOKEN", "")
        if not token:
            logger.warning("HUBSPOT_PRIVATE_APP_TOKEN is not configured.")
        self.base_url = getattr(settings, "HUBSPOT_API_BASE", "https://api.hubapi.com").rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    # ---- Deals ----
    def get_pipeline(self, pipeline_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/pipelines/deals/{pipeline_id}"
        resp = requests.get(url, headers=self.headers, timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot get_deals_pipeline error: %s", resp.text)
            raise
        return resp.json()

    def resolve_stage_id(self, pipeline_id: str, status_label: str) -> Optional[str]:
        """Resolve a dealstage id from current pipeline labels, no env map needed."""
        try:
            data = self.get_pipeline(pipeline_id)
            stages = data.get("stages", [])
            labels_to_id = {str(s.get("label", "")).strip().lower(): str(s.get("id")) for s in stages}
            key = (status_label or "").strip().lower()
            if key in labels_to_id:
                return labels_to_id[key]
            # fallbacks for terminal stages
            fallback_map = {
                "pending": ["pending", "project created", "projets créés", "appointmentscheduled"],
                "payment_in_progress": ["payment_in_progress", "awaiting payment", "attente de paiement", "qualificationsummary"],
                "approved": [
                    "approved",
                    "payment secured (escrow)",
                    "paiement sécurisé",
                    "presentation",
                    "contractsent",
                ],
                "in_progress": ["in_progress", "project in execution", "projet en cours", "decisionmakerboughtin"],
                "completed": ["completed", "closed won", "closedwon", "won", "terminé", "clôturé gagné"],
                "not_approved": ["not_approved", "closed lost", "closedlost", "lost", "refusé", "clôturé perdu"],
            }
            for label in fallback_map.get(key, []):
                lk = label.strip().lower()
                if lk in labels_to_id:
                    return labels_to_id[lk]
            # else return first stage id as last resort
            return str(stages[0]["id"]) if stages else None
        except Exception as exc:
            logger.error("HubSpot resolve_stage_id error: %s", exc)
            return None
    def search_deal_by_project_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Find the single deal associated with this project ID."""
        url = f"{self.base_url}/crm/v3/objects/deals/search"
        payload = {
            "filterGroups": [
                {
                    "filters": [
                        {"propertyName": "project_id", "operator": "EQ", "value": str(project_id)}
                    ]
                }
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot search_deal_by_project_id error: %s", resp.text)
            raise
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None

    def create_deal(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/deals"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot create_deal error: %s", resp.text)
            raise
        return resp.json()

    def update_deal(self, deal_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/deals/{deal_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot update_deal error: %s", resp.text)
            raise
        return resp.json()

    # ---- Associations ----
    def associate_deal_company(self, deal_id: str, company_id: str) -> None:
        url = f"{self.base_url}/crm/v4/associations/deals/companies/batch/create"
        payload = {
            "inputs": [
                {
                    "from": {"id": deal_id},
                    "to": {"id": company_id},
                    "types": [
                        {
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": 341  # Deal to Company
                        }
                    ],
                }
            ]
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot associate_deal_company error: %s", resp.text)
            raise

    def associate_deal_contact(self, deal_id: str, contact_id: str) -> None:
        url = f"{self.base_url}/crm/v4/associations/deals/contacts/batch/create"
        payload = {
            "inputs": [
                {
                    "from": {"id": deal_id},
                    "to": {"id": contact_id},
                    "types": [
                        {
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": 3  # Deal to Contact
                        }
                    ],
                }
            ]
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot associate_deal_contact error: %s", resp.text)
            raise

    def search_contact_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/crm/v3/objects/contacts/search"
        payload = {
            "filterGroups": [
                {
                    "filters": [
                        {"propertyName": "email", "operator": "EQ", "value": email}
                    ]
                }
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot search_contact_by_email error: %s", resp.text)
            return None
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None



def build_deal_properties(project, pipeline_id: Optional[str], dealstage_id: Optional[str]) -> Dict[str, Any]:
    seller_name = getattr(project.user, "username", "")
    buyer = project.client
    buyer_name = f"{getattr(buyer, 'first_name', '')} {getattr(buyer, 'last_name', '')}".strip() or getattr(buyer, "username", "")
    dealname = project.name or f"Project {project.id}"
    # Compute total project amount from installments (fallback to 0 if none)
    try:
        from django.db.models import Sum
        from projects.models import PaymentInstallment
        
        # Use direct DB aggregation for reliability (avoids reverse relation caching issues)
        agg_result = PaymentInstallment.objects.filter(project_id=project.id).aggregate(total=Sum('amount'))
        offset_amount = agg_result.get('total')
        
        if offset_amount is not None:
             total_amount = float(offset_amount)
             logger.info(f"Calculated total_amount for project {project.id} (DB Aggregation): {total_amount}")
        else:
             total_amount = 0.0
             logger.warning(f"Project {project.id} has no installments (DB Aggregation returned None)")
             
    except Exception as e:
        logger.error(f"Failed to compute total_amount for project {project.id}: {e}", exc_info=True)
        total_amount = 0.0

    # Calculate Actual Paid Amounts
    try:
        from django.db.models import Sum
        from payments.models import Payment
        from projects.models import Milestone
        
        # Buyer side: Total of all payments successfully processed (Status = paid)
        # This represents funds currently in Escrow or Paid
        paid_payments = Payment.objects.filter(project_id=project.id, status='paid')
        buyer_paid_total = float(paid_payments.aggregate(total=Sum('buyer_total_amount'))['total'] or 0.0)

        # Seller side: Total of all approved milestones
        # This represents funds actually released to the seller after approval
        approved_milestones = Milestone.objects.filter(project_id=project.id, status='approved')
        seller_paid_base = float(approved_milestones.aggregate(total=Sum('relative_payment'))['total'] or 0.0)
        
        # Apply VAT and Deduct Fee for Seller Net (to match same logic as displayed_amount)
        vat_rate = float(project.vat_rate) if project.vat_rate is not None else 20.0
        fee_pct = float(project.platform_fee_percentage) if project.platform_fee_percentage is not None else 10.0
        
        seller_paid_total = seller_paid_base * (1 + vat_rate / 100.0) * (1 - fee_pct / 100.0)
        
        # Commission Calculations for Forecasting
        # commission_earned is based on approved milestones (base quantity)
        commission_earned = seller_paid_base * (fee_pct / 100.0)
        total_commission_potential = total_amount * (fee_pct / 100.0)
        
    except Exception as e:
        logger.error(f"Failed to calculate paid amounts for project {project.id}: {e}")
        seller_paid_total = 0.0
        buyer_paid_total = 0.0
        commission_earned = 0.0

    # Derive project creation month/year
    created_at = getattr(project, "created_at", None) or getattr(project, "created_date", None)
    if not created_at:
        created_at = datetime.utcnow()
    month_str = created_at.strftime("%m")
    year_num = created_at.year

    # SafeBill Commission Calculations
    vat_rate = float(project.vat_rate) if project.vat_rate is not None else 20.0
    fee_pct = float(project.platform_fee_percentage) if project.platform_fee_percentage is not None else 10.0
    
    # Gross Amount (What the buyer paid: Total project value + VAT)
    buyer_pays_gross = total_amount * (1 + vat_rate / 100.0)
    
    # Total Potential Commission for the whole deal (Based on Base Amount, not including VAT)
    total_platform_fee = total_amount * (fee_pct / 100.0)
    
    # Remaining Forecast (Total Potential - what we already earned)
    # Note: commission_earned is already calculated correctly on base in the blocks above
    commission_remaining = max(0, total_platform_fee - commission_earned)

    # Keep deal name clean with just the project name
    dealname = project.name or f"Project {project.id}"

    # Forecast and Assignment properties
    deal_owner_id = getattr(settings, "HUBSPOT_DEAL_OWNER_ID", "79866344")

    props = {
        # built-ins
        "dealname": dealname,
        # HubSpot built-in amount field = Gross total paid by buyer
        "amount": round(buyer_pays_gross, 2),
        # Force HubSpot to treat the amount as EUR regardless of portal/user defaults
        "deal_currency_code": "EUR",
        # Assignment
        "hubspot_owner_id": deal_owner_id,
    }

    if pipeline_id:
        props["pipeline"] = pipeline_id
    if dealstage_id:
        props["dealstage"] = dealstage_id

    props.update({
        # customs
        "project_id": str(project.id),
        "project_type": project.project_type,
        "project_status": project.status,
        # Mirror status into additional text field "projects" as requested
        "projects": project.status,
        "vat_rate": float(project.vat_rate) if project.vat_rate is not None else None,
        "client_email": project.client_email or "",
        "seller_name": seller_name,
        # Company Info for "Double Sided" Sales/Purchase visibility
        "seller_company_name": getattr(project.user.business_detail, "company_name", "") if hasattr(project.user, "business_detail") else seller_name,
        "buyer_company_name": getattr(project.client.business_detail, "company_name", "") if hasattr(project.client, "business_detail") else buyer_name,
        # Neutral Activity Type for One-Deal marketplace visibility
        "deal_activity_type": "Sale / Purchase",
        # Explicit Counterparty for the shared record
        "counterparty_name": f"Seller: {seller_name} / Buyer: {buyer_name if buyer_name else 'Pending Buyer'}",
        # Paid Amounts Tracking
        "total_seller_paid_amount": seller_paid_total,
        "total_buyer_paid_amount": buyer_paid_total,
        # Commission & Forecasting Sight
        "platform_fee_amount": round(total_platform_fee, 2),
        "commission_earned": round(commission_earned, 2),
        "commission_remaining": round(commission_remaining, 2),
        "platform_fee_percentage": fee_pct,
        # helpful text if not associating yet
        "description": f"Seller: {seller_name} | Client: {project.client_email}",
    })

    # If the project is completed, set the Close Date to help HubSpot Forecasting
    if project.status == "completed":
        from django.utils import timezone
        props["closedate"] = timezone.now().isoformat()
    
    return props



import json
import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings

from projects.models import Milestone


logger = logging.getLogger(__name__)


class HubSpotMilestonesClient:
    """Client for HubSpot Custom Object: Milestone.

    Requires settings.HUBSPOT_MILESTONE_OBJECT to be set to the custom object type
    (e.g., "p1234567_milestone"). Defaults to "milestone" if not configured.
    """

    def __init__(self) -> None:
        token = getattr(settings, "HUBSPOT_PRIVATE_APP_TOKEN", "")
        if not token:
            logger.warning("HUBSPOT_PRIVATE_APP_TOKEN is not configured.")
        self.base_url = getattr(settings, "HUBSPOT_API_BASE", "https://api.hubapi.com").rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        # Use explicit object type name as provided in HubSpot: "MileStones"
        # You can override via settings.HUBSPOT_MILESTONE_OBJECT
        self.object_type = getattr(settings, "HUBSPOT_MILESTONE_OBJECT", "MileStones")
        # Allow custom internal name for the SafeBill project id property
        self.project_id_property = getattr(settings, "HUBSPOT_MILESTONE_PROJECT_ID_PROP", "safebill_project_id")

    def search_by_project_id(self, safebill_project_id: str) -> Optional[Dict[str, Any]]:
        """Find existing summary record by unique SafeBill project id."""
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/search"
        body = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": self.project_id_property,
                            "operator": "EQ",
                            "value": safebill_project_id,
                        }
                    ]
                }
            ],
            "properties": [
                self.project_id_property,
                "project_name",
                "seller_name",
                "total_milestones",
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(body), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot milestone search error: %s", resp.text)
            raise
        results = resp.json().get("results", [])
        return results[0] if results else None

    def search_by_project(self, project_name: str, seller_name: str) -> Optional[Dict[str, Any]]:
        """Best-effort search using available summary fields to find existing record."""
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/search"
        filters = []
        if project_name:
            filters.append({
                "propertyName": "project_name",
                "operator": "EQ",
                "value": project_name,
            })
        if seller_name:
            filters.append({
                "propertyName": "seller_name",
                "operator": "EQ",
                "value": seller_name,
            })
        body = {
            "filterGroups": [{"filters": filters}] if filters else [],
            "properties": [
                "project_name",
                "seller_name",
                "total_milestones",
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(body), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot milestone search error: %s", resp.text)
            raise
        results = resp.json().get("results", [])
        return results[0] if results else None

    def create(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot milestone create error: %s", resp.text)
            raise
        return resp.json()

    def update(self, hs_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/{hs_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot milestone update error: %s", resp.text)
            raise
        return resp.json()


def build_milestone_properties(m: Milestone) -> Dict[str, Any]:
    def normalize_status(value: Optional[str]) -> str:
        if not value:
            return "not_submitted"
        v = str(value).strip().lower()
        mapping = {
            "not_submitted": "not_submitted",
            "draft": "not_submitted",
            "new": "not_submitted",
            "pending": "pending",
            "submitted": "pending",
            "submit": "pending",
            "review_request": "pending",
            "in_progress": "pending",
            "awaiting_approval": "pending",
            "approved": "approved",
            "accepted": "approved",
            "rejected": "not_approved",
            "declined": "not_approved",
            "not_approved": "not_approved",
            "payment_withdrawal": "payment_withdrawal",
            "withdrawal_requested": "payment_withdrawal",
            "payout_requested": "payment_withdrawal",
        }
        return mapping.get(v, "not_submitted")
    project = m.project
    seller = getattr(project, "user", None)
    buyer = getattr(project, "client", None)

    seller_name = None
    if seller:
        seller_name = getattr(seller, "get_full_name", lambda: None)() or getattr(seller, "username", None) or getattr(seller, "email", None)

    buyer_name = None
    if buyer:
        buyer_name = getattr(buyer, "get_full_name", lambda: None)() or getattr(buyer, "username", None) or getattr(buyer, "email", None)
    # Resolve client email (prefer linked buyer user email, fallback to project.client_email field)
    client_email = None
    if buyer and getattr(buyer, "email", None):
        client_email = buyer.email
    else:
        client_email = getattr(project, "client_email", "") or ""

    # Count of milestones for required/primary property in HubSpot
    try:
        total_count = project.milestones.count()
    except Exception:
        total_count = 0

    # Prepare first three milestones summary
    milestones = list(project.milestones.order_by("created_date")[:3])
    def get_m(i: int) -> Optional[Milestone]:
        return milestones[i] if i < len(milestones) else None
    m1, m2, m3 = get_m(0), get_m(1), get_m(2)

    # Instantiate a client to read the configured project id property name
    client = HubSpotMilestonesClient()
    project_id_prop = getattr(client, "project_id_property", "safebill_project_id")

    properties: Dict[str, Any] = {
        # Summary fields matching your schema
        project_id_prop: str(project.id),
        "project_name": project.name,
        "seller_name": seller_name or "",
        "client_email": client_email or "",

        # Totals (primary display property is required)
        "total_milestones": str(total_count),
        "total_milestones_num": total_count,

        # First milestone trio
        "m1_name": (m1.name if m1 else "") if hasattr(m1, "name") else "",
        "m1_status": normalize_status(getattr(m1, "status", None)) if m1 else "not_submitted",
        "m1_amount": float(m1.relative_payment) if (m1 and getattr(m1, "relative_payment", None) is not None) else 0,

        "m2_name": (m2.name if m2 else "") if hasattr(m2, "name") else "",
        "m2_status": normalize_status(getattr(m2, "status", None)) if m2 else "not_submitted",
        "m2_amount": float(m2.relative_payment) if (m2 and getattr(m2, "relative_payment", None) is not None) else 0,

        "m3_name": (m3.name if m3 else "") if hasattr(m3, "name") else "",
        "m3_status": normalize_status(getattr(m3, "status", None)) if m3 else "not_submitted",
        "m3_amount": float(m3.relative_payment) if (m3 and getattr(m3, "relative_payment", None) is not None) else 0,
    }

    # Remove None values
    return {k: v for k, v in properties.items() if v is not None}



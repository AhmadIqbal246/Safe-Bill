import json
import logging
from typing import Optional, Dict, Any

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotClient:
    """Minimal HubSpot client for contacts using Private App token."""

    def __init__(self) -> None:
        token = getattr(settings, "HUBSPOT_PRIVATE_APP_TOKEN", "")
        if not token:
            logger.warning("HUBSPOT_PRIVATE_APP_TOKEN is not configured.")
        self.base_url = getattr(settings, "HUBSPOT_API_BASE", "https://api.hubapi.com").rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    # ---- Contacts ----
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
            raise
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None

    def create_contact(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/contacts"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot create_contact error: %s", resp.text)
            raise
        return resp.json()

    def update_contact(self, contact_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/contacts/{contact_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot update_contact error: %s", resp.text)
            raise
        return resp.json()


def build_contact_properties(user) -> Dict[str, Any]:
    """Map accounts.User to HubSpot contact properties.

    Populate firstname/lastname from available sources so HubSpot's Name column
    doesn't fall back to the email. Priority:
    1) user.first_name / user.last_name
    2) business_detail.company_contact_person_first_name/last_name (for seller/pro-buyer)
    3) user.username as firstname (lastname empty)
    4) local-part of email as firstname
    """
    # Resolve names with sensible fallbacks
    bd = getattr(user, "business_detail", None)
    first_name = (getattr(user, "first_name", None) or
                  (getattr(bd, "company_contact_person_first_name", None) if bd else None) or
                  getattr(user, "username", None) or
                  (getattr(user, "email", "").split("@")[0] if getattr(user, "email", None) else ""))
    last_name = (getattr(user, "last_name", None) or
                 (getattr(bd, "company_contact_person_last_name", None) if bd else None) or
                 "")

    # Determine whether the user has a SIRET number on file
    has_siret_number = bool(getattr(bd, "siret_number", None))

    # Compute total number of projects the user is involved in (as owner or client), regardless of status
    try:
        from django.db.models import Q
        from projects.models import Project

        total_projects_count = (
            Project.objects.filter(Q(user=user) | Q(client=user))
            .values("id").distinct().count()
        )
    except Exception:
        # Be defensive: if projects app is unavailable in a context, don't break contact sync
        total_projects_count = 0
    
    # Get lifetime metrics from Balance model
    total_spent = 0
    total_earnings = 0
    try:
        if hasattr(user, 'balance'):
            total_spent = float(user.balance.total_spent)
            total_earnings = float(user.balance.total_earnings)
            
            # Log individual contact GMV
            contact_gmv_msg = f"👤 User Sync GMV (UID: {user.id}): Spent: ${total_spent:,.2f}, Earnings: ${total_earnings:,.2f}"
            print(contact_gmv_msg)
            logger.info(contact_gmv_msg)
    except Exception:
        pass

    return {
        "email": getattr(user, "email", "") or "",
        "firstname": first_name or "",
        "lastname": last_name or "",
        "phone": getattr(user, "phone_number", "") or "",
        "role": getattr(user, "role", "") or "",
        "language": "en",
        # Send booleans for Single checkbox properties
        "is_email_verified": bool(getattr(user, "is_email_verified", False)),
        "onboarding_complete": bool(getattr(user, "onboarding_complete", False)),
        # New: expose whether a SIRET number exists for this user (Contact boolean property in HubSpot)
        "has_siret_number": has_siret_number,
        # New: total projects the user is involved in (Contact number property in HubSpot)
        "total_projects_count": int(total_projects_count),
        # Lifetime metrics
        "total_spent": total_spent,
        "total_earnings": total_earnings,
    }



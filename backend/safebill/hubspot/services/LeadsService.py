import json
import logging
from typing import Any, Dict, Optional, List

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotLeadsClient:
    """Client for HubSpot Custom Object: Lead.

    Configure in Django settings/env:
      - HUBSPOT_PRIVATE_APP_TOKEN
      - HUBSPOT_API_BASE (optional)
      - HUBSPOT_LEAD_OBJECT (API name, e.g. p123456_lead)
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
        # Default to HubSpot's standard Leads object
        self.object_type = getattr(settings, "HUBSPOT_LEAD_OBJECT", "leads")
        # Cached association type ids
        self._lead_to_primary_contact_type_id: Optional[int] = None
        self._lead_to_primary_company_type_id: Optional[int] = None

    def _map_object_to_type_id(self, obj: str) -> str:
        """Map object names to HubSpot object type IDs used by v4 associations.

        Known IDs:
          - leads:    0-136
          - contacts: 0-1
          - companies:0-2
        """
        mapping = {
            "leads": "0-136",
            "contacts": "0-1",
            "companies": "0-2",
        }
        return mapping.get(obj, obj)

    def _get_association_type_id(self, from_object: str, to_object: str, expected_name: str) -> Optional[int]:
        """Fetch association type id via v4 associations labels endpoint using type IDs."""
        from_id = self._map_object_to_type_id(from_object)
        to_id = self._map_object_to_type_id(to_object)
        url = f"{self.base_url}/crm/v4/associations/{from_id}/{to_id}/labels"
        resp = requests.get(url, headers=self.headers, timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot associations labels error (%s → %s): %s", from_id, to_id, resp.text)
            return None
        data = resp.json()
        results = data.get("results", [])
        # Prefer exact name match when available
        for item in results:
            if item.get("name") == expected_name and item.get("associationCategory") == "HUBSPOT_DEFINED":
                return item.get("associationTypeId")
        # Fallback to any HUBSPOT_DEFINED label containing Primary
        for item in results:
            label = str(item.get("label", "")).lower()
            if item.get("associationCategory") == "HUBSPOT_DEFINED" and "primary" in label:
                return item.get("associationTypeId")
        logger.error("No matching association type id found for %s → %s", from_object, to_object)
        return None

    def _ensure_association_type_ids(self) -> None:
        # Allow override via settings if provided
        if self._lead_to_primary_contact_type_id is None and getattr(settings, "HUBSPOT_LEAD_TO_PRIMARY_CONTACT_TYPE_ID", None):
            try:
                self._lead_to_primary_contact_type_id = int(getattr(settings, "HUBSPOT_LEAD_TO_PRIMARY_CONTACT_TYPE_ID"))
            except Exception:
                pass
        if self._lead_to_primary_contact_type_id is None:
            self._lead_to_primary_contact_type_id = self._get_association_type_id("leads", "contacts", "LEAD_TO_PRIMARY_CONTACT")
        if self._lead_to_primary_company_type_id is None and getattr(settings, "HUBSPOT_LEAD_TO_PRIMARY_COMPANY_TYPE_ID", None):
            try:
                self._lead_to_primary_company_type_id = int(getattr(settings, "HUBSPOT_LEAD_TO_PRIMARY_COMPANY_TYPE_ID"))
            except Exception:
                pass
        if self._lead_to_primary_company_type_id is None:
            self._lead_to_primary_company_type_id = self._get_association_type_id("leads", "companies", "LEAD_TO_PRIMARY_COMPANY")

    def create(self, properties: Dict[str, Any], contact_id: Optional[str] = None, company_id: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}"
        logger.info("HubSpotLeadsClient: creating object in type=%s", self.object_type)

        payload: Dict[str, Any] = {"properties": properties}
        associations: List[Dict[str, Any]] = []

        if contact_id or company_id:
            self._ensure_association_type_ids()
            if contact_id and self._lead_to_primary_contact_type_id:
                associations.append({
                    "to": {"id": str(contact_id)},
                    "types": [
                        {
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": self._lead_to_primary_contact_type_id,
                        }
                    ],
                })
            if company_id and self._lead_to_primary_company_type_id:
                associations.append({
                    "to": {"id": str(company_id)},
                    "types": [
                        {
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": self._lead_to_primary_company_type_id,
                        }
                    ],
                })

        if associations:
            payload["associations"] = associations

        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=30)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot lead create error: %s", resp.text)
            raise
        return resp.json()



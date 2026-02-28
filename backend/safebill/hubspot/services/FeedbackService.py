import json
import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotFeedbackClient:
    """Client for HubSpot Custom Object: Feedback.

    Configure in Django settings:
      - HUBSPOT_PRIVATE_APP_TOKEN
      - HUBSPOT_API_BASE (optional, default https://api.hubapi.com)
      - HUBSPOT_FEEDBACK_OBJECT (custom object name, e.g. p123456_feedback)
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
        # Example: p243761680_feedback (must match the custom object API name in HubSpot)
        self.object_type = getattr(settings, "HUBSPOT_FEEDBACK_OBJECT", "p243761680_feedback")

    def create(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot feedback create error: %s", resp.text)
            raise
        return resp.json()

    def update(self, hs_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/{hs_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot feedback update error: %s", resp.text)
            raise
        return resp.json()

    def search_by_external_id(self, external_id_property: str, external_id_value: str) -> Optional[Dict[str, Any]]:
        """Optional helper to find an existing feedback by an external id property.

        Requires that the HubSpot custom object has the property created and set as unique.
        """
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/search"
        body = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": external_id_property,
                            "operator": "EQ",
                            "value": external_id_value,
                        }
                    ]
                }
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(body), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot feedback search error: %s", resp.text)
            raise
        results = resp.json().get("results", [])
        return results[0] if results else None






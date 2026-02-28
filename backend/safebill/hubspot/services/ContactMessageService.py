import json
import logging
from typing import Any, Dict

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotContactMessageClient:
    """Client for HubSpot Custom Object: ContactMessage.

    Configure in Django settings/env:
      - HUBSPOT_PRIVATE_APP_TOKEN
      - HUBSPOT_API_BASE (optional)
      - HUBSPOT_CONTACT_MESSAGE_OBJECT (API name, e.g. p243761680_contact_message)
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
        self.object_type = getattr(settings, "HUBSPOT_CONTACT_MESSAGE_OBJECT", "p243761680_contact_message")

    def create(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot contact-message create error: %s", resp.text)
            raise
        return resp.json()



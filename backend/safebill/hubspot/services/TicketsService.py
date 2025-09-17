import json
import logging
from typing import Dict, Any

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotTicketsClient:
    def __init__(self) -> None:
        token = getattr(settings, "HUBSPOT_PRIVATE_APP_TOKEN", "")
        if not token:
            logger.warning("HUBSPOT_PRIVATE_APP_TOKEN is not configured.")
        self.base_url = getattr(settings, "HUBSPOT_API_BASE", "https://api.hubapi.com").rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def create_ticket(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/tickets"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot create_ticket error: %s", resp.text)
            raise
        return resp.json()

    def update_ticket(self, ticket_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/tickets/{ticket_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot update_ticket error: %s", resp.text)
            raise
        return resp.json()

    def get_pipeline(self, pipeline_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/pipelines/tickets/{pipeline_id}"
        resp = requests.get(url, headers=self.headers, timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot get_pipeline error: %s", resp.text)
            raise
        return resp.json()

    def get_first_stage_id(self, pipeline_id: str) -> str:
        try:
            data = self.get_pipeline(pipeline_id)
            stages = data.get("stages", [])
            return str(stages[0]["id"]) if stages else ""
        except Exception:
            return ""



import json
import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HubSpotRevenueClient:
    """Client for HubSpot Custom Object: Revenue (monthly summaries)."""

    def __init__(self) -> None:
        token = getattr(settings, "HUBSPOT_PRIVATE_APP_TOKEN", "")
        if not token:
            logger.warning("HUBSPOT_PRIVATE_APP_TOKEN is not configured.")
        self.base_url = getattr(settings, "HUBSPOT_API_BASE", "https://api.hubapi.com").rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        self.object_type = getattr(settings, "HUBSPOT_REVENUE_OBJECT", "p146671560_revenue")
        # Default to 'period' without requiring settings.py
        self.period_key_property = getattr(settings, "HUBSPOT_REVENUE_PERIOD_KEY_PROP", "period")

    def search_by_period(self, period_key: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/search"
        body = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": self.period_key_property,
                            "operator": "EQ",
                            "value": period_key,
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
            logger.error("HubSpot revenue search error: %s", resp.text)
            raise
        results = resp.json().get("results", [])
        return results[0] if results else None

    def create(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot revenue create error: %s", resp.text)
            raise
        return resp.json()

    def update(self, hs_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/{self.object_type}/{hs_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot revenue update error: %s", resp.text)
            raise
        return resp.json()



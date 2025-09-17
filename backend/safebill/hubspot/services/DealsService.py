import json
import logging
from typing import Optional, Dict, Any

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
                "completed": ["completed", "closed won", "closedwon", "won"],
                "not_approved": ["not_approved", "closed lost", "closedlost", "lost"],
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


def build_deal_properties(project, pipeline_id: str, dealstage_id: Optional[str]) -> Dict[str, Any]:
    seller_name = getattr(project.user, "username", "")
    dealname = project.name or f"Project {project.id}"
    return {
        # built-ins
        "dealname": dealname,
        "pipeline": pipeline_id,
        "dealstage": str(dealstage_id) if dealstage_id else None,
        # customs
        "project_id": str(project.id),
        "project_type": project.project_type,
        "project_status": project.status,
        "vat_rate": float(project.vat_rate) if project.vat_rate is not None else None,
        "client_email": project.client_email or "",
        "seller_name": seller_name,
        # helpful text if not associating yet
        "description": f"Seller: {seller_name} | Client: {project.client_email}",
    }



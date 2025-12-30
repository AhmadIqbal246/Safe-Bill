import logging
import json
from typing import Dict, Any, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class DeletedUserService:
    """
    Service for syncing deleted user records to HubSpot custom object.
    """
    def __init__(self):
        self.api_key = getattr(settings, "HUBSPOT_PRIVATE_APP_TOKEN", "")
        self.base_url = getattr(settings, "HUBSPOT_API_BASE", "https://api.hubapi.com").rstrip("/")
        # Set this to your HubSpot custom object type (e.g., 'p_deleted_user')
        self.object_type = getattr(settings, "HUBSPOT_DELETED_USER_OBJECT")
        self.object_endpoint = f"/crm/v3/objects/{self.object_type}"

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            if method.upper() == "POST":
                resp = requests.post(url, headers=headers, data=json.dumps(data), timeout=20)
            elif method.upper() == "PATCH":
                resp = requests.patch(url, headers=headers, data=json.dumps(data), timeout=20)
            else:
                raise ValueError(f"Unsupported method: {method}")
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.error(f"HubSpot API error: {e} - Response: {getattr(e.response, 'text', '')}")
            return None

    def build_deleted_user_properties(self, deleted_user) -> Dict[str, Any]:
        """
        Map DeletedUser model to HubSpot custom object properties.
        """
        return {
            "email": getattr(deleted_user, "original_email", ""),
            "username": getattr(deleted_user, "original_username", ""),
            "role": getattr(deleted_user, "original_role", ""),
            "deleted_at": getattr(deleted_user, "deleted_at").isoformat() if getattr(deleted_user, "deleted_at", None) else "",
            "account_created_at": getattr(deleted_user, "account_created_at").isoformat() if getattr(deleted_user, "account_created_at", None) else "",
        }

    def create_deleted_user_record(self, deleted_user) -> Optional[str]:
        """
        Create a deleted user record in HubSpot custom object.
        Returns HubSpot object ID if successful.
        """
        properties = self.build_deleted_user_properties(deleted_user)
        data = {"properties": properties}
        response = self._make_request("POST", self.object_endpoint, data)
        if response and "id" in response:
            logger.info(f"Created deleted user record in HubSpot with id={response['id']}")
            return response["id"]
        logger.error(f"Failed to create deleted user record in HubSpot: {response}")
        return None

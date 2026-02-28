import json
import logging
import re
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

    # ---- Companies ----
    def search_company_by_siret(self, siret_number: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/crm/v3/objects/companies/search"
        # Normalize SIRET (strip spaces)
        normalized = (siret_number or "").replace(" ", "").strip()
        payload = {
            "filterGroups": [
                {
                    "filters": [
                        {"propertyName": "siret_number", "operator": "EQ", "value": normalized}
                    ]
                }
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot search_company_by_siret error: %s", resp.text)
            raise
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None

    def search_company_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Search company by name (fallback when SIRET / domain not available)."""
        if not name:
            return None
        url = f"{self.base_url}/crm/v3/objects/companies/search"
        # Use tokenized contains to better match minor variations
        payload = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "name",
                            "operator": "CONTAINS_TOKEN",
                            "value": name.strip(),
                        }
                    ]
                }
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot search_company_by_name error: %s", resp.text)
            raise
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None

    def search_company_by_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Search company by primary domain.

        This lets us detect HubSpot's auto-created domain companies (which have
        no name/SIRET yet) and update them instead of creating duplicates.
        """
        if not domain:
            return None

        url = f"{self.base_url}/crm/v3/objects/companies/search"
        payload = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "domain",
                            "operator": "EQ",
                            "value": domain.strip().lower(),
                        }
                    ]
                }
            ],
            "limit": 1,
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot search_company_by_domain error: %s", resp.text)
            raise
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None

    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single company with key properties used for placeholder detection."""
        if not company_id:
            return None

        url = f"{self.base_url}/crm/v3/objects/companies/{company_id}"
        params = {
            "properties": "name,siret_number,domain,company_email"
        }
        resp = requests.get(url, headers=self.headers, params=params, timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot get_company error: %s", resp.text)
            raise
        return resp.json()

    def create_company(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/companies"
        resp = requests.post(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot create_company error: %s", resp.text)
            raise
        return resp.json()

    def update_company(self, company_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/crm/v3/objects/companies/{company_id}"
        resp = requests.patch(url, headers=self.headers, data=json.dumps({"properties": properties}), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot update_company error: %s", resp.text)
            raise
        return resp.json()

    # ---- Associations ----
    def associate_contact_company(self, contact_id: str, company_id: str) -> None:
        url = f"{self.base_url}/crm/v4/associations/contacts/companies/batch/create"
        payload = {
            "inputs": [
                {
                    "from": {"id": contact_id},
                    "to": {"id": company_id},
                    "type": "contact_to_company",
                }
            ]
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot associate_contact_company error: %s", resp.text)
            raise

    def disassociate_contact_company(self, contact_id: str, company_id: str) -> None:
        """
        Remove association between a contact and a company.

        Uses the v4 batch archive endpoint.
        """
        url = f"{self.base_url}/crm/v4/associations/contacts/companies/batch/archive"
        payload = {
            "inputs": [
                {
                    "from": {"id": contact_id},
                    "to": {"id": company_id},
                    "type": "contact_to_company",
                }
            ]
        }
        resp = requests.post(url, headers=self.headers, data=json.dumps(payload), timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot disassociate_contact_company error: %s", resp.text)
            raise

    def get_contact_companies(self, contact_id: str) -> Dict[str, Any]:
        """
        Get all companies associated with a contact.

        Returns the raw HubSpot API response (id list).
        """
        url = f"{self.base_url}/crm/v4/objects/contacts/{contact_id}/associations/companies"
        resp = requests.get(url, headers=self.headers, timeout=20)
        try:
            resp.raise_for_status()
        except requests.HTTPError:
            logger.error("HubSpot get_contact_companies error: %s", resp.text)
            raise


def build_company_properties(bd) -> Dict[str, Any]:
    def join_list(value):
        if isinstance(value, list):
            return ",".join(map(str, value))
        return value or ""

    def parse_address_components(full_address: str) -> Dict[str, str]:
        """Attempt to split the stored full address into street, postal code, and city."""
        components = {"street": "", "postal_code": "", "city": ""}
        if not isinstance(full_address, str):
            return components

        parts = [part.strip() for part in full_address.split(",") if part.strip()]
        if parts:
            components["street"] = parts[0]

        # Heuristic: payload is usually "street, postal, city"
        if len(parts) >= 2:
            potential_postal = parts[1]
            digits_only = potential_postal.replace(" ", "")
            if digits_only.isdigit():
                components["postal_code"] = potential_postal
                if len(parts) >= 3:
                    components["city"] = parts[2]
            else:
                components["city"] = potential_postal
        if not components["city"] and len(parts) >= 3:
            components["city"] = parts[-1]

        if not components["postal_code"]:
            match = re.search(r"\b\d{4,6}\b", full_address)
            if match:
                components["postal_code"] = match.group(0)

        return components

    full_address = getattr(bd, "full_address", "") or ""
    address_parts = parse_address_components(full_address)
    user = getattr(bd, "user", None)
    email = getattr(user, "email", "") or ""

    # Derive primary domain from the user's email so HubSpot can treat this
    # company as the canonical domain-based company for that contact.
    domain = ""
    if email and "@" in email:
        try:
            domain = email.split("@", 1)[1].lower().strip()
        except Exception:
            domain = ""

    return {
        "name": getattr(bd, "company_name", "") or "",
        "address": address_parts.get("street") or full_address,
        "city": address_parts.get("city", ""),
        "zip": address_parts.get("postal_code", ""),
        "phone": getattr(user, "phone_number", "") or "",
        "siret_number": getattr(bd, "siret_number", "") or "",
        "type_of_activity": getattr(bd, "type_of_activity", "") or "",
        # Primary domain used by HubSpot's automatic company/contact logic.
        # Having this set ensures our company record becomes the canonical
        # domain company instead of HubSpot creating an empty placeholder.
        "domain": domain,
        # Company email (create Company property: Label "Email", Internal name "company_email")
        "company_email": getattr(user, "email", "") or "",
        # Keep service_areas only if you created this property in HubSpot
        # Remove below line if you didn't create it there
        "service_areas": join_list(getattr(bd, "selected_service_areas", [])),
        # Contact person fields (ensure these custom properties exist in HubSpot)
        "contact_person_first_name": getattr(bd, "company_contact_person_first_name", "") or "",
        "contact_person_last_name": getattr(bd, "company_contact_person_last_name", "") or "",
    }



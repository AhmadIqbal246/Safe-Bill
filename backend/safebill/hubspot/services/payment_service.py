"""
HubSpot Payment Service

This service handles creating and updating payment records in HubSpot's custom "Payments" object.
It integrates with the existing payment system to sync payment status changes to HubSpot.
"""

import logging
from typing import Optional, Dict, Any
from django.conf import settings
import requests
from payments.models import Payment
from projects.models import Project

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Service class for managing payment records in HubSpot's custom "Payments" object.
    
    This service handles:
    - Creating new payment records in HubSpot
    - Updating existing payment records
    - Syncing payment status changes
    - Linking payments to projects and contacts
    """
    
    def __init__(self):
        """Initialize the HubSpot API client."""
        self.api_key = settings.HUBSPOT_PRIVATE_APP_TOKEN
        self.base_url = "https://api.hubapi.com"
        self.payments_object = getattr(settings, 'HUBSPOT_PAYMENTS_OBJECT', 'payments')
        
    def _make_request(self, method: str, endpoint: str, data: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Make HTTP request to HubSpot API."""
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == "PATCH":
                response = requests.patch(url, headers=headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            # Capture detailed error response from HubSpot
            error_detail = ""
            try:
                if hasattr(e.response, 'text'):
                    error_detail = f" - Response: {e.response.text[:500]}"
                if hasattr(e.response, 'json'):
                    try:
                        error_json = e.response.json()
                        error_detail = f" - Response: {error_json}"
                    except:
                        pass
            except:
                pass
            logger.error(f"HubSpot API HTTP error: {e}{error_detail}")
            logger.error(f"Request URL: {url}")
            if data:
                # Log data but filter out sensitive info
                safe_data = {k: v for k, v in data.items() if k != 'Authorization'}
                logger.error(f"Request data: {safe_data}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"HubSpot API request failed: {e}")
            return None
        
    def update_project_payment_record(self, project: Project, payment: Payment) -> bool:
        """
        Update an existing HubSpot payment record with real payment data.
        This is used when a payment is initiated for a project.
        
        Args:
            project: Project model instance with hubspot_payment_id
            payment: Payment model instance with real payment data
            
        Returns:
            True if successful, False otherwise
        """
        # Attempt to find the existing HubSpot payment record for this project
        hubspot_payment_id = self._find_payment_record_id_for_project(project)
        if not hubspot_payment_id:
            # Do NOT create a new record here; caller expects update-only semantics
            logger.warning(
                f"No existing HubSpot payment record found for project {project.id}; "
                f"skipping create to avoid duplicates"
            )
            return False
        
        try:
            # Prepare updated payment data
            payment_data = self._prepare_payment_data(payment)
            
            # Preserve the intended payment name format across updates
            # Always keep: "<Project Name> - payment"
            payment_data["payment_name"] = f"{project.name} - payment"
            
            # Update the existing HubSpot payment record
            endpoint = f"/crm/v3/objects/{self.payments_object}/{hubspot_payment_id}"
            data = {"properties": payment_data}
            
            response = self._make_request("PATCH", endpoint, data)
            
            if response:
                logger.info(f"Updated HubSpot payment record {hubspot_payment_id} for project {project.id}")
                return True
            else:
                logger.error(f"Failed to update HubSpot payment record for project {project.id}")
                return False
            
        except Exception as e:
            logger.error(f"Unexpected error updating project payment record: {e}")
            return False

    def update_payment_record_for_project(self, payment: Payment) -> bool:
        """
        Update payment record by locating it via the owning project (no local HubSpot ID required).
        """
        project = payment.project
        return self.update_project_payment_record(project, payment)

    def _find_payment_record_id_for_project(self, project: Project) -> Optional[str]:
        """
        Find the HubSpot Payments object record ID corresponding to a given project.
        Preferred search is by exact payment_name: "<Project Name> - payment".
        Falls back to CONTAINS search on project name if needed.
        """
        try:
            endpoint = f"/crm/v3/objects/{self.payments_object}/search"
            # 1) Try exact match on current naming convention
            exact_name = f"{project.name} - payment"
            search_payload_eq = {
                "filterGroups": [
                    {
                        "filters": [
                            {
                                "propertyName": "payment_name",
                                "operator": "EQ",
                                "value": exact_name
                            }
                        ]
                    }
                ],
                "properties": [
                    "payment_name",
                    "payment_status"
                ],
                "limit": 1
            }
            response = self._make_request("POST", endpoint, search_payload_eq)
            if response and response.get("results"):
                return response["results"][0].get("id")

            # 2) Fallback: project name token search (handles legacy names)
            search_payload_contains = {
                "filterGroups": [
                    {
                        "filters": [
                            {
                                "propertyName": "payment_name",
                                "operator": "CONTAINS_TOKEN",
                                "value": str(project.name)[:50]  # safety limit
                            }
                        ]
                    }
                ],
                "properties": [
                    "payment_name",
                    "payment_status"
                ],
                "limit": 1
            }
            response = self._make_request("POST", endpoint, search_payload_contains)
            if response and response.get("results"):
                return response["results"][0].get("id")

            return None
        except Exception as e:
            logger.error(f"Error searching HubSpot payment record for project {project.id}: {e}")
            return None

    def create_project_payment_record(self, project: Project) -> Optional[str]:
        """
        Create a HubSpot payment record directly from a project (without Payment object).
        This is used when projects are created to track payment status in HubSpot.
        
        Args:
            project: Project model instance
            
        Returns:
            HubSpot payment record ID if successful, None otherwise
        """
        try:
            # Prepare payment data from project
            payment_data = self._prepare_project_payment_data(project)
            
            # Log the data being sent for debugging
            logger.info(f"Creating HubSpot payment record for project {project.id} with data: {payment_data}")
            
            # Create the payment record in HubSpot
            endpoint = f"/crm/v3/objects/{self.payments_object}"
            data = {"properties": payment_data}
            
            # Add associations if project has HubSpot deal ID
            if hasattr(project, 'hubspot_deal_id') and project.hubspot_deal_id:
                data["associations"] = [
                    {
                        "to": {"id": str(project.hubspot_deal_id)},
                        "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 3}]
                    }
                ]
            
            response = self._make_request("POST", endpoint, data)
            
            if response and "id" in response:
                hubspot_payment_id = response["id"]
                
                # Store the HubSpot ID in project for future reference
                # We'll add a field to store this if needed
                logger.info(f"Created HubSpot payment record {hubspot_payment_id} for project {project.id}")
                return hubspot_payment_id
            else:
                logger.error(f"Failed to create HubSpot payment record for project {project.id}")
                return None
            
        except Exception as e:
            logger.error(f"Unexpected error creating project payment record: {e}")
            return None

    def create_payment_record(self, payment: Payment) -> Optional[str]:
        """
        Create a new payment record in HubSpot's custom "Payments" object.
        
        Args:
            payment: Payment model instance
            
        Returns:
            HubSpot payment record ID if successful, None otherwise
        """
        try:
            # Prepare payment data for HubSpot
            payment_data = self._prepare_payment_data(payment)
            
            # Create the payment record in HubSpot
            endpoint = f"/crm/v3/objects/{self.payments_object}"
            data = {"properties": payment_data}
            
            # Add associations if project has HubSpot deal ID
            if hasattr(payment.project, 'hubspot_deal_id') and payment.project.hubspot_deal_id:
                data["associations"] = [
                    {
                        "to": {"id": str(payment.project.hubspot_deal_id)},
                        "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 3}]
                    }
                ]
            
            response = self._make_request("POST", endpoint, data)
            
            if response and "id" in response:
                hubspot_payment_id = response["id"]
                
                # Update the payment model with HubSpot ID
                payment.hubspot_payment_id = hubspot_payment_id
                payment.save(update_fields=['hubspot_payment_id'])
                
                logger.info(f"Created HubSpot payment record {hubspot_payment_id} for payment {payment.id}")
                return hubspot_payment_id
            else:
                logger.error(f"Failed to create HubSpot payment record for payment {payment.id}")
                return None
            
        except Exception as e:
            logger.error(f"Unexpected error creating payment record: {e}")
            return None
    
    def update_payment_record(self, payment: Payment) -> bool:
        """
        Update an existing payment record in HubSpot.
        
        Args:
            payment: Payment model instance with updated data
            
        Returns:
            True if successful, False otherwise
        """
        if not payment.hubspot_payment_id:
            logger.warning(f"Payment {payment.id} has no HubSpot ID, creating new record")
            return self.create_payment_record(payment) is not None
        
        try:
            # Prepare updated payment data
            payment_data = self._prepare_payment_data(payment)
            
            # Update the payment record in HubSpot
            endpoint = f"/crm/v3/objects/{self.payments_object}/{payment.hubspot_payment_id}"
            data = {"properties": payment_data}
            
            response = self._make_request("PATCH", endpoint, data)
            
            if response:
                logger.info(f"Updated HubSpot payment record {payment.hubspot_payment_id} for payment {payment.id}")
                return True
            else:
                logger.error(f"Failed to update HubSpot payment record for payment {payment.id}")
                return False
            
        except Exception as e:
            logger.error(f"Unexpected error updating payment record: {e}")
            return False
    
    def sync_payment_status(self, payment: Payment) -> bool:
        """
        Sync payment status changes to HubSpot.
        
        This method handles both creating new payment records and updating existing ones.
        It will create a record for any payment status (pending, paid, failed).
        
        Args:
            payment: Payment model instance
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if payment record exists in HubSpot
            if payment.hubspot_payment_id:
                # Update existing record
                logger.info(f"Updating existing HubSpot payment record for payment {payment.id}")
                return self.update_payment_record(payment)
            else:
                # Create new record (for any status: pending, paid, failed)
                logger.info(f"Creating new HubSpot payment record for payment {payment.id} with status: {payment.status}")
                hubspot_id = self.create_payment_record(payment)
                return hubspot_id is not None
                
        except Exception as e:
            logger.error(f"Error syncing payment status for payment {payment.id}: {e}")
            return False
    
    def get_payment_record(self, hubspot_payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a payment record from HubSpot.
        
        Args:
            hubspot_payment_id: HubSpot payment record ID
            
        Returns:
            Payment record data if found, None otherwise
        """
        try:
            endpoint = f"/crm/v3/objects/{self.payments_object}/{hubspot_payment_id}"
            params = {
                "properties": "payment_name,buyer_email,seller_email,project_name,vat_rate,total_project_amount,payment_status"
            }
            
            response = self._make_request("GET", f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
            
            if response and "properties" in response:
                return response["properties"]
            else:
                logger.error(f"Failed to retrieve HubSpot payment record {hubspot_payment_id}")
                return None
                
        except Exception as e:
            logger.error(f"Unexpected error retrieving payment record: {e}")
            return None
    
    def _prepare_project_payment_data(self, project: Project) -> Dict[str, Any]:
        """
        Prepare payment data for HubSpot API directly from project.
        
        Args:
            project: Project model instance
            
        Returns:
            Dictionary with payment properties for HubSpot
        """
        # Calculate total project amount from installments
        total_project_amount = sum(float(inst.amount) for inst in project.installments.all())
        # Calculate total (incl. VAT)
        vat_rate = float(project.vat_rate) if project.vat_rate else 0.0
        # Ensure total_project_amount_with_vat is always a valid number
        if total_project_amount > 0:
            total_project_amount_with_vat = round(total_project_amount * (1 + (vat_rate / 100.0)), 2)
        else:
            total_project_amount_with_vat = 0.0
        
        # Ensure values are floats, not None (HubSpot Number fields require valid numbers)
        total_project_amount = float(total_project_amount) if total_project_amount else 0.0
        total_project_amount_with_vat = float(total_project_amount_with_vat) if total_project_amount_with_vat else 0.0
        
        # Prepare data, ensuring no None values (HubSpot doesn't accept None)
        data = {
            "payment_name": f"{project.name} - payment",
            "project_name": project.name or "",
            "vat_rate": float(vat_rate) if vat_rate else 0.0,
            "total_project_amount": total_project_amount,
            "total_project_amount_with_vat": total_project_amount_with_vat,
            "payment_status": "pending",  # Always pending when project is created
        }
        
        # Only add email fields if they exist (HubSpot doesn't accept None)
        if project.client and getattr(project.client, 'email', None):
            data["buyer_email"] = project.client.email
        elif getattr(project, 'client_email', None):
            # Fallback to stored client_email on Project when client FK is not set yet
            data["buyer_email"] = project.client_email
        else:
            data["buyer_email"] = ""  # Empty string instead of None
            
        if project.user and project.user.email:
            data["seller_email"] = project.user.email
        else:
            data["seller_email"] = ""  # Empty string instead of None
        
        return data

    def _prepare_payment_data(self, payment: Payment) -> Dict[str, Any]:
        """
        Prepare payment data for HubSpot API.
        
        Args:
            payment: Payment model instance
            
        Returns:
            Dictionary with payment properties for HubSpot
        """
        project = payment.project
        
        # Calculate total project amount from installments (consistent with project creation)
        # This represents the base project amount, not the buyer total (which includes VAT)
        total_project_amount = sum(float(inst.amount) for inst in project.installments.all())
        # Calculate total (incl. VAT). Prefer payment.buyer_total_amount when present.
        vat_rate = float(project.vat_rate) if project.vat_rate else 0.0
        if getattr(payment, 'buyer_total_amount', None) and payment.buyer_total_amount:
            total_project_amount_with_vat = float(payment.buyer_total_amount)
        else:
            # Calculate if buyer_total_amount is not available
            if total_project_amount > 0:
                total_project_amount_with_vat = round(total_project_amount * (1 + (vat_rate / 100.0)), 2)
            else:
                total_project_amount_with_vat = 0.0
        
        # Ensure values are floats, not None (HubSpot Number fields require valid numbers)
        total_project_amount = float(total_project_amount) if total_project_amount else 0.0
        total_project_amount_with_vat = float(total_project_amount_with_vat) if total_project_amount_with_vat else 0.0
        
        # Prepare data, ensuring no None values (HubSpot doesn't accept None)
        data = {
            "payment_name": f"{project.name} - payment",
            "project_name": project.name or "",
            "vat_rate": float(vat_rate) if vat_rate else 0.0,
            "total_project_amount": total_project_amount,  # Use consistent calculation
            "total_project_amount_with_vat": total_project_amount_with_vat,
            "payment_status": payment.status or "pending",
        }
        
        # Only add email fields if they exist (HubSpot doesn't accept None)
        if project.client and getattr(project.client, 'email', None):
            data["buyer_email"] = project.client.email
        elif getattr(project, 'client_email', None):
            data["buyer_email"] = project.client_email
        else:
            data["buyer_email"] = ""  # Empty string instead of None
            
        if project.user and project.user.email:
            data["seller_email"] = project.user.email
        else:
            data["seller_email"] = ""  # Empty string instead of None
        
        return data
    
    def bulk_sync_payments(self, payment_ids: list) -> Dict[str, Any]:
        """
        Sync multiple payments to HubSpot.
        
        Args:
            payment_ids: List of payment IDs to sync
            
        Returns:
            Dictionary with sync results
        """
        results = {
            "success": [],
            "failed": [],
            "total": len(payment_ids)
        }
        
        for payment_id in payment_ids:
            try:
                payment = Payment.objects.get(id=payment_id)
                if self.sync_payment_status(payment):
                    results["success"].append(payment_id)
                else:
                    results["failed"].append(payment_id)
            except Payment.DoesNotExist:
                logger.error(f"Payment {payment_id} not found")
                results["failed"].append(payment_id)
            except Exception as e:
                logger.error(f"Error syncing payment {payment_id}: {e}")
                results["failed"].append(payment_id)
        
        logger.info(f"Bulk sync completed: {len(results['success'])} success, {len(results['failed'])} failed")
        return results
    
    def delete_payment_record(self, hubspot_payment_id: str) -> bool:
        """
        Delete a payment record from HubSpot.
        
        Args:
            hubspot_payment_id: HubSpot payment record ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            endpoint = f"/crm/v3/objects/{self.payments_object}/{hubspot_payment_id}"
            response = self._make_request("DELETE", endpoint)
            
            if response is not None:  # DELETE returns empty response on success
                logger.info(f"Archived HubSpot payment record {hubspot_payment_id}")
                return True
            else:
                logger.error(f"Failed to archive HubSpot payment record {hubspot_payment_id}")
                return False
            
        except Exception as e:
            logger.error(f"Unexpected error deleting payment record: {e}")
            return False

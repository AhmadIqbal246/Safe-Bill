from django.db import models
from accounts.models import User
from accounts.models import BusinessDetail
from disputes.models import Dispute


class HubSpotContactLink(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="hubspot_contact_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Contact Link"
        verbose_name_plural = "HubSpot Contact Links"


class HubSpotCompanyLink(models.Model):
    business_detail = models.OneToOneField(
        BusinessDetail,
        on_delete=models.CASCADE,
        related_name="hubspot_company_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Company Link"
        verbose_name_plural = "HubSpot Company Links"


class HubSpotTicketLink(models.Model):
    dispute = models.OneToOneField(
        Dispute,
        on_delete=models.CASCADE,
        related_name="hubspot_ticket_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Ticket Link"
        verbose_name_plural = "HubSpot Ticket Links"

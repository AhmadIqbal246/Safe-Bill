from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StripeAccount(models.Model):
    """
    Model to store Stripe Connect account information for sellers
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="stripe_account"
    )
    account_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text="Stripe Connect account ID",
    )
    account_status = models.CharField(
        max_length=20,
        choices=[
            ("onboarding", "Onboarding"),
            ("pending", "Pending"),
            ("active", "Active"),
            ("restricted", "Restricted"),
            ("disconnected", "Disconnected"),
        ],
        default="onboarding",
        blank=True,
        help_text="Current status of the Stripe Connect account",
    )
    onboarding_complete = models.BooleanField(
        default=False, help_text="Whether Stripe Connect onboarding is complete"
    )
    account_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional Stripe account data and requirements",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Stripe Account"
        verbose_name_plural = "Stripe Accounts"

    def __str__(self):
        return f"{self.user.email} - {self.account_status}"

    @property
    def is_fully_active(self):
        """Check if the Stripe account is fully active and ready for payments"""
        return (
            self.account_status == "active"
            and self.onboarding_complete
            and self.account_data.get("charges_enabled", False)
            and self.account_data.get("payouts_enabled", False)
        )


class StripeIdentity(models.Model):
    """
    Model to store Stripe Identity verification information for professional buyers
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="stripe_identity"
    )
    verification_session_id = models.CharField(
        max_length=999,
        blank=True,
        null=True,
        unique=True,
        help_text="Stripe Identity verification session ID",
    )
    identity_status = models.CharField(
        max_length=20,
        choices=[
            ("not_started", "Not Started"),
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("requires_input", "Requires Input"),
            ("verified", "Verified"),
            ("canceled", "Canceled"),
            ("failed", "Failed"),
        ],
        default="not_started",
        help_text="Current status of identity verification",
    )
    identity_verified = models.BooleanField(
        default=False, help_text="Whether identity verification is complete"
    )
    verification_data = models.JSONField(
        default=dict, blank=True, help_text="Additional verification data and errors"
    )
    verified_at = models.DateTimeField(
        null=True, blank=True, help_text="When identity verification was completed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Stripe Identity"
        verbose_name_plural = "Stripe Identities"

    def __str__(self):
        return f"{self.user.email} - {self.identity_status}"

    @property
    def is_verified(self):
        """Check if identity verification is complete"""
        return self.identity_verified and self.identity_status == "verified"

from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from projects.models import Project
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import logging

User = get_user_model()

STATUS_CHOICES = [
    ("pending", "Pending"),
    ("paid", "Paid"),
    ("failed", "Failed"),
]

TRANSFER_STATUS = [
    ("pending", "Pending"),
    ("in_transit", "In Transit"),
    ("paid", "Paid"),
    ("failed", "Failed"),
    ("canceled", "Canceled"),
]


# Create your models here.
class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2) # #original amount at the moment of buyer payment
    platform_fee_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    stripe_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    buyer_total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seller_net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    stripe_payment_id = models.CharField(max_length=255)
    webhook_response = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.amount} - {self.status}"


class PlatformFeeConfig(models.Model):
    """
    Dynamic platform fee configuration.
    buyer_fee_pct: percentage (0.00 - 1.00) charged to buyer on top of base amount
    seller_fee_pct: percentage (0.00 - 1.00) deducted from seller's base amount
    Only one active config should be used at a time; latest created is used if multiple are active.
    """

    buyer_fee_pct = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        default=0.05,
    )
    seller_fee_pct = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        default=0.05,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Platform Fee Configuration"
        verbose_name_plural = "Platform Fee Configurations"

    def __str__(self):
        return f"PlatformFeeConfig(buyer={self.buyer_fee_pct}, seller={self.seller_fee_pct}, active={self.is_active})"

    @classmethod
    def current(cls):
        cfg = cls.objects.filter(is_active=True).order_by("-created_at").first()
        if cfg:
            return cfg
        # Fallback default
        return cls(buyer_fee_pct=0, seller_fee_pct=0.05, is_active=True)


class Balance(models.Model):
    """
    Tracks a user's wallet balance and total lifetime earnings.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="balance")
    currency = models.CharField(max_length=10, default="EUR")
    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Current available balance",
    )
    available_for_payout = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Funds that have cleared the hold period and can be paid out",
    )
    total_earnings = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Cumulative earnings (all time)",
    )
    # Buyer metrics
    total_spent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Total amount the user has spent as a buyer",
    )
    held_in_escrow = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Funds currently held for ongoing projects (escrow)",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Balance"
        verbose_name_plural = "Balances"

    def __str__(self):
        return f"Balance({self.user.email}) {self.current_balance} {self.currency}"


class Payout(models.Model):
    """
    Simplified model to track transfers from platform to seller's Stripe Connect accounts
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payouts")
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    currency = models.CharField(max_length=10, default="EUR")
    status = models.CharField(max_length=20, choices=TRANSFER_STATUS, default="pending")

    # Stripe transfer details
    stripe_transfer_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Stripe transfer id (tr_...)",
    )
    stripe_account_id = models.CharField(
        max_length=255,
        help_text="Destination Stripe Connect account id (acct_...)",
    )

    # Timeline
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Failure details
    failure_reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["stripe_transfer_id"]),
        ]

    def __str__(self):
        return (
            f"Transfer({self.user.email}) {self.amount} {self.currency} - {self.status}"
        )


class PayoutHold(models.Model):
    """
    Tracks funds that are on hold before becoming available for payout.
    Each record represents an amount that will be released after a hold period.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="payout_holds"
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="payout_holds"
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    currency = models.CharField(max_length=10, default="EUR")
    hold_until = models.DateTimeField(
        help_text="Datetime when this hold will be released"
    )
    released = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "released", "hold_until"]),
            models.Index(fields=["project"]),
        ]

    def __str__(self):
        status = "released" if self.released else "on_hold"
        return f"PayoutHold({self.user.email}) {self.amount} {self.currency} - {status} until {self.hold_until}"


#1000 = payment amount (from buyer)
# 2 miletonses : 1st = 600 , 2nd = 400, total ammount = 1st + 2nd

# Refundable amount = 1st milestone = 500, 
#  paymenmt ammount - paid (milestones that are approved) = new total amount
# new total amount - miletones that are not approved = refundable amount 
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
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
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


class Refund(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    stripe_refund_id = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Refund({self.user.email}) {self.amount} - {self.status}"


# 1000 = payment amount (from buyer)
# 2 miletonses : 1st = 600 , 2nd = 400, total ammount = 1st + 2nd

# Refundable amount = 1st milestone = 500,
#  paymenmt ammount - paid (milestones that are approved) = new total amount
# new total amount - miletones that are not approved = refundable amount

from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from projects.models import Project

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

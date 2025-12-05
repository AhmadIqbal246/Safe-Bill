from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal


User = get_user_model()


SUBSCRIPTION_STATUS_CHOICES = [
    ("active", "Active"),
    ("trialing", "Trialing"),
    ("past_due", "Past due"),
    ("canceled", "Canceled"),
    ("unpaid", "Unpaid"),
    ("incomplete", "Incomplete"),
    ("incomplete_expired", "Incomplete expired"),
]


class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="subscription")
    stripe_customer_id = models.CharField(max_length=255, blank=True, default="")
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default="", db_index=True)
    status = models.CharField(
        max_length=50,
        choices=SUBSCRIPTION_STATUS_CHOICES,
        blank=True,
        default="",
    )
    current_period_end = models.DateTimeField(null=True, blank=True)
    membership_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"

    def __str__(self):
        return f"Subscription({self.user.email}) {self.status}"


class SubscriptionInvoice(models.Model):
    """
    Model to store monthly subscription invoices for sellers.
    Created when a subscription payment is successfully processed.
    Fixed amount: €3.00 per month
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="subscription_invoices"
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="invoices"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # €3.00 fixed
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[('paid', 'Paid'), ('pending', 'Pending')],
        default='pending'
    )
    stripe_invoice_id = models.CharField(max_length=255, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-billing_period_start']
        verbose_name = "Subscription Invoice"
        verbose_name_plural = "Subscription Invoices"

    def __str__(self):
        return f"Subscription Invoice {self.id} - {self.user.email} - {self.billing_period_start} to {self.billing_period_end}"


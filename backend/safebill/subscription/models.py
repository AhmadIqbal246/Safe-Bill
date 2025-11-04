from django.db import models
from django.contrib.auth import get_user_model


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



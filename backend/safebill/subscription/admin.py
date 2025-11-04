from .models import Subscription
from django.contrib import admin


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "status",
        "membership_active",
        "current_period_end",
        "stripe_customer_id",
        "stripe_subscription_id",
        "updated_at",
    )
    list_filter = ("status", "membership_active")
    search_fields = ("user__email", "stripe_customer_id", "stripe_subscription_id")
    list_select_related = ("user",)
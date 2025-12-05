from .models import Subscription, SubscriptionInvoice
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


@admin.register(SubscriptionInvoice)
class SubscriptionInvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "amount",
        "status",
        "billing_period_start",
        "billing_period_end",
        "created_at",
    )
    list_filter = ("status", "created_at", "billing_period_start")
    search_fields = ("user__email", "user__username", "stripe_invoice_id")
    readonly_fields = ("created_at", "updated_at", "stripe_invoice_id")
    list_select_related = ("user", "subscription")
    date_hierarchy = "created_at"
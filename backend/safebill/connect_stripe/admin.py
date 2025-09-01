from django.contrib import admin
from .models import StripeAccount, StripeIdentity


@admin.register(StripeAccount)
class StripeAccountAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "account_id",
        "account_status",
        "onboarding_complete",
        "created_at",
        "updated_at",
    ]
    list_filter = ["account_status", "onboarding_complete", "created_at"]
    search_fields = ["user__email", "user__username", "account_id"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("User Information", {"fields": ("user",)}),
        (
            "Stripe Account Details",
            {"fields": ("account_id", "account_status", "onboarding_complete")},
        ),
        ("Account Data", {"fields": ("account_data",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(StripeIdentity)
class StripeIdentityAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "verification_session_id",
        "identity_status",
        "identity_verified",
        "verified_at",
        "created_at",
        "updated_at",
    ]
    list_filter = ["identity_status", "identity_verified", "created_at"]
    search_fields = ["user__email", "user__username", "verification_session_id"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("User Information", {"fields": ("user",)}),
        (
            "Verification Details",
            {
                "fields": (
                    "verification_session_id",
                    "identity_status",
                    "identity_verified",
                    "verified_at",
                )
            },
        ),
        (
            "Verification Data",
            {"fields": ("verification_data",), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

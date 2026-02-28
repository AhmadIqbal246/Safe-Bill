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


#  this block is added just for testing purpose, to change the stripe identity status and is_pro_buyer_onboarding complete status
    def save_model(self, request, obj, form, change):
        # Save the StripeIdentity first
        super().save_model(request, obj, form, change)

        # After saving, sync the user's pro buyer onboarding flag based on identity status
        try:
            user = obj.user
            should_complete = obj.identity_verified and obj.identity_status == "verified"

            if user.pro_buyer_onboarding_complete != should_complete:
                user.pro_buyer_onboarding_complete = should_complete
                user.save(update_fields=["pro_buyer_onboarding_complete"])
        except Exception:
            # Admin should not crash on sync errors; errors will be visible elsewhere (logs)
            pass
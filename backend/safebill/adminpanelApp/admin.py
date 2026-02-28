from django.contrib import admin
from .models import PlatformRevenue

# Register your models here.


@admin.register(PlatformRevenue)
class PlatformRevenueAdmin(admin.ModelAdmin):
    list_display = [
        "year",
        "month",
        "seller_revenue",
        "vat_collected",
        "total_revenue",
        "total_payments",
        "total_milestones_approved",
        "updated_at",
    ]
    list_filter = ["year", "month"]
    search_fields = ["year", "month"]
    readonly_fields = ["total_revenue", "created_at", "updated_at"]
    ordering = ["-year", "-month"]

    fieldsets = (
        ("Period", {"fields": ("year", "month")}),
        (
            "Revenue Breakdown",
            {"fields": ("seller_revenue", "vat_collected", "total_revenue")},
        ),
        (
            "Transaction Counts",
            {"fields": ("total_payments", "total_milestones_approved")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).order_by("-year", "-month")

    def has_add_permission(self, request):
        # Only allow adding through the service methods
        return False

    def has_delete_permission(self, request, obj=None):
        # Prevent deletion to maintain revenue data integrity
        return False

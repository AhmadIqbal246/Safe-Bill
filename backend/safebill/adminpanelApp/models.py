from django.db import models
from django.utils import timezone
from decimal import Decimal

# Create your models here.


class PlatformRevenue(models.Model):
    """
    Track platform revenue from buyers and sellers with monthly breakdown
    """

    # Monthly tracking
    year = models.IntegerField()
    month = models.IntegerField()  # 1-12

    # Revenue from buyers (platform_fee_amount from payments)
    buyer_revenue = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Revenue from buyer fees"
    )

    # Revenue from sellers (seller fee deducted from their earnings)
    seller_revenue = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Revenue from seller fees"
    )

    # Total platform revenue
    total_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total platform revenue (buyer + seller)",
    )

    # Transaction counts
    total_payments = models.PositiveIntegerField(default=0)
    total_milestones_approved = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["year", "month"]
        ordering = ["-year", "-month"]
        verbose_name = "Platform Revenue"
        verbose_name_plural = "Platform Revenues"

    def __str__(self):
        return f"Revenue {self.year}-{self.month:02d}: {self.total_revenue} EUR"

    def save(self, *args, **kwargs):
        # Auto-calculate total revenue
        self.total_revenue = self.buyer_revenue + self.seller_revenue
        super().save(*args, **kwargs)

    @classmethod
    def get_or_create_current_month(cls):
        """Get or create revenue record for current month"""
        now = timezone.now()
        return cls.objects.get_or_create(
            year=now.year,
            month=now.month,
            defaults={
                "buyer_revenue": Decimal("0.00"),
                "seller_revenue": Decimal("0.00"),
                "total_revenue": Decimal("0.00"),
                "total_payments": 0,
                "total_milestones_approved": 0,
            },
        )

    @classmethod
    def get_monthly_revenue(cls, year, month):
        """Get revenue for specific month"""
        try:
            return cls.objects.get(year=year, month=month)
        except cls.DoesNotExist:
            return None

    @classmethod
    def get_total_revenue(cls):
        """Get total platform revenue across all months"""
        total = cls.objects.aggregate(
            total_buyer=models.Sum("buyer_revenue"),
            total_seller=models.Sum("seller_revenue"),
            total_platform=models.Sum("total_revenue"),
        )
        return {
            "buyer_revenue": total["total_buyer"] or Decimal("0.00"),
            "seller_revenue": total["total_seller"] or Decimal("0.00"),
            "total_revenue": total["total_platform"] or Decimal("0.00"),
        }

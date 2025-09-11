from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import PlatformRevenue
from payments.models import Payment
from payments.services import FeeCalculationService
from projects.models import Milestone
import logging

logger = logging.getLogger(__name__)


class RevenueService:
    """
    Service class for managing platform revenue tracking
    """

    @staticmethod
    def add_seller_revenue(milestone_amount, platform_fee_percentage, vat_rate):
        """
        Add seller revenue when a milestone is approved.
        This is called when a milestone is approved by the buyer.

        Args:
            milestone_amount: Amount for this specific milestone
        """
        try:
            with transaction.atomic():
                # Calculate seller fee using centralized service
                fees = FeeCalculationService.calculate_fees(
                    milestone_amount, platform_fee_percentage, vat_rate
                )
                seller_fee_amount = fees["platform_fee"]

                revenue_record, created = PlatformRevenue.get_or_create_current_month()

                # Add seller revenue
                revenue_record.seller_revenue += seller_fee_amount
                revenue_record.total_milestones_approved += 1
                revenue_record.save()

                logger.info(f"Added seller revenue: {seller_fee_amount} EUR")
                return revenue_record

        except Exception as e:
            logger.error(f"Error adding seller revenue: {e}")
            raise

    @staticmethod
    def get_current_month_revenue():
        """
        Get revenue for current month
        """
        return PlatformRevenue.get_or_create_current_month()[0]

    @staticmethod
    def get_monthly_revenue(year, month):
        """
        Get revenue for specific month
        """
        return PlatformRevenue.get_monthly_revenue(year, month)

    @staticmethod
    def get_total_revenue():
        """
        Get total platform revenue across all months
        """
        return PlatformRevenue.get_total_revenue()

    @staticmethod
    def get_revenue_summary():
        """
        Get comprehensive revenue summary
        """
        current_month = RevenueService.get_current_month_revenue()
        total_revenue = RevenueService.get_total_revenue()

        return {
            "current_month": {
                "year": current_month.year,
                "month": current_month.month,
                "vat_collected": current_month.vat_collected,
                "seller_revenue": current_month.seller_revenue,
                "total_revenue": current_month.total_revenue,
                "total_payments": current_month.total_payments,
                "total_milestones_approved": current_month.total_milestones_approved,
            },
            "total_revenue": total_revenue,
            "last_updated": current_month.updated_at,
        }

    @staticmethod
    def recalculate_monthly_revenue(year, month):
        """
        Recalculate revenue for a specific month from actual payment data.
        This can be used for data integrity checks.
        """

        try:
            with transaction.atomic():
                # Get all payments for the month
                start_date = timezone.datetime(year, month, 1)
                if month == 12:
                    end_date = timezone.datetime(year + 1, 1, 1)
                else:
                    end_date = timezone.datetime(year, month + 1, 1)

                payments = Payment.objects.filter(
                    status="paid", created_at__gte=start_date, created_at__lt=end_date
                )

                # Calculate vat collected
                vat_collected = sum(p.buyer_total_amount - p.amount for p in payments)

                # Calculate seller revenue from approved milestones
                milestones = Milestone.objects.filter(
                    status="approved",
                    completion_date__gte=start_date,
                    completion_date__lt=end_date,
                )

                seller_revenue = Decimal("0.00")

                for milestone in milestones:
                    # Calculate seller fee for this milestone using centralized service
                    fees = FeeCalculationService.calculate_fees(
                        milestone.relative_payment,
                        milestone.project.platform_fee_percentage,
                        milestone.project.vat_rate,
                    )
                    seller_fee_amount = fees["seller_fee_amount"]
                    seller_revenue += seller_fee_amount

                # Update or create revenue record
                revenue_record, created = PlatformRevenue.objects.get_or_create(
                    year=year,
                    month=month,
                    defaults={
                        "vat_collected": vat_collected,
                        "seller_revenue": seller_revenue,
                        "total_payments": payments.count(),
                        "total_milestones_approved": milestones.count(),
                    },
                )

                if not created:
                    revenue_record.vat_collected = vat_collected
                    revenue_record.seller_revenue = seller_revenue
                    revenue_record.total_payments = payments.count()
                    revenue_record.total_milestones_approved = milestones.count()
                    revenue_record.save()

                logger.info(
                    f"Recalculated revenue for {year}-{month:02d}: {revenue_record.total_revenue} EUR"
                )
                return revenue_record

        except Exception as e:
            logger.error(f"Error recalculating revenue for {year}-{month:02d}: {e}")
            raise

    @staticmethod
    def get_revenue_months_for_chart():
        """
        Get revenue data formatted for chart display (last 7 months)
        Always shows last 7 months, even if some have zero revenue
        """
        try:
            # Get current date
            now = timezone.now()

            # Generate last 7 months (including current month)
            chart_data = []
            revenues_dict = {}

            # Get all existing revenue records
            existing_revenues = PlatformRevenue.objects.all()
            for revenue in existing_revenues:
                key = f"{revenue.year}-{revenue.month:02d}"
                revenues_dict[key] = revenue

            # Generate last 7 months data
            for i in range(6, -1, -1):  # 6 months ago to current month
                # Calculate the date for this month
                target_date = now
                for _ in range(i):
                    # Go back one month
                    if target_date.month == 1:
                        target_date = target_date.replace(
                            year=target_date.year - 1, month=12
                        )
                    else:
                        target_date = target_date.replace(month=target_date.month - 1)

                year = target_date.year
                month = target_date.month
                key = f"{year}-{month:02d}"

                # Get revenue for this month (0 if no record exists)
                revenue_amount = 0
                if key in revenues_dict:
                    revenue_amount = float(revenues_dict[key].total_revenue)

                # Format month name
                month_name = target_date.strftime("%b")

                chart_data.append({"month": month_name, "revenue": revenue_amount})

            # Calculate change percentage (current month vs previous month)
            change_percent = 0
            if len(chart_data) >= 2:
                current_revenue = chart_data[-1]["revenue"]  # Last month (current)
                previous_revenue = chart_data[-2]["revenue"]  # Second to last month
                if previous_revenue > 0:
                    change_percent = round(
                        ((current_revenue - previous_revenue) / previous_revenue) * 100
                    )

            return {"chart_data": chart_data, "change_percent": change_percent}

        except Exception as e:
            logger.error(f"Error getting revenue chart data: {e}")
            # Return empty data on error
            return {"chart_data": [], "change_percent": 0}

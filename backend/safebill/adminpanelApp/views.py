from datetime import timedelta
import logging

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

from disputes.models import Dispute, DisputeEvent
from notifications.models import Notification
from .permissions import IsAdminRole, IsSuperAdmin, IsAdmin
from .services import RevenueService
from .models import PlatformRevenue

logger = logging.getLogger(__name__)


User = get_user_model()


class AdminOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        # Basic KPI counts
        user_count = User.objects.count()

        # Get real transaction count from revenue data
        revenue_summary = RevenueService.get_revenue_summary()
        transactions_count = revenue_summary.get("current_month", {}).get(
            "total_payments", 0
        )

        # Registration trends - last 7 months including current
        now = timezone.now()
        trend = []
        for i in range(6, -1, -1):
            # Walk back i months by iteratively subtracting 1 month
            d = now
            for _ in range(i):
                d = d.replace(day=1) - timedelta(days=1)
            start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # First day of the next month
            end = (d.replace(day=28) + timedelta(days=4)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            count = User.objects.filter(
                date_joined__gte=start, date_joined__lt=end
            ).count()
            month_label = start.strftime("%b")
            trend.append({"month": month_label, "value": count})

        # Registration change percentage (last 30 days vs previous 30 days)
        start_current = now - timedelta(days=30)
        start_previous = now - timedelta(days=60)
        current_30d = User.objects.filter(date_joined__gte=start_current).count()
        previous_30d = User.objects.filter(
            date_joined__gte=start_previous,
            date_joined__lt=start_current,
        ).count()
        denom = previous_30d if previous_30d != 0 else 1
        registration_change = round(((current_30d - previous_30d) / denom) * 100)

        # Get real revenue data
        revenue_months = RevenueService.get_revenue_months_for_chart()
        revenue = revenue_months.get("chart_data", [])
        revenue_change = revenue_months.get("change_percent", 0)

        return Response(
            {
                "kpis": {
                    "userCount": user_count,
                    "transactions": transactions_count,
                    "disputes": Dispute.objects.count(),
                },
                "registrationTrend": trend,
                "revenueBars": revenue,
                "registrationChangePercent": registration_change,
                "revenueChangePercent": revenue_change,
            }
        )


class AdminUsersListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        role = request.query_params.get("role")
        if role not in {"seller", "buyer", "professional-buyer"}:
            return Response({"detail": "Invalid or missing role"}, status=400)

        users = User.objects.filter(role=role).order_by("id")
        data = [
            {
                "id": u.id,
                "name": (u.get_full_name() or u.username or u.email),
                "email": u.email,
                "status": "Active" if u.is_active else "Inactive",
                "is_admin": u.is_admin,
            }
            for u in users
        ]

        return Response({"results": data})


class SuperAdminUsersListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """Get all users with their admin status for super-admin management"""
        users = User.objects.exclude(role="super-admin").order_by("id")
        data = [
            {
                "id": u.id,
                "name": (u.get_full_name() or u.username or u.email),
                "email": u.email,
                "role": u.role,
                "status": "Active" if u.is_active else "Inactive",
                "is_admin": u.is_admin,
            }
            for u in users
        ]

        return Response({"results": data})


class AdminManagementAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        """Toggle admin status for a user"""
        user_id = request.data.get("user_id")
        is_admin = request.data.get("is_admin", False)

        if not user_id:
            return Response(
                {"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)

            # Prevent super-admin from modifying other super-admins
            if user.role == "super-admin":
                return Response(
                    {"detail": "Cannot modify super-admin users"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            user.is_admin = is_admin
            user.save()

            return Response(
                {
                    "message": f"Admin status updated for {user.email}",
                    "user_id": user.id,
                    "is_admin": user.is_admin,
                }
            )

        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CurrentAdminsListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """Get list of current admins (users with is_admin=True)"""
        admins = (
            User.objects.filter(is_admin=True)
            .exclude(role="super-admin")
            .order_by("id")
        )
        data = [
            {
                "id": u.id,
                "name": (u.get_full_name() or u.username or u.email),
                "email": u.email,
                "role": u.role,
                "status": "Active" if u.is_active else "Inactive",
                "is_admin": u.is_admin,
            }
            for u in admins
        ]

        return Response({"results": data})


class SuperAdminDisputesListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """List disputes for super-admin with minimal info."""
        disputes = Dispute.objects.select_related(
            "initiator", "respondent", "assigned_mediator", "project"
        ).order_by("-created_at")
        data = []
        for d in disputes:
            data.append(
                {
                    "id": d.id,
                    "dispute_id": d.dispute_id,
                    "title": d.title,
                    "status": d.status,
                    "initiator": d.initiator.email,
                    "respondent": d.respondent.email,
                    "assigned_mediator": (
                        d.assigned_mediator.email if d.assigned_mediator else None
                    ),
                    "created_at": d.created_at,
                }
            )
        return Response({"results": data})


class AssignMediatorAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        """Assign an admin as mediator to a dispute."""
        dispute_id = request.data.get("dispute_id")
        mediator_id = request.data.get("mediator_id")
        if not dispute_id or not mediator_id:
            return Response(
                {"detail": "dispute_id and mediator_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            dispute = Dispute.objects.only(
                "id", "initiator_id", "respondent_id", "status", "assigned_mediator_id"
            ).get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response({"detail": "Dispute not found"}, status=404)

        # Prevent assigning mediator if dispute is already finalized
        if dispute.status in {"resolved", "closed"}:
            return Response(
                {
                    "detail": (
                        "Cannot assign mediator when dispute is " "resolved or closed"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            mediator = User.objects.only("id").get(
                id=mediator_id,
                is_admin=True,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Mediator not found or not eligible"},
                status=404,
            )

        # Prevent re-assigning to the same mediator
        if dispute.assigned_mediator_id == mediator.id:
            return Response(
                {"detail": "Dispute already assigned to this mediator"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent assigning initiator/respondent as mediator
        if mediator.id in {dispute.initiator_id, dispute.respondent_id}:
            return Response(
                {"detail": "Initiator or respondent cannot be mediator"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dispute.assigned_mediator = mediator
        dispute.status = "mediation_initiated"
        dispute.save()
        DisputeEvent.objects.create(
            dispute=dispute,
            event_type="mediation_initiated",
            description=(
                "Mediator assigned: "
                + (
                    (
                        mediator.get_full_name() or getattr(mediator, "username", "")
                    ).strip()
                )
                + " "
                + getattr(mediator, "email", "")
            ),
            created_by=request.user,
        )

        # Send notifications to all parties
        mediator_name = mediator.get_full_name() or mediator.username
        dispute_title = dispute.title or f"Dispute {dispute.dispute_id}"

        # Notify initiator
        initiator_message = (
            f"Mediator {mediator_name} ({mediator.email}) "
            f"has been assigned to your dispute: {dispute_title}"
        )
        Notification.objects.create(user=dispute.initiator, message=initiator_message)

        # Notify respondent
        respondent_message = (
            f"Mediator {mediator_name} ({mediator.email}) "
            f"has been assigned to your dispute: {dispute_title}"
        )
        Notification.objects.create(user=dispute.respondent, message=respondent_message)

        # Notify mediator
        mediator_message = (
            f"You have been assigned as mediator for dispute: " f"{dispute_title}"
        )
        Notification.objects.create(user=mediator, message=mediator_message)

        return Response(
            {
                "message": "Mediator assigned",
                "dispute_id": dispute.id,
                "mediator": mediator.email,
                "status": dispute.status,
            }
        )


class AdminAssignedDisputesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """List disputes assigned to the current admin user."""
        disputes = (
            Dispute.objects.filter(assigned_mediator=request.user)
            .select_related("initiator", "respondent", "project")
            .order_by("-created_at")
        )
        data = []
        for d in disputes:
            data.append(
                {
                    "id": d.id,
                    "dispute_id": d.dispute_id,
                    "title": d.title,
                    "status": d.status,
                    "initiator": d.initiator.email,
                    "respondent": d.respondent.email,
                    "created_at": d.created_at,
                }
            )
        return Response({"results": data})


class MediatorUpdateDisputeStatusAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        """Allow assigned mediator to advance dispute status.

        Allowed transitions:
        - mediation_initiated -> in_progress
        - in_progress -> awaiting_decision
        - awaiting_decision -> resolved
        - awaiting_decision -> closed
        - resolved -> closed
        """
        dispute_id = request.data.get("dispute_id")
        new_status = request.data.get("new_status")
        if not dispute_id or not new_status:
            return Response(
                {"detail": "dispute_id and new_status are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            dispute = Dispute.objects.get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response({"detail": "Dispute not found"}, status=404)

        if dispute.assigned_mediator_id != request.user.id:
            return Response(
                {"detail": "Not mediator of this dispute"},
                status=403,
            )

        current = dispute.status
        allowed = {
            "mediation_initiated": ["in_progress"],
            "in_progress": ["awaiting_decision"],
            "awaiting_decision": ["resolved", "closed"],
            "resolved": ["closed"],
        }
        if current not in allowed or new_status not in allowed[current]:
            return Response(
                {"detail": "Invalid status transition"},
                status=400,
            )

        dispute.status = new_status
        dispute.save()

        # Helper function to format status for display
        def format_status_display(status):
            if not status:
                return "Unknown"
            return status.replace("_", " ").title()

        DisputeEvent.objects.create(
            dispute=dispute,
            event_type="status_changed",
            description=(
                f'Status changed from "{format_status_display(current)}" '
                f'to "{format_status_display(new_status)}"'
            ),
            created_by=request.user,
        )

        # Send notifications to initiator and respondent about status change
        dispute_title = dispute.title or f"Dispute {dispute.dispute_id}"
        status_change_message = (
            f"Dispute '{dispute_title}' status changed from "
            f'"{format_status_display(current)}" to '
            f'"{format_status_display(new_status)}"'
        )

        # Notify initiator
        Notification.objects.create(
            user=dispute.initiator, message=status_change_message
        )

        # Notify respondent
        Notification.objects.create(
            user=dispute.respondent, message=status_change_message
        )

        return Response(
            {
                "message": "Status updated",
                "dispute_id": dispute.id,
                "status": dispute.status,
            }
        )


# Revenue Management Endpoints


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_revenue_summary(request):
    """
    Get comprehensive revenue summary for admin panel
    """
    try:
        summary = RevenueService.get_revenue_summary()
        return Response(summary, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting revenue summary: {e}")
        return Response(
            {"error": "Failed to get revenue summary"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_monthly_revenue(request, year, month):
    """
    Get revenue for specific month
    """
    try:
        revenue = RevenueService.get_monthly_revenue(year, month)
        if revenue:
            data = {
                "year": revenue.year,
                "month": revenue.month,
                "vat_collected": revenue.vat_collected,
                "seller_revenue": revenue.seller_revenue,
                "total_revenue": revenue.total_revenue,
                "total_payments": revenue.total_payments,
                "total_milestones_approved": revenue.total_milestones_approved,
                "created_at": revenue.created_at,
                "updated_at": revenue.updated_at,
            }
            return Response(data, status=status.HTTP_200_OK)
        else:
            return Response(
                {"message": f"No revenue data found for {year}-{month:02d}"},
                status=status.HTTP_404_NOT_FOUND,
            )
    except Exception as e:
        logger.error(f"Error getting monthly revenue: {e}")
        return Response(
            {"error": "Failed to get monthly revenue"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_total_revenue(request):
    """
    Get total platform revenue across all months
    """
    try:
        total_revenue = RevenueService.get_total_revenue()
        return Response(total_revenue, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting total revenue: {e}")
        return Response(
            {"error": "Failed to get total revenue"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminRole])
def recalculate_monthly_revenue(request, year, month):
    """
    Recalculate revenue for a specific month from actual payment data
    """
    try:
        revenue = RevenueService.recalculate_monthly_revenue(year, month)
        data = {
            "year": revenue.year,
            "month": revenue.month,
            "vat_collected": revenue.vat_collected,
            "seller_revenue": revenue.seller_revenue,
            "total_revenue": revenue.total_revenue,
            "total_payments": revenue.total_payments,
            "total_milestones_approved": revenue.total_milestones_approved,
            "updated_at": revenue.updated_at,
        }
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error recalculating monthly revenue: {e}")
        return Response(
            {"error": "Failed to recalculate monthly revenue"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def list_revenue_months(request):
    """
    List all months with revenue data
    """
    try:
        revenues = PlatformRevenue.objects.all().order_by("-year", "-month")
        data = []
        for revenue in revenues:
            data.append(
                {
                    "year": revenue.year,
                    "month": revenue.month,
                    "vat_collected": revenue.vat_collected,
                    "seller_revenue": revenue.seller_revenue,
                    "total_revenue": revenue.total_revenue,
                    "total_payments": revenue.total_payments,
                    "total_milestones_approved": revenue.total_milestones_approved,
                    "updated_at": revenue.updated_at,
                }
            )
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error listing revenue months: {e}")
        return Response(
            {"error": "Failed to list revenue months"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# Payment Management Endpoints


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_paid_payments(request):
    """
    Get all paid payments for admin management
    """
    try:
        from payments.models import Payment
        from django.contrib.auth import get_user_model

        User = get_user_model()
        payments = (
            Payment.objects.filter(status="paid")
            .select_related("user", "project")
            .order_by("-created_at")
        )

        data = []
        for payment in payments:
            data.append(
                {
                    "id": payment.id,
                    "user_email": payment.user.email,
                    "user_name": payment.user.get_full_name()
                    or payment.user.username
                    or payment.user.email,
                    "project_title": (
                        payment.project.name if payment.project else "N/A"
                    ),
                    "amount": payment.amount,
                    "platform_fee_amount": payment.platform_fee_amount,
                    "buyer_total_amount": payment.buyer_total_amount,
                    "seller_net_amount": payment.seller_net_amount,
                    "status": payment.status,
                    "created_at": payment.created_at,
                    "stripe_payment_id": payment.stripe_payment_id,
                }
            )

        return Response({"results": data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting paid payments: {e}")
        return Response(
            {"error": "Failed to get paid payments"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_transfers(request):
    """
    Get all transfers for admin management
    """
    try:
        from payments.models import Payout
        from django.contrib.auth import get_user_model

        User = get_user_model()
        transfers = Payout.objects.all().select_related("user").order_by("-created_at")

        data = []
        for transfer in transfers:
            data.append(
                {
                    "id": transfer.id,
                    "user_email": transfer.user.email,
                    "user_name": transfer.user.get_full_name()
                    or transfer.user.username
                    or transfer.user.email,
                    "amount": transfer.amount,
                    "currency": transfer.currency,
                    "status": transfer.status,
                    "stripe_transfer_id": transfer.stripe_transfer_id,
                    "stripe_account_id": transfer.stripe_account_id,
                    "created_at": transfer.created_at,
                }
            )

        return Response({"results": data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting transfers: {e}")
        return Response(
            {"error": "Failed to get transfers"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


0

from datetime import timedelta

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from disputes.models import Dispute, DisputeEvent
from .permissions import IsAdminRole, IsSuperAdmin, IsAdmin


User = get_user_model()


class AdminOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        # Basic KPI counts
        user_count = User.objects.count()

        # For now keep transactions static as requested
        transactions_count = 5678

        # Registration trends - last 7 months including current
        now = timezone.now()
        trend = []
        for i in range(6, -1, -1):
            # Walk back i months by iteratively subtracting 1 month
            d = now
            for _ in range(i):
                d = d.replace(day=1) - timedelta(days=1)
            start = d.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            # First day of the next month
            end = (d.replace(day=28) + timedelta(days=4)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            count = User.objects.filter(
                date_joined__gte=start, date_joined__lt=end
            ).count()
            month_label = start.strftime('%b')
            trend.append({"month": month_label, "value": count})

        # Registration change percentage (last 30 days vs previous 30 days)
        start_current = now - timedelta(days=30)
        start_previous = now - timedelta(days=60)
        current_30d = User.objects.filter(
            date_joined__gte=start_current
        ).count()
        previous_30d = User.objects.filter(
            date_joined__gte=start_previous,
            date_joined__lt=start_current,
        ).count()
        denom = previous_30d if previous_30d != 0 else 1
        registration_change = round(
            ((current_30d - previous_30d) / denom) * 100
        )

        # Revenue bars - static for now
        revenue = [
            {"month": m, "revenue": r}
            for m, r in [
                ('Jan', 8), ('Feb', 8), ('Mar', 8), ('Apr', 8),
                ('May', 8), ('Jun', 8), ('Jul', 8)
            ]
        ]
        # Revenue is static; include change value so UI can show a label
        revenue_change = 8

        return Response({
            "kpis": {
                "userCount": user_count,
                "transactions": transactions_count,
                "disputes": Dispute.objects.count(),
            },
            "registrationTrend": trend,
            "revenueBars": revenue,
            "registrationChangePercent": registration_change,
            "revenueChangePercent": revenue_change,
        })


class AdminUsersListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        role = request.query_params.get('role')
        if role not in {"seller", "buyer", "professional-buyer"}:
            return Response({"detail": "Invalid or missing role"}, status=400)

        users = User.objects.filter(role=role).order_by('id')
        data = [{
            "id": u.id,
            "name": (u.get_full_name() or u.username or u.email),
            "email": u.email,
            "status": "Active" if u.is_active else "Inactive",
            "is_admin": u.is_admin,
        } for u in users]

        return Response({"results": data})


class SuperAdminUsersListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """Get all users with their admin status for super-admin management"""
        users = User.objects.exclude(role='super-admin').order_by('id')
        data = [{
            "id": u.id,
            "name": (u.get_full_name() or u.username or u.email),
            "email": u.email,
            "role": u.role,
            "status": "Active" if u.is_active else "Inactive",
            "is_admin": u.is_admin,
        } for u in users]

        return Response({"results": data})


class AdminManagementAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        """Toggle admin status for a user"""
        user_id = request.data.get('user_id')
        is_admin = request.data.get('is_admin', False)

        if not user_id:
            return Response(
                {"detail": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)

            # Prevent super-admin from modifying other super-admins
            if user.role == 'super-admin':
                return Response(
                    {"detail": "Cannot modify super-admin users"},
                    status=status.HTTP_403_FORBIDDEN
                )

            user.is_admin = is_admin
            user.save()

            return Response({
                "message": f"Admin status updated for {user.email}",
                "user_id": user.id,
                "is_admin": user.is_admin
            })

        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class CurrentAdminsListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """Get list of current admins (users with is_admin=True)"""
        admins = User.objects.filter(is_admin=True).exclude(
            role='super-admin'
        ).order_by('id')
        data = [{
            "id": u.id,
            "name": (u.get_full_name() or u.username or u.email),
            "email": u.email,
            "role": u.role,
            "status": "Active" if u.is_active else "Inactive",
            "is_admin": u.is_admin,
        } for u in admins]

        return Response({"results": data})


class SuperAdminDisputesListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """List disputes for super-admin with minimal info."""
        disputes = Dispute.objects.select_related(
            'initiator', 'respondent', 'assigned_mediator', 'project'
        ).order_by('-created_at')
        data = []
        for d in disputes:
            data.append({
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
            })
        return Response({"results": data})


class AssignMediatorAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        """Assign an admin as mediator to a dispute."""
        dispute_id = request.data.get('dispute_id')
        mediator_id = request.data.get('mediator_id')
        if not dispute_id or not mediator_id:
            return Response(
                {"detail": "dispute_id and mediator_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            dispute = Dispute.objects.get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response({"detail": "Dispute not found"}, status=404)
        try:
            mediator = User.objects.get(
                id=mediator_id,
                is_admin=True,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Mediator not found or not eligible"},
                status=404,
            )

        dispute.assigned_mediator = mediator
        dispute.status = 'mediation_initiated'
        dispute.save()
        DisputeEvent.objects.create(
            dispute=dispute,
            event_type='mediator_assigned',
            description=(
                f"Mediator {mediator.email} assigned by super-admin"
            ),
            created_by=request.user,
        )
        return Response({
            "message": "Mediator assigned",
            "dispute_id": dispute.id,
            "mediator": mediator.email,
            "status": dispute.status,
        })


class AdminAssignedDisputesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """List disputes assigned to the current admin user."""
        disputes = Dispute.objects.filter(
            assigned_mediator=request.user
        ).select_related(
            'initiator', 'respondent', 'project'
        ).order_by('-created_at')
        data = []
        for d in disputes:
            data.append({
                "id": d.id,
                "dispute_id": d.dispute_id,
                "title": d.title,
                "status": d.status,
                "initiator": d.initiator.email,
                "respondent": d.respondent.email,
                "created_at": d.created_at,
            })
        return Response({"results": data})

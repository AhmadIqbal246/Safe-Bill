from datetime import timedelta

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from disputes.models import Dispute
from .permissions import IsAdminRole


User = get_user_model()


class AdminOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        # Basic KPI counts
        user_count = User.objects.count()
        disputes_count = Dispute.objects.count()

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
                "disputes": disputes_count,
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
        } for u in users]

        return Response({"results": data})

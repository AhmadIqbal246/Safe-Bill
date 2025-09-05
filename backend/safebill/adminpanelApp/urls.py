from django.urls import path
from .views import (
    AdminOverviewAPIView,
    AdminUsersListAPIView,
    SuperAdminUsersListAPIView,
    AdminManagementAPIView,
    CurrentAdminsListAPIView,
    SuperAdminDisputesListAPIView,
    AssignMediatorAPIView,
    AdminAssignedDisputesAPIView,
    MediatorUpdateDisputeStatusAPIView,
    get_revenue_summary,
    get_monthly_revenue,
    get_total_revenue,
    recalculate_monthly_revenue,
    list_revenue_months,
    get_paid_payments,
    get_transfers,
)

app_name = "adminpanel"

urlpatterns = [
    path("overview/", AdminOverviewAPIView.as_view(), name="overview"),
    path("users/", AdminUsersListAPIView.as_view(), name="users-list"),
    path(
        "super-admin/users/",
        SuperAdminUsersListAPIView.as_view(),
        name="super-admin-users",
    ),
    path(
        "super-admin/manage-admin/",
        AdminManagementAPIView.as_view(),
        name="manage-admin",
    ),
    path(
        "super-admin/current-admins/",
        CurrentAdminsListAPIView.as_view(),
        name="current-admins",
    ),
    path(
        "super-admin/disputes/",
        SuperAdminDisputesListAPIView.as_view(),
        name="super-admin-disputes",
    ),
    path(
        "super-admin/assign-mediator/",
        AssignMediatorAPIView.as_view(),
        name="assign-mediator",
    ),
    path(
        "admin/assigned-disputes/",
        AdminAssignedDisputesAPIView.as_view(),
        name="admin-assigned-disputes",
    ),
    path(
        "admin/mediator/update-status/",
        MediatorUpdateDisputeStatusAPIView.as_view(),
        name="mediator-update-status",
    ),
    # Revenue Management Endpoints
    path("revenue/summary/", get_revenue_summary, name="revenue-summary"),
    path("revenue/total/", get_total_revenue, name="revenue-total"),
    path("revenue/months/", list_revenue_months, name="revenue-months"),
    path(
        "revenue/month/<int:year>/<int:month>/",
        get_monthly_revenue,
        name="revenue-monthly",
    ),
    path(
        "revenue/recalculate/<int:year>/<int:month>/",
        recalculate_monthly_revenue,
        name="revenue-recalculate",
    ),
    # Payment Management Endpoints
    path("payments/paid/", get_paid_payments, name="paid-payments"),
    path("transfers/", get_transfers, name="transfers"),
]

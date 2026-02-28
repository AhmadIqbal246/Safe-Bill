from django.urls import path
from .views import (
    ProjectCreateAPIView,
    ProjectListAPIView,
    ProjectDeleteAPIView,
    ProjectInviteAPIView,
    ClientProjectListAPIView,
    ClientProjectsWithPendingMilestonesAPIView,
    ClientProjectDetailAPIView,
    MilestoneListAPIView,
    MilestoneDetailAPIView,
    MilestoneApprovalAPIView,
    ProjectStatusUpdateAPIView,
    ProjectCompletionAPIView,
    get_completed_projects,
    list_expired_project_invites,
    seller_receipts,
    buyer_receipts,
)

urlpatterns = [
    path("create/", ProjectCreateAPIView.as_view(), name="project-create"),
    path("my-projects/", ProjectListAPIView.as_view(), name="project-list"),
    path(
        "client-projects/",
        ClientProjectListAPIView.as_view(),
        name="client-project-list",
    ),
    path(
        "client-projects-pending/",
        ClientProjectsWithPendingMilestonesAPIView.as_view(),
        name="client-projects-pending",
    ),
    path(
        "client-projects/<int:pk>/",
        ClientProjectDetailAPIView.as_view(),
        name="client-project-detail",
    ),
    path("delete/<int:pk>/", ProjectDeleteAPIView.as_view(), name="project-delete"),
    path("invite/<str:token>/", ProjectInviteAPIView.as_view(), name="project-invite"),
    # Resend invite uses same view with PUT on same route
    path(
        "status-update/<int:project_id>/",
        ProjectStatusUpdateAPIView.as_view(),
        name="project-status-update",
    ),
    path(
        "complete/<int:project_id>/",
        ProjectCompletionAPIView.as_view(),
        name="project-complete",
    ),
    path("completed-projects/", get_completed_projects, name="completed-projects"),
    path(
        "expired-invites/",
        list_expired_project_invites,
        name="expired-project-invites",
    ),
    # Receipts endpoints
    path("receipts/seller/", seller_receipts, name="seller-receipts"),
    path("receipts/buyer/", buyer_receipts, name="buyer-receipts"),
    # Milestone endpoints
    path(
        "projects/<int:project_id>/milestones/",
        MilestoneListAPIView.as_view(),
        name="milestone-list",
    ),
    path(
        "milestones/<int:pk>/",
        MilestoneDetailAPIView.as_view(),
        name="milestone-detail",
    ),
    path(
        "milestones/<int:pk>/approve/",
        MilestoneApprovalAPIView.as_view(),
        name="milestone-approve",
    ),
]

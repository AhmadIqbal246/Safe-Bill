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
    ProjectStatusUpdateAPIView
)

urlpatterns = [
    path('create/', ProjectCreateAPIView.as_view(), name='project-create'),
    path('my-projects/', ProjectListAPIView.as_view(), name='project-list'),
    path('client-projects/', ClientProjectListAPIView.as_view(), name='client-project-list'),
    path('client-projects-pending/', ClientProjectsWithPendingMilestonesAPIView.as_view(), name='client-projects-pending'),
    path('client-projects/<int:pk>/', ClientProjectDetailAPIView.as_view(), name='client-project-detail'),
    path('delete/<int:pk>/', ProjectDeleteAPIView.as_view(), name='project-delete'),
    path('invite/<str:token>/', ProjectInviteAPIView.as_view(), name='project-invite'),
    path('status-update/<int:project_id>/', ProjectStatusUpdateAPIView.as_view(), name='project-status-update'),
    
    # Milestone endpoints
    path('projects/<int:project_id>/milestones/', MilestoneListAPIView.as_view(), name='milestone-list'),
    path('milestones/<int:pk>/', MilestoneDetailAPIView.as_view(), name='milestone-detail'),
    path('milestones/<int:pk>/approve/', MilestoneApprovalAPIView.as_view(), name='milestone-approve'),
] 
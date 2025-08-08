from django.urls import path
from .views import (
    DisputeListAPIView,
    DisputeDetailAPIView,
    DisputeCreateAPIView,
    DisputeUpdateAPIView,
    DisputeCommentCreateAPIView,
    DisputeAssignMediatorAPIView,
    DisputeResolveAPIView,
    AvailableProjectsForDisputeAPIView
)

urlpatterns = [
    # Dispute CRUD
    path('', DisputeListAPIView.as_view(), name='dispute-list'),
    path('create/', DisputeCreateAPIView.as_view(), name='dispute-create'),
    path('<int:pk>/', DisputeDetailAPIView.as_view(), name='dispute-detail'),
    path('<int:pk>/update/', DisputeUpdateAPIView.as_view(), name='dispute-update'),
    
    # Available projects for dispute creation
    path('available-projects/', AvailableProjectsForDisputeAPIView.as_view(), name='available-projects'),
    
    # Dispute Actions
    path('<int:dispute_id>/assign-mediator/', DisputeAssignMediatorAPIView.as_view(), name='dispute-assign-mediator'),
    path('<int:dispute_id>/resolve/', DisputeResolveAPIView.as_view(), name='dispute-resolve'),
    
    # Comments
    path('<int:dispute_id>/comments/', DisputeCommentCreateAPIView.as_view(), name='dispute-comment-create'),
] 
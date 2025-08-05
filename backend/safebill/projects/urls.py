from django.urls import path
from .views import (
    ProjectCreateAPIView, 
    ProjectListAPIView, 
    ProjectDeleteAPIView,
    ProjectInviteAPIView,
    ClientProjectListAPIView
)

urlpatterns = [
    path('create/', ProjectCreateAPIView.as_view(), name='project-create'),
    path('my-projects/', ProjectListAPIView.as_view(), name='project-list'),
    path('client-projects/', ClientProjectListAPIView.as_view(), name='client-project-list'),
    path('delete/<int:pk>/', ProjectDeleteAPIView.as_view(), name='project-delete'),
    path('invite/<str:token>/', ProjectInviteAPIView.as_view(), name='project-invite'),
] 
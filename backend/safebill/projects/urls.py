from django.urls import path
from .views import ProjectCreateAPIView, ProjectListAPIView, ProjectDeleteAPIView

urlpatterns = [
    path('create/', ProjectCreateAPIView.as_view(), name='project-create'),
    path('my-projects/', ProjectListAPIView.as_view(), name='project-list'),
    path('delete/<int:pk>/', ProjectDeleteAPIView.as_view(), name='project-delete'),
] 
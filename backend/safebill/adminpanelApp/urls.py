from django.urls import path
from .views import AdminOverviewAPIView, AdminUsersListAPIView

app_name = 'adminpanel'

urlpatterns = [
    path('overview/', AdminOverviewAPIView.as_view(), name='overview'),
    path('users/', AdminUsersListAPIView.as_view(), name='users-list'),
]

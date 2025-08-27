from django.urls import path
from .views import (
    AdminOverviewAPIView, 
    AdminUsersListAPIView,
    SuperAdminUsersListAPIView,
    AdminManagementAPIView,
    CurrentAdminsListAPIView
)

app_name = 'adminpanel'

urlpatterns = [
    path('overview/', AdminOverviewAPIView.as_view(), name='overview'),
    path('users/', AdminUsersListAPIView.as_view(), name='users-list'),
    path(
        'super-admin/users/', 
        SuperAdminUsersListAPIView.as_view(), 
        name='super-admin-users'
    ),
    path(
        'super-admin/manage-admin/', 
        AdminManagementAPIView.as_view(), 
        name='manage-admin'
    ),
    path(
        'super-admin/current-admins/', 
        CurrentAdminsListAPIView.as_view(), 
        name='current-admins'
    ),
]

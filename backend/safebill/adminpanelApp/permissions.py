from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow access only to authenticated users with role 'admin'."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        is_admin = getattr(user, 'role', None) == 'admin'
        return bool(user and user.is_authenticated and is_admin)


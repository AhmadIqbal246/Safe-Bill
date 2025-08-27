from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow access only to authenticated users with admin role or super-admin role."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        has_admin_access = getattr(user, 'has_admin_access', False)
        return bool(user and user.is_authenticated and has_admin_access)


class IsSuperAdmin(BasePermission):
    """Allow access only to authenticated users with super-admin role."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        is_super_admin = getattr(user, 'is_super_admin', False)
        return bool(user and user.is_authenticated and is_super_admin)


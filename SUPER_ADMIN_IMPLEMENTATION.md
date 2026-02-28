# Super Admin Implementation

This document describes the implementation of the super-admin system for Safe Bill.

## Overview

The super-admin system allows for hierarchical admin management where:
- **Super Admin**: Can manage all users, including making/removing admins
- **Admin**: Regular admins with limited privileges (cannot manage other admins)
- **Regular Users**: Sellers, buyers, and professional-buyers

## Database Changes

### User Model Updates

1. **New Role**: Added `'super-admin'` to `ROLE_CHOICES`
2. **New Field**: Added `is_admin` boolean field to track admin privileges
3. **New Properties**: 
   - `is_super_admin`: Returns true if user has super-admin role
   - `has_admin_access`: Returns true if user has admin access (super-admin or admin with is_admin=True)

### Migration

Run the migration to add the new field:
```bash
python manage.py migrate accounts
```

## API Endpoints

### For Super Admins Only

1. **GET** `/api/admin/super-admin/users/` - Get all users with admin status
2. **POST** `/api/admin/super-admin/manage-admin/` - Toggle admin status for a user
3. **GET** `/api/admin/super-admin/current-admins/` - Get list of current admins

### For All Admins

1. **GET** `/api/admin/overview/` - Admin dashboard overview
2. **GET** `/api/admin/users/?role=<role>` - Get users by role

## Frontend Changes

### Admin Dashboard Updates

1. **Role Detection**: Automatically detects if user is super-admin
2. **Current Admins Table**: Shows all current admins (super-admin only)
3. **Admin Toggle**: Toggle switches to make/remove admins (super-admin only)
4. **Conditional UI**: Different views for super-admin vs regular admin

### New Features

- **Admin Toggle Component**: Toggle switch for admin status
- **Current Admins Section**: Table showing all current admins
- **Role-based UI**: Different interfaces based on user role

## Creating a Super Admin

Use the provided script to create a super-admin user:

```bash
cd backend/safebill
python manage.py shell < create_super_admin.py
```

Or manually create one through Django shell:

```python
from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.create_user(
    username='superadmin',
    email='admin@example.com',
    password='secure_password',
    role='super-admin',
    is_admin=True,
    is_staff=True,
    is_superuser=True
)
```

## Security Features

1. **Permission Classes**: 
   - `IsAdminRole`: For admin access
   - `IsSuperAdmin`: For super-admin only endpoints

2. **Role Validation**: Prevents super-admins from modifying other super-admins

3. **Frontend Protection**: UI elements only show for appropriate user roles

## Usage

### For Super Admins

1. **View All Users**: See all users with their current admin status
2. **Manage Admins**: Toggle admin status for any user (except other super-admins)
3. **View Current Admins**: See a dedicated list of all current admins

### For Regular Admins

1. **View Users**: See users in their respective roles
2. **No Admin Management**: Cannot modify admin status of other users
3. **Standard Dashboard**: Access to regular admin features

## Translation Support

Added new translation keys for:
- `admin.role`: Role column header
- `admin.admin_access`: Admin access column header  
- `admin.current_admins`: Current admins section title
- `admin.no_admins_found`: No admins message

Available in both English and French.

## Testing

To test the implementation:

1. Create a super-admin user
2. Create regular users with different roles
3. Login as super-admin and test admin management features
4. Login as regular admin and verify limited access
5. Test the toggle functionality for making/removing admins

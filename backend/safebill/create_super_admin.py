#!/usr/bin/env python
"""
Script to create a super-admin user.
Run this script with: python manage.py shell < create_super_admin.py
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()


def create_super_admin(email, username, password, first_name="", last_name=""):
    """
    Create a super-admin user
    """
    try:
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            print(f"User with email {email} already exists!")
            return False
        
        # Create the super-admin user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='super-admin',
            is_admin=True,
            is_staff=True,
            is_superuser=True
        )
        
        print("Super-admin user created successfully!")
        print(f"Email: {user.email}")
        print(f"Username: {user.username}")
        print(f"Role: {user.role}")
        return True
        
    except Exception as e:
        print(f"Error creating super-admin user: {e}")
        return False


if __name__ == "__main__":
    # You can modify these values as needed
    email = input("Enter email for super-admin: ")
    username = input("Enter username for super-admin: ")
    password = input("Enter password for super-admin: ")
    first_name = input("Enter first name (optional): ")
    last_name = input("Enter last name (optional): ")
    
    create_super_admin(email, username, password, first_name, last_name)

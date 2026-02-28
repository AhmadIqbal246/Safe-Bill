#!/usr/bin/env python
"""
Test script for project status functionality.
Run this script to test the project status management.
"""

import os
import sys
import django

# Add the project root to the Python path
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')
django.setup()

from django.conf import settings
from safebill.projects.models import Project


def test_project_status_choices():
    """Test that project status choices are correctly defined."""
    print("Testing project status choices...")
    
    # Get the status choices from the model
    status_choices = Project.STATUS_CHOICES
    
    expected_statuses = [
        'pending', 'approved', 'not_approved', 
        'in_progress', 'completed'
    ]
    
    actual_statuses = [choice[0] for choice in status_choices]
    
    print(f"Expected statuses: {expected_statuses}")
    print(f"Actual statuses: {actual_statuses}")
    
    if set(expected_statuses) == set(actual_statuses):
        print("✅ All expected statuses are present!")
    else:
        print("❌ Missing or extra statuses found!")
    
    # Check default status
    default_status = Project._meta.get_field('status').default
    print(f"Default status: {default_status}")
    
    if default_status == 'pending':
        print("✅ Default status is correctly set to 'pending'")
    else:
        print("❌ Default status is not 'pending'")


def test_project_creation():
    """Test that projects are created with pending status."""
    print("\nTesting project creation...")
    
    # This would require a user with seller role
    # For now, just test the model field
    project = Project()
    print(f"New project status: {project.status}")
    
    if project.status == 'pending':
        print("✅ New projects default to 'pending' status")
    else:
        print("❌ New projects don't default to 'pending' status")


def main():
    """Run all tests."""
    print("🚀 Testing Project Status Functionality\n")
    
    test_project_status_choices()
    test_project_creation()
    
    print("\n✨ Project status tests completed!")


if __name__ == "__main__":
    main()

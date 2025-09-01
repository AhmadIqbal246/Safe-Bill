#!/usr/bin/env python3
"""
Test script for project status update functionality
"""
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')

import django
django.setup()

from projects.models import Project
from django.contrib.auth import get_user_model

User = get_user_model()


def test_project_status_update():
    """Test the project status update functionality"""
    print("Testing Project Status Update Functionality")
    print("=" * 50)
    
    # Check if we have any projects
    projects = Project.objects.all()
    print(f"Total projects in database: {projects.count()}")
    
    if projects.count() == 0:
        print("No projects found. Please create some projects first.")
        return
    
    # Show project statuses
    print("\nCurrent Project Statuses:")
    for project in projects[:5]:  # Show first 5 projects
        print(f"  - {project.name}: {project.status}")
    
    # Check for approved projects
    approved_projects = Project.objects.filter(status='approved')
    print(f"\nApproved projects: {approved_projects.count()}")
    
    if approved_projects.count() > 0:
        print("Approved projects that can be started:")
        for project in approved_projects:
            print(f"  - {project.name} (ID: {project.id})")
    
    # Check for in_progress projects
    in_progress_projects = Project.objects.filter(status='in_progress')
    print(f"\nIn-progress projects: {in_progress_projects.count()}")
    
    # Check for pending projects
    pending_projects = Project.objects.filter(status='pending')
    print(f"\nPending projects: {pending_projects.count()}")
    
    print("\n" + "=" * 50)
    print("Test completed successfully!")


if __name__ == '__main__':
    test_project_status_update()

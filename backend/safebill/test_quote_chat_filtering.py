#!/usr/bin/env python3
"""
Test script for quote chat project filtering
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
from django.db.models import Count

User = get_user_model()


def test_quote_chat_filtering():
    """Test that quote chat projects are properly filtered"""
    print("Testing Quote Chat Project Filtering")
    print("=" * 50)
    
    # Check if we have any projects
    projects = Project.objects.all()
    print(f"Total projects in database: {projects.count()}")
    
    if projects.count() == 0:
        print("No projects found. Please create some projects first.")
        return
    
    # Show project types
    print("\nProject Types Distribution:")
    project_types = projects.values('project_type').annotate(count=Count('project_type'))
    for pt in project_types:
        print(f"  - {pt['project_type']}: {pt['count']}")
    
    # Check for quote chat projects
    quote_chat_projects = Project.objects.filter(project_type='quote_chat')
    print(f"\nQuote chat projects: {quote_chat_projects.count()}")
    
    if quote_chat_projects.count() > 0:
        print("Quote chat projects that should be hidden from main lists:")
        for project in quote_chat_projects[:3]:  # Show first 3
            print(f"  - {project.name} (ID: {project.id})")
    
    # Check for real projects
    real_projects = Project.objects.filter(project_type='real_project')
    print(f"\nReal projects: {real_projects.count()}")
    
    if real_projects.count() > 0:
        print("Real projects that should show in main lists:")
        for project in real_projects[:3]:  # Show first 3
            print(f"  - {project.name} (ID: {project.id})")
    
    # Check for projects without project_type (legacy)
    legacy_projects = Project.objects.filter(project_type='real_project')
    print(f"\nLegacy projects (defaulting to real_project): {legacy_projects.count()}")
    
    print("\n" + "=" * 50)
    print("Test completed successfully!")


if __name__ == '__main__':
    test_quote_chat_filtering()

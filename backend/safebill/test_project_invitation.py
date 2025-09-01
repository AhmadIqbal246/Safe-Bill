#!/usr/bin/env python
"""
Test script for project invitation email functionality.
Run this script to test the project invitation email template and service.
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
from safebill.utils.email_service import EmailService


def test_project_invitation_email():
    """Test sending a project invitation email."""
    print("Testing project invitation email...")
    
    # Test data
    client_email = "test@example.com"
    project_name = "Website Redesign Project"
    invitation_url = "https://safebill.com/project-invite?token=abc123def456"
    invitation_token = "abc123def456"
    
    try:
        # Send the email
        success = EmailService.send_project_invitation_email(
            client_email=client_email,
            project_name=project_name,
            invitation_url=invitation_url,
            invitation_token=invitation_token
        )
        
        if success:
            print("✅ Project invitation email sent successfully!")
        else:
            print("❌ Failed to send project invitation email")
            
    except Exception as e:
        print(f"❌ Error sending project invitation email: {str(e)}")


def test_project_invitation_template_rendering():
    """Test rendering the project invitation email template."""
    print("\nTesting project invitation template rendering...")
    
    try:
        from django.template.loader import render_to_string
        
        # Test context
        context = {
            'project_name': "Website Redesign Project",
            'invitation_url': "https://safebill.com/project-invite?token=abc123def456",
            'invitation_token': "abc123def456",
            'frontend_url': "https://safebill.com",
            'site_name': 'SafeBill',
            'support_email': 'support@safebill.com',
        }
        
        # Render the template
        html_content = render_to_string('emails/project_invitation.html', context)
        
        # Check if key elements are present
        required_elements = [
            'Project Invitation',
            'Website Redesign Project',
            'buyer',
            'Sign Up as Individual Buyer',
            'Open Project Invitation',
            'abc123def456',
            '2 days'
        ]
        
        missing_elements = []
        for element in required_elements:
            if element not in html_content:
                missing_elements.append(element)
        
        if not missing_elements:
            print("✅ Template rendered successfully with all required elements!")
        else:
            print(f"❌ Missing elements in template: {missing_elements}")
            
        # Save rendered HTML for inspection
        with open('project_invitation_preview.html', 'w', 
                  encoding='utf-8') as f:
            f.write(html_content)
        print("📄 Template preview saved to "
              "'project_invitation_preview.html'")
        
    except Exception as e:
        print(f"❌ Error rendering template: {str(e)}")


def test_email_service_methods():
    """Test various EmailService methods."""
    print("\nTesting EmailService methods...")
    
    try:
        # Test the new method exists
        if hasattr(EmailService, 'send_project_invitation_email'):
            print("✅ send_project_invitation_email method exists")
        else:
            print("❌ send_project_invitation_email method not found")
            
        # Test other methods
        methods_to_test = [
            'send_verification_email',
            'send_password_reset_email',
            'send_welcome_email',
            'send_notification_email',
            'send_quote_chat_notification',
            'send_quote_request_email',
            'send_quote_request_confirmation'
        ]
        
        for method_name in methods_to_test:
            if hasattr(EmailService, method_name):
                print(f"✅ {method_name} method exists")
            else:
                print(f"❌ {method_name} method not found")
                
    except Exception as e:
        print(f"❌ Error testing EmailService methods: {str(e)}")


def main():
    """Main test function."""
    print("🚀 Starting Project Invitation Email Tests\n")
    
    # Test template rendering first
    test_project_invitation_template_rendering()
    
    # Test email service methods
    test_email_service_methods()
    
    # Test actual email sending (only if email is configured)
    if (hasattr(settings, 'EMAIL_BACKEND') and 
        settings.EMAIL_BACKEND != 
        'django.core.mail.backends.console.EmailBackend'):
        test_project_invitation_email()
    else:
        print("\n⚠️  Email backend not configured for sending. "
              "Skipping email send test.")
        print("   Set up proper email configuration to test "
              "actual email sending.")
    
    print("\n✨ Project invitation email tests completed!")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Test script for password reset functionality.
Run this script to test the password reset email service.
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')
django.setup()

from utils.email_service import EmailService
from django.contrib.auth import get_user_model

User = get_user_model()

def test_password_reset_email():
    """Test sending a password reset email"""
    print("🧪 Testing Password Reset Email Service...")
    
    # Test data
    test_email = "test@example.com"
    test_name = "Test User"
    test_reset_url = "https://example.com/reset-password?uid=test123&token=test456"
    test_reset_code = "ABC123XYZ"
    
    try:
        # Test sending password reset email
        success = EmailService.send_password_reset_email(
            user_email=test_email,
            user_name=test_name,
            reset_url=test_reset_url,
            reset_code=test_reset_code
        )
        
        if success:
            print("✅ Password reset email sent successfully!")
            print(f"   📧 To: {test_email}")
            print(f"   👤 User: {test_name}")
            print(f"   🔗 Reset URL: {test_reset_url}")
            print(f"   🔐 Reset Code: {test_reset_code}")
        else:
            print("❌ Failed to send password reset email")
            
    except Exception as e:
        print(f"❌ Error testing password reset email: {str(e)}")

def test_password_reset_template_rendering():
    """Test rendering the password reset email template"""
    print("\n🧪 Testing Password Reset Template Rendering...")
    
    try:
        from django.template.loader import render_to_string
        
        # Test context
        context = {
            'user_name': 'Test User',
            'reset_url': 'https://example.com/reset-password?uid=test123&token=test456',
            'reset_code': 'ABC123XYZ',
            'frontend_reset_url': 'https://example.com/reset-password',
            'site_name': 'Safe Bill',
            'support_email': 'support@safebill.com',
        }
        
        # Render template
        html_content = render_to_string('emails/password_reset.html', context)
        
        if html_content:
            print("✅ Password reset template rendered successfully!")
            print(f"   📏 Content length: {len(html_content)} characters")
            
            # Check for key elements
            if 'Reset Your Password' in html_content:
                print("   ✅ Title found")
            if 'ABC123XYZ' in html_content:
                print("   ✅ Reset code found")
            if 'https://example.com/reset-password?uid=test123&token=test456' in html_content:
                print("   ✅ Reset URL found")
            if 'frontend_reset_url' in html_content:
                print("   ✅ Frontend URL found")
        else:
            print("❌ Template rendered empty content")
            
    except Exception as e:
        print(f"❌ Error testing template rendering: {str(e)}")

def test_email_service_methods():
    """Test all email service methods"""
    print("\n🧪 Testing All Email Service Methods...")
    
    methods = [
        ('send_verification_email', {
            'user_email': 'test@example.com',
            'user_name': 'Test User',
            'verification_url': 'https://example.com/verify?token=test123',
            'user_type': 'buyer',
            'verification_code': 'ABC123'
        }),
        ('send_password_reset_email', {
            'user_email': 'test@example.com',
            'user_name': 'Test User',
            'reset_url': 'https://example.com/reset?token=test456',
            'reset_code': 'XYZ789'
        }),
        ('send_welcome_email', {
            'user_email': 'test@example.com',
            'user_name': 'Test User',
            'user_type': 'buyer'
        })
    ]
    
    for method_name, params in methods:
        try:
            method = getattr(EmailService, method_name)
            success = method(**params)
            
            if success:
                print(f"   ✅ {method_name} - Success")
            else:
                print(f"   ❌ {method_name} - Failed")
                
        except Exception as e:
            print(f"   ❌ {method_name} - Error: {str(e)}")

def main():
    """Main test function"""
    print("🚀 Safe Bill Password Reset Email Service Test")
    print("=" * 50)
    
    # Test password reset email
    test_password_reset_email()
    
    # Test template rendering
    test_password_reset_template_rendering()
    
    # Test all email service methods
    test_email_service_methods()
    
    print("\n" + "=" * 50)
    print("✨ Testing completed!")
    print("\n📋 Next steps:")
    print("   1. Check your email for the test password reset email")
    print("   2. Verify the email renders correctly in your email client")
    print("   3. Test the reset password functionality in your frontend")

if __name__ == "__main__":
    main()

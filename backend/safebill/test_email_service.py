#!/usr/bin/env python
"""
Test script for the email service functionality.
Run this script to test email sending without going through the full registration flow.
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')
django.setup()

from utils.email_service import EmailService


def test_email_verification():
    """Test email verification email"""
    print("Testing email verification...")
    
    success = EmailService.send_verification_email(
        user_email="test@example.com",
        user_name="Test User",
        verification_url="https://example.com/verify?token=test123",
        user_type="seller"
    )
    
    if success:
        print("✅ Email verification test passed")
    else:
        print("❌ Email verification test failed")
    
    return success


def test_password_reset():
    """Test password reset email"""
    print("Testing password reset...")
    
    success = EmailService.send_password_reset_email(
        user_email="test@example.com",
        user_name="Test User",
        reset_url="https://example.com/reset?token=test123"
    )
    
    if success:
        print("✅ Password reset test passed")
    else:
        print("❌ Password reset test failed")
    
    return success


def test_welcome_email():
    """Test welcome email"""
    print("Testing welcome email...")
    
    success = EmailService.send_welcome_email(
        user_email="test@example.com",
        user_name="Test User",
        user_type="buyer"
    )
    
    if success:
        print("✅ Welcome email test passed")
    else:
        print("❌ Welcome email test failed")
    
    return success


def test_quote_chat_notification():
    """Test quote chat notification email"""
    print("Testing quote chat notification...")
    
    success = EmailService.send_quote_chat_notification(
        seller_email="seller@example.com",
        seller_name="Seller Name",
        buyer_name="Buyer Name",
        buyer_email="buyer@example.com",
        project_name="Test Project",
        message_preview="This is a test message preview..."
    )
    
    if success:
        print("✅ Quote chat notification test passed")
    else:
        print("❌ Quote chat notification test failed")
    
    return success


def test_email_rendering():
    """Test email template rendering"""
    print("Testing email template rendering...")
    
    try:
        from django.template.loader import render_to_string
        from django.conf import settings
        
        # Test rendering the email verification template
        context = {
            'user_name': 'Test User',
            'verification_url': 'https://example.com/verify?token=test123',
            'user_type': 'seller',
            'site_name': 'SafeBill',
            'support_email': settings.DEFAULT_FROM_EMAIL,
        }
        
        html_content = render_to_string('emails/email_verification.html', context)
        
        if html_content and 'SafeBill' in html_content:
            print("✅ Email template rendering test passed")
            return True
        else:
            print("❌ Email template rendering test failed")
            return False
            
    except Exception as e:
        print(f"❌ Email template rendering test failed with error: {e}")
        return False


def main():
    """Run all email tests"""
    print("🧪 Testing Email Service...")
    print("=" * 50)
    
    # Check if email settings are configured
    from django.conf import settings
    if not hasattr(settings, 'EMAIL_HOST_USER') or not settings.EMAIL_HOST_USER:
        print("❌ Email settings not configured. Please check your .env file.")
        return
    
    tests = [
        test_email_rendering,
        test_email_verification,
        test_password_reset,
        test_welcome_email,
        test_quote_chat_notification,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All email tests passed!")
    else:
        print("⚠️  Some tests failed. Check your email configuration.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python
"""
Test script to verify language detection and email localization
"""
import os
import sys
import django
from django.test import RequestFactory
from django.utils import translation

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')
django.setup()

from utils.language_middleware import LanguageMiddleware
from utils.email_service import EmailService


def test_language_middleware():
    """Test the language middleware"""
    print("Testing Language Middleware...")
    
    factory = RequestFactory()
    middleware = LanguageMiddleware(lambda request: None)
    
    # Test with French language header
    request = factory.get('/test/', HTTP_X_USER_LANGUAGE='fr')
    middleware(request)
    print(f"French request - Language: {translation.get_language()}")
    
    # Test with English language header
    request = factory.get('/test/', HTTP_X_USER_LANGUAGE='en')
    middleware(request)
    print(f"English request - Language: {translation.get_language()}")
    
    # Test with no language header
    request = factory.get('/test/')
    middleware(request)
    print(f"No header request - Language: {translation.get_language()}")


def test_email_translations():
    """Test email subject translations"""
    print("\nTesting Email Translations...")
    
    # Test French translation
    with translation.override('fr'):
        subject = translation.gettext("Verify Your Email - SafeBill")
        print(f"French subject: {subject}")
    
    # Test English translation
    with translation.override('en'):
        subject = translation.gettext("Verify Your Email - SafeBill")
        print(f"English subject: {subject}")
    
    # Test project invitation
    with translation.override('fr'):
        subject = translation.gettext("You've been invited to join the '{project_name}' project on SafeBill").format(project_name="Test Project")
        print(f"French invitation: {subject}")
    
    with translation.override('en'):
        subject = translation.gettext("You've been invited to join the '{project_name}' project on SafeBill").format(project_name="Test Project")
        print(f"English invitation: {subject}")


if __name__ == "__main__":
    test_language_middleware()
    test_email_translations()
    print("\nLanguage detection test completed!")

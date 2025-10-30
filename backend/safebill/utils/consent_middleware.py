"""
Consent Middleware for GDPR Compliance
Checks user consent status before processing sensitive operations
"""
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)

class ConsentMiddleware(MiddlewareMixin):
    """
    Middleware to check user consent before processing requests
    """
    
    def process_request(self, request):
        # Skip consent check for public endpoints
        skip_paths = [
            '/api/accounts/login/',
            '/api/accounts/seller-register/',
            '/api/accounts/buyer-register/',
            '/api/accounts/verify-email/',
            '/api/accounts/password-reset-request/',
            '/api/accounts/password-reset-confirm/',
            '/api/accounts/token/refresh/',
            '/privacy-policy/',
            '/terms-of-service/',
            '/contact-us/',
            '/',
        ]
        
        # Skip consent check for public paths
        if any(request.path.startswith(path) for path in skip_paths):
            return None
            
        # Check for consent header
        consent_status = request.headers.get('X-Consent-Status')
        
        # If consent is explicitly denied, block the request
        if consent_status == 'denied':
            logger.warning(f"Consent denied for user accessing {request.path}")
            return JsonResponse({
                'error': 'Consent required',
                'message': 'Please provide consent to continue using Safe Bill.',
                'consent_required': True,
                'consent_url': '/privacy-policy/'
            }, status=403)
            
        # Log consent status for audit trail
        if consent_status:
            logger.info(f"User consent status: {consent_status} for {request.path}")
            
        return None






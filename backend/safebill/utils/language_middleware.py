"""
Custom middleware to set Django's language based on X-User-Language header
"""
from django.utils import translation
from django.conf import settings


class LanguageMiddleware:
    """
    Middleware to set Django's language based on X-User-Language header
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get language from X-User-Language header
        user_language = request.headers.get('X-User-Language')
        
        if user_language:
            # Extract language code (e.g., 'fr' from 'fr-FR' or 'fr')
            language_code = user_language.split('-')[0].split(',')[0].lower()
            
            # Check if the language is supported
            supported_languages = [lang[0] for lang in settings.LANGUAGES]
            if language_code in supported_languages:
                translation.activate(language_code)
                request.LANGUAGE_CODE = language_code
            else:
                # Fallback to default language
                translation.activate(settings.LANGUAGE_CODE)
                request.LANGUAGE_CODE = settings.LANGUAGE_CODE
        else:
            # No language header, use default
            translation.activate(settings.LANGUAGE_CODE)
            request.LANGUAGE_CODE = settings.LANGUAGE_CODE

        response = self.get_response(request)

        # Deactivate translation after processing
        translation.deactivate()

        return response

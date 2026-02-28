from django.contrib import admin
from .models import Feedback, QuoteRequest, ContactMessage, CallbackRequest,EmailLog

admin.site.register(Feedback)
admin.site.register(QuoteRequest)
admin.site.register(ContactMessage)
admin.site.register(CallbackRequest)
admin.site.register(EmailLog)
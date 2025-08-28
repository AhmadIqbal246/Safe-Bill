from django.contrib import admin
from .models import Feedback, QuoteRequest, ContactMessage

admin.site.register(Feedback)
admin.site.register(QuoteRequest)
admin.site.register(ContactMessage)
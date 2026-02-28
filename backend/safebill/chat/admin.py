from django.contrib import admin
from .models import ChatContact, Conversation, Message

admin.site.register(ChatContact)
admin.site.register(Conversation)
admin.site.register(Message)
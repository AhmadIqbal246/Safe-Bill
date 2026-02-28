from django.contrib import admin
from .models import Dispute, DisputeDocument, DisputeEvent, DisputeComment


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['dispute_id', 'title', 'project', 'initiator', 'respondent', 'status', 'created_at']
    list_filter = ['status', 'dispute_type', 'created_at']
    search_fields = ['dispute_id', 'title', 'description']
    readonly_fields = ['dispute_id', 'created_at', 'updated_at']


@admin.register(DisputeDocument)
class DisputeDocumentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'dispute', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['filename', 'dispute__dispute_id']


@admin.register(DisputeEvent)
class DisputeEventAdmin(admin.ModelAdmin):
    list_display = ['dispute', 'event_type', 'created_by', 'created_at']
    list_filter = ['event_type', 'created_at']
    search_fields = ['dispute__dispute_id', 'description']


@admin.register(DisputeComment)
class DisputeCommentAdmin(admin.ModelAdmin):
    list_display = ['dispute', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['dispute__dispute_id', 'content', 'author__username']

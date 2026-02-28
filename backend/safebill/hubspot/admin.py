from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Count, Q
from django.utils import timezone
import datetime

from .models import (
    HubSpotContactLink, 
    HubSpotCompanyLink, 
    HubSpotTicketLink, 
    HubSpotMilestoneLink,
    HubSpotSyncQueue
)


@admin.register(HubSpotSyncQueue)
class HubSpotSyncQueueAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'sync_type', 'content_object_link', 'status', 'priority', 
        'retry_count', 'created_at', 'processed_at', 'action_buttons'
    ]
    list_filter = [
        'sync_type', 'status', 'priority', 'created_at', 'processed_at'
    ]
    search_fields = [
        'content_object__id', 'error_message', 'worker_id'
    ]
    readonly_fields = [
        'content_type', 'object_id', 'created_at', 'processed_at', 
        'processing_started_at', 'retry_count', 'worker_id'
    ]
    list_per_page = 50
    ordering = ['-created_at']
    
    fieldsets = (
        ('Sync Information', {
            'fields': ('sync_type', 'content_type', 'object_id', 'content_object')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'retry_count', 'max_retries')
        }),
        ('Timing', {
            'fields': ('created_at', 'scheduled_at', 'processed_at', 'processing_started_at')
        }),
        ('Retry Information', {
            'fields': ('next_retry_at', 'can_retry_status'),
            'classes': ('collapse',)
        }),
        ('Error Information', {
            'fields': ('error_message', 'error_details'),
            'classes': ('collapse',)
        }),
        ('Processing', {
            'fields': ('worker_id',),
            'classes': ('collapse',)
        }),
    )
    
    def content_object_link(self, obj):
        """Create a link to the content object"""
        if obj.content_object:
            try:
                url = reverse(f'admin:{obj.content_type.app_label}_{obj.content_type.model}_change', 
                            args=[obj.object_id])
                return format_html('<a href="{}">{}</a>', url, str(obj.content_object))
            except:
                return str(obj.content_object)
        return 'N/A'
    content_object_link.short_description = 'Content Object'
    content_object_link.admin_order_field = 'object_id'
    
    def can_retry_status(self, obj):
        """Show if item can be retried"""
        if obj.can_retry():
            return format_html('<span style="color: orange;">Yes ({} retries left)</span>', 
                             obj.max_retries - obj.retry_count)
        elif obj.status == 'failed':
            return format_html('<span style="color: red;">No (max retries reached)</span>')
        else:
            return format_html('<span style="color: green;">N/A</span>')
    can_retry_status.short_description = 'Can Retry'
    
    def action_buttons(self, obj):
        """Add action buttons"""
        buttons = []
        
        if obj.status == 'failed' and obj.can_retry():
            buttons.append(
                format_html(
                    '<a class="button" href="?action=retry&id={}" onclick="return confirm(\'Retry this sync?\')">Retry</a>',
                    obj.id
                )
            )
        
        if obj.status in ['pending', 'retry']:
            buttons.append(
                format_html(
                    '<a class="button" href="?action=process&id={}" onclick="return confirm(\'Process this sync now?\')">Process Now</a>',
                    obj.id
                )
            )
        
        if obj.status == 'processing':
            buttons.append(
                format_html(
                    '<a class="button" href="?action=reset&id={}" onclick="return confirm(\'Reset this sync?\')">Reset</a>',
                    obj.id
                )
            )
        
        return format_html(' '.join(buttons)) if buttons else 'N/A'
    action_buttons.short_description = 'Actions'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('content_type')
    
    def changelist_view(self, request, extra_context=None):
        """Add summary statistics to the changelist"""
        extra_context = extra_context or {}
        
        # Get queue statistics
        stats = HubSpotSyncQueue.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            processing=Count('id', filter=Q(status='processing')),
            synced=Count('id', filter=Q(status='synced')),
            failed=Count('id', filter=Q(status='failed')),
            retry=Count('id', filter=Q(status='retry')),
        )
        
        # Get recent activity (last 24 hours)
        yesterday = timezone.now() - datetime.timedelta(days=1)
        recent_stats = HubSpotSyncQueue.objects.filter(
            created_at__gte=yesterday
        ).aggregate(
            recent_total=Count('id'),
            recent_synced=Count('id', filter=Q(status='synced')),
            recent_failed=Count('id', filter=Q(status='failed')),
        )
        
        extra_context['queue_stats'] = stats
        extra_context['recent_stats'] = recent_stats
        
        return super().changelist_view(request, extra_context)
    
    def has_add_permission(self, request):
        """Prevent manual addition of queue items"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion of failed items"""
        if obj and obj.status in ['failed', 'synced']:
            return True
        return False
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from accounts.models import User
from accounts.models import BusinessDetail
from disputes.models import Dispute
from projects.models import Milestone


class HubSpotContactLink(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="hubspot_contact_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Contact Link"
        verbose_name_plural = "HubSpot Contact Links"


class HubSpotCompanyLink(models.Model):
    business_detail = models.OneToOneField(
        BusinessDetail,
        on_delete=models.CASCADE,
        related_name="hubspot_company_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Company Link"
        verbose_name_plural = "HubSpot Company Links"


class HubSpotTicketLink(models.Model):
    dispute = models.OneToOneField(
        Dispute,
        on_delete=models.CASCADE,
        related_name="hubspot_ticket_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Ticket Link"
        verbose_name_plural = "HubSpot Ticket Links"


class HubSpotMilestoneLink(models.Model):
    milestone = models.OneToOneField(
        Milestone,
        on_delete=models.CASCADE,
        related_name="hubspot_milestone_link",
    )
    hubspot_id = models.CharField(max_length=64, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default="success")  # success|failed|pending
    last_error = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["hubspot_id"]),
        ]
        verbose_name = "HubSpot Milestone Link"
        verbose_name_plural = "HubSpot Milestone Links"


class HubSpotSyncQueue(models.Model):
    """
    Queue for non-critical HubSpot sync operations.
    Used for feedback, disputes, milestones, and contact messages.
    """
    
    # Sync type choices for better validation
    SYNC_TYPE_CHOICES = [
        ('feedback', 'Feedback'),
        ('dispute', 'Dispute'),
        ('milestone', 'Milestone'),
        ('contact_message', 'Contact Message'),
    ]
    
    # Status choices for tracking
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('synced', 'Synced'),
        ('failed', 'Failed'),
        ('retry', 'Retry'),
    ]
    
    # Priority levels for processing order
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Generic foreign key to link to any model
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="The model type being synced"
    )
    object_id = models.PositiveIntegerField(
        help_text="The ID of the object being synced"
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Sync metadata
    sync_type = models.CharField(
        max_length=50,
        choices=SYNC_TYPE_CHOICES,
        help_text="Type of sync operation"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text="Current status of the sync operation"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
        db_index=True,
        help_text="Processing priority"
    )
    
    # Timing fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the sync was queued"
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When to process this sync (for delayed processing)"
    )
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the sync was completed"
    )
    
    # Retry mechanism
    retry_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of retry attempts"
    )
    max_retries = models.PositiveIntegerField(
        default=3,
        help_text="Maximum number of retry attempts"
    )
    next_retry_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When to retry this sync"
    )
    
    # Error tracking
    error_message = models.TextField(
        blank=True,
        help_text="Last error message if sync failed"
    )
    error_details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional error details for debugging"
    )
    
    # Processing metadata
    worker_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID of the worker processing this item"
    )
    processing_started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When processing started"
    )
    
    class Meta:
        # Performance indexes
        indexes = [
            models.Index(fields=['status', 'priority', 'created_at']),
            models.Index(fields=['sync_type', 'status']),
            models.Index(fields=['scheduled_at']),
            models.Index(fields=['next_retry_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]
        
        # Prevent duplicate syncs for same object
        unique_together = [
            ['content_type', 'object_id', 'sync_type']
        ]
        
        # Ordering for efficient processing
        ordering = ['priority', 'created_at']
        
        verbose_name = "HubSpot Sync Queue Item"
        verbose_name_plural = "HubSpot Sync Queue Items"
    
    def __str__(self):
        return f"{self.sync_type} sync for {self.content_object} ({self.status})"
    
    def can_retry(self):
        """Check if this item can be retried"""
        return (
            self.status == 'failed' and 
            self.retry_count < self.max_retries
        )
    
    def mark_processing(self, worker_id):
        """Mark item as being processed"""
        self.status = 'processing'
        self.worker_id = worker_id
        from django.utils import timezone
        self.processing_started_at = timezone.now()
        self.save(update_fields=['status', 'worker_id', 'processing_started_at'])
    
    def mark_synced(self):
        """Mark item as successfully synced"""
        self.status = 'synced'
        from django.utils import timezone
        self.processed_at = timezone.now()
        self.worker_id = ''
        self.save(update_fields=['status', 'processed_at', 'worker_id'])
    
    def mark_failed(self, error_message, error_details=None):
        """Mark item as failed and schedule retry if possible"""
        self.status = 'failed'
        self.error_message = error_message
        self.error_details = error_details or {}
        self.retry_count += 1
        self.worker_id = ''
        
        if self.can_retry():
            # Schedule retry with exponential backoff
            import datetime
            retry_delay = min(300, 60 * (2 ** self.retry_count))  # Max 5 minutes
            from django.utils import timezone
            self.next_retry_at = timezone.now() + datetime.timedelta(seconds=retry_delay)
            self.status = 'retry'
        else:
            self.next_retry_at = None
        
        self.save(update_fields=[
            'status', 'error_message', 'error_details', 'retry_count', 
            'next_retry_at', 'worker_id'
        ])

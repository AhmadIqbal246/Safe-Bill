from django.db import models
from django.conf import settings
from projects.models import Project


class Dispute(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('in_progress', 'In Progress'),
        ('mediation_initiated', 'Mediation Initiated'),
        ('awaiting_decision', 'Awaiting Decision'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    DISPUTE_TYPE_CHOICES = [
        ('payment_issue', 'Payment Issue'),
        ('quality_issue', 'Quality Issue'),
        ('delivery_delay', 'Delivery Delay'),
        ('communication_issue', 'Communication Issue'),
        ('scope_creep', 'Scope Creep'),
        ('other', 'Other'),
    ]

    # Basic Information
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='disputes')
    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='initiated_disputes'
    )
    respondent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='responded_disputes'
    )
    
    # Dispute Details
    dispute_type = models.CharField(max_length=50, choices=DISPUTE_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Status and Tracking
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='submitted')
    assigned_mediator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_disputes'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Resolution
    resolution_details = models.TextField(blank=True, null=True)
    resolution_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Reference
    dispute_id = models.CharField(max_length=20, unique=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Dispute {self.dispute_id} - {self.title}"
    
    def save(self, *args, **kwargs):
        if not self.dispute_id:
            # Generate dispute ID: DSP-YYYY-XXXXX
            import datetime
            year = datetime.datetime.now().year
            last_dispute = Dispute.objects.filter(
                dispute_id__startswith=f'DSP-{year}-'
            ).order_by('-dispute_id').first()
            
            if last_dispute:
                last_number = int(last_dispute.dispute_id.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.dispute_id = f'DSP-{year}-{new_number:05d}'
        
        super().save(*args, **kwargs)


class DisputeDocument(models.Model):
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='disputes/documents/')
    filename = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.filename} - {self.dispute.dispute_id}"


class DisputeEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ('submitted', 'Dispute Submitted'),
        ('mediation_initiated', 'Mediation Initiated'),
        ('awaiting_decision', 'Awaiting Decision'),
        ('mediator_assigned', 'Mediator Assigned'),
        ('comment_added', 'Comment Added'),
        ('document_uploaded', 'Document Uploaded'),
        ('status_changed', 'Status Changed'),
        ('resolved', 'Dispute Resolved'),
        ('closed', 'Dispute Closed'),
    ]

    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    description = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.dispute.dispute_id}"


class DisputeComment(models.Model):
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.dispute.dispute_id}"

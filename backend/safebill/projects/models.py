from django.db import models
from django.conf import settings


# Create your models here.

class Project(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_projects',
        null=True,
        blank=True,
        help_text="The buyer/client who accepted the project invite"
    )
    name = models.CharField(max_length=255)
    client_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    invite_token = models.CharField(
        max_length=64, unique=True, null=True, blank=True
    )
    invite_token_expiry = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Quote(models.Model):
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name='quote'
    )
    file = models.FileField(upload_to='quotes/')
    reference_number = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.reference_number} for {self.project.name}"


class PaymentInstallment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='installments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    step = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.project.name} - {self.step} - {self.amount}"


class Milestone(models.Model):
    STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('pending', 'Pending'),
        ('not_approved', 'Not Approved'),
        ('not_submitted', 'Not Submitted'),
        ('not_approved', 'Not Approved'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='milestones'
    )
    related_installment = models.OneToOneField(
        PaymentInstallment,
        on_delete=models.CASCADE,
        related_name='milestone',
        null=True,
        blank=True,
        help_text="The corresponding payment installment for this milestone"
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    supporting_doc = models.FileField(
        upload_to='milestones/documents/',
        null=True,
        blank=True,
        help_text="Supporting documentation for the milestone"
    )
    completion_notice = models.TextField(
        blank=True,
        help_text="Notice sent when milestone is completed"
    )
    created_date = models.DateTimeField(auto_now_add=True)
    completion_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when milestone was completed"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_submitted'
    )
    relative_payment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Payment amount for this milestone"
    )

    class Meta:
        ordering = ['created_date']

    def __str__(self):
        return f"{self.name} - {self.project.name}"

    def save(self, *args, **kwargs):
        # Check if this is a new milestone and if project already has 3
        # milestones
        if not self.pk:  # New milestone
            existing_count = Milestone.objects.filter(
                project=self.project
            ).count()
            if existing_count >= 3:
                raise ValueError(
                    "Maximum 3 milestones allowed per project"
                )
        
        super().save(*args, **kwargs)

    @property
    def is_completed(self):
        return self.status == 'approved' and self.completion_date is not None

from django.db import models
from django.conf import settings


# Create your models here.

class Project(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects'
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

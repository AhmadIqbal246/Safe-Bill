from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.


class User(AbstractUser):
    ROLE_CHOICES = [
        ('seller', 'Seller'),
        ('buyer', 'Buyer'),
        ('admin', 'Admin'),
    ]
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    onboarding_complete = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    # You can add more fields as needed for onboarding

    def __str__(self):
        return f"{self.username} ({self.role})"


class BusinessDetail(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='business_detail')
    company_name = models.CharField(max_length=255)
    siret_number = models.CharField(max_length=50)
    full_address = models.TextField()
    type_of_activity = models.CharField(max_length=255)
    service_area = models.CharField(max_length=255)
    siret_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.company_name} (SIRET: {self.siret_number})"

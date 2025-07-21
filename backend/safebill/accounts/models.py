from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField

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
    company_contact_person = models.CharField(max_length=255, blank=True)
    skills = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list
    )
    

    def __str__(self):
        return f"{self.company_name} (SIRET: {self.siret_number})"


class BankAccount(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bank_account'
    )
    account_holder_name = models.CharField(max_length=255)
    iban = models.CharField(max_length=34, blank=True, unique=True)
    bank_code = models.CharField(max_length=20)
    branch_code = models.CharField(max_length=20)
    rib_key = models.CharField(max_length=10, unique=True)
    bic_swift = models.CharField(max_length=20, unique=True)
    bank_name = models.CharField(max_length=255)
    bank_address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.account_holder_name} - {self.bank_name}"

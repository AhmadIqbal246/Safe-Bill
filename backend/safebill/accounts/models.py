from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.


class User(AbstractUser):
    ROLE_CHOICES = [
        ('seller', 'Seller'),
        ('buyer', 'Buyer'),
        ('professional-buyer', 'Professional Buyer'),
        ('admin', 'Admin'),
    ]
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    onboarding_complete = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_pic = models.ImageField(
        upload_to='profile_pics/', null=True, blank=True
    )
    about = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class BusinessDetail(models.Model):
    user = models.OneToOneField(
        'User', on_delete=models.CASCADE, related_name='business_detail'
    )
    company_name = models.CharField(max_length=255)
    siret_number = models.CharField(max_length=50)
    full_address = models.TextField()
    type_of_activity = models.CharField(max_length=255, default='')
    selected_categories = models.JSONField(
        default=list, blank=True
    )
    selected_subcategories = models.JSONField(
        default=list, blank=True
    )
    selected_service_areas = models.JSONField(
        default=list, blank=True
    )
    department_numbers = models.CharField(max_length=255, blank=True)
    siret_verified = models.BooleanField(default=False)
    company_contact_person = models.CharField(max_length=255, blank=True)
    skills = models.JSONField(default=list, blank=True)

    def __str__(self):
        siret_info = (f"(SIRET: "
                     f"{self.siret_number})")
        return (f"{self.company_name} "
                f"{siret_info}")


class BankAccount(models.Model):
    user = models.OneToOneField(
        'User', on_delete=models.CASCADE, related_name='bank_account'
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


class BuyerModel(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyer_profile')
    first_name = models.CharField(max_length=150, null=True, blank=True)
    last_name = models.CharField(max_length=150, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.user.email})"
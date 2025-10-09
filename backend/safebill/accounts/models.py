from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Avg, Count
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Create your models here.


class User(AbstractUser):
    ROLE_CHOICES = [
        ('seller', 'Seller'),
        ('buyer', 'Buyer'),
        ('professional-buyer', 'Professional Buyer'),
        ('admin', 'Admin'),
        ('super-admin', 'Super Admin'),
    ]
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    # Canonical list of roles this user is allowed to switch to (system-managed, not user-editable)
    available_roles = models.JSONField(default=list, blank=True, help_text="System-managed field - users cannot edit this directly")
    # Added: active role for this session/user to drive dashboards, routing, and permissions
    active_role = models.CharField(max_length=20, choices=[('seller', 'Seller'), ('professional-buyer', 'Professional Buyer')], blank=True, null=True)
    is_admin = models.BooleanField(
        default=False, 
        help_text=(
            "Whether this user has admin privileges assigned by super-admin"
        )
    )
    onboarding_complete = models.BooleanField(default=False)
    # New onboarding completion fields for role-specific tracking
    seller_onboarding_complete = models.BooleanField(default=False)
    pro_buyer_onboarding_complete = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_pic = models.ImageField(
        upload_to='profile_pics/', null=True, blank=True
    )
    about = models.TextField(null=True, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, help_text="Average rating from all received ratings")
    rating_count = models.PositiveIntegerField(default=0, help_text="Total number of ratings received")

    def __str__(self):
        return f"{self.username} ({self.role})"

    def save(self, *args, **kwargs):
        # Ensure available_roles is only set by the system, not by user input
        # This prevents users from modifying their available roles
        if hasattr(self, '_skip_available_roles_check'):
            # Skip the check if this is a system operation
            super().save(*args, **kwargs)
        else:
            # For normal saves, preserve the existing available_roles
            if self.pk:
                try:
                    original = User.objects.get(pk=self.pk)
                    self.available_roles = original.available_roles
                except User.DoesNotExist:
                    pass
            super().save(*args, **kwargs)

    @property
    def is_super_admin(self):
        """Check if user is a super admin"""
        return self.role == 'super-admin'

    @property
    def has_admin_access(self):
        """Check if user has admin access (either super-admin or admin with is_admin=True)"""
        return self.is_super_admin or (self.role == 'admin' or self.is_admin)


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
    #department_numbers = models.CharField(max_length=255, blank=True)
    siret_verified = models.BooleanField(default=False)
    #company_contact_person = models.CharField(max_length=255, blank=True)
    company_contact_person_first_name = models.CharField(
        max_length=255, blank=True
    )
    company_contact_person_last_name = models.CharField(
        max_length=255, blank=True
    ) 
    #skills = models.JSONField(default=list, blank=True)

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


class SellerRating(models.Model):
    """Rating that a buyer gives to a seller for a specific project."""
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_ratings')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_ratings')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='seller_ratings')
    rating = models.PositiveSmallIntegerField(default=0)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('seller', 'buyer', 'project')

    def __str__(self):
        return f"{self.seller.username} rated {self.rating} by {self.buyer.username} for {self.project_id}"


@receiver([post_save, post_delete], sender=SellerRating)
def update_seller_rating_stats(sender, instance, **kwargs):
    """Update seller's average rating and rating count when ratings change"""
    seller = instance.seller
    
    # Calculate new average rating and count
    rating_stats = SellerRating.objects.filter(seller=seller).aggregate(
        avg_rating=Avg('rating'),
        rating_count=Count('id')
    )
    
    # Update seller's rating fields
    seller.average_rating = rating_stats['avg_rating'] or 0.00
    seller.rating_count = rating_stats['rating_count'] or 0
    seller.save(update_fields=['average_rating', 'rating_count'])
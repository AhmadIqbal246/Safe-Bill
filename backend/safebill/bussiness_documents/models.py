from django.db import models
from django.conf import settings

# Create your models here.

class Document(models.Model):
    DOCUMENT_TYPES = [
        ('kbis', 'Kbis Extract'),
        ('pro_insurance', 'Professional Liability Insurance Certificate'),
        ('insurance', 'Insurance Certificate'),
        ('id', 'ID of Main Contact'),
        ('rib', 'Company Bank Details (RIB)'),
        # Add more as needed
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=32, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.get_document_type_display()}"

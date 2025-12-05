from django.db import models
from django.conf import settings

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.CharField(max_length=255)
    translation_key = models.CharField(max_length=100, null=True, blank=True, help_text="Translation key for i18n (e.g., notifications.project_created)")
    translation_variables = models.JSONField(null=True, blank=True, help_text="Variables for translation interpolation")
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    # Optionally: type, link, etc.

    def __str__(self):
        return f"{self.user.email}: {self.message}"
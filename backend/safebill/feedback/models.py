from django.db import models


class Feedback(models.Model):
    email = models.EmailField()
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback from {self.email} at {self.created_at}"


class QuoteRequest(models.Model):
    from_email = models.EmailField()
    to_email = models.EmailField()
    subject = models.CharField(max_length=200)
    body = models.TextField()
    professional_id = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f"Quote request from {self.from_email} to "
                f"{self.to_email} at {self.created_at}")
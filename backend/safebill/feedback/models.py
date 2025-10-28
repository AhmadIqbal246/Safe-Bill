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


class ContactMessage(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contact message from {self.name} <{self.email}> at {self.created_at}"


class CallbackRequest(models.Model):
    """Stores a user's request for a callback from the dashboard.

    We capture minimal business context so Sales/CS can follow up and we can
    later sync this record to HubSpot as a Lead custom object.
    """

    ROLE_CHOICES = (
        ("seller", "Seller"),
        ("professional-buyer", "Professional Buyer"),
    )

    company_name = models.CharField(max_length=255)
    siret_number = models.CharField(max_length=50, blank=True, default="")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    source = models.CharField(max_length=50, default="callback_form")

    status = models.CharField(max_length=30, default="new")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"CallbackRequest {self.id} - {self.company_name} ({self.email})"
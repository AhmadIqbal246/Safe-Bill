from django.urls import path
from .views import subscribe, subscription_status, subscription_webhook, eligibility


urlpatterns = [
    path("subscribe/", subscribe, name="subscription-subscribe"),
    path("status/", subscription_status, name="subscription-status"),
    path("webhook/", subscription_webhook, name="subscription-webhook"),
    path("eligibility/", eligibility, name="subscription-eligibility"),
]




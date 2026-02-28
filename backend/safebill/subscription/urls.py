from django.urls import path
from .views import subscribe, subscription_status, subscription_webhook, eligibility, seller_subscription_invoices


urlpatterns = [
    path("subscribe/", subscribe, name="subscription-subscribe"),
    path("status/", subscription_status, name="subscription-status"),
    path("webhook/", subscription_webhook, name="subscription-webhook"),
    path("eligibility/", eligibility, name="subscription-eligibility"),
    path("invoices/", seller_subscription_invoices, name="seller-subscription-invoices"),
]




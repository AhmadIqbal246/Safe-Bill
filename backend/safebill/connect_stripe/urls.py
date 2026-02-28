from django.urls import path
from .views import (
    connect_stripe,
    stripe_connect_webhook,
    check_stripe_status,
    create_stripe_identity_session,
    check_stripe_identity_status,
    stripe_identity_webhook,
)

urlpatterns = [
    path("stripe-connect/", connect_stripe, name="stripe-connect"),
    path("connect/webhook/", stripe_connect_webhook, name="stripe-connect-webhook"),
    path("stripe-status/", check_stripe_status, name="stripe-status"),
    path(
        "stripe-identity/create/",
        create_stripe_identity_session,
        name="stripe-identity-create",
    ),
    path(
        "stripe-identity/status/",
        check_stripe_identity_status,
        name="stripe-identity-status",
    ),
    path(
        "identity/webhook/",
        stripe_identity_webhook,
        name="identity-webhook",
    ),
]

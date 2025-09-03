from django.urls import path
from .views import create_stripe_payment, check_payment_status

urlpatterns = [
    path(
        "create-stripe-payment/",
        create_stripe_payment,
        name="create_stripe_payment",
    ),
    path(
        "check-payment-status/",
        check_payment_status,
        name="check_payment_status",
    ),
]

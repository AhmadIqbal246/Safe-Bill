from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import stripe
from django.contrib.auth import get_user_model
from projects.models import Project, PaymentInstallment
from .models import Payment

import logging

logger = logging.getLogger(__name__)

User = get_user_model()


# Create your views here.
# ====================================================================== Stripe Checkout Session ===========================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_stripe_payment(request):
    """
    Create a Stripe checkout session for the authenticated user
    """
    user = request.user
    redirect_url = request.data.get("redirect_url")
    token = request.data.get("token")
    stripe.api_key = settings.STRIPE_API_KEY

    try:
        project = Project.objects.get(invite_token=token)
        payment_installments = PaymentInstallment.objects.filter(project=project)
        amount = sum(
            payment_installment.amount for payment_installment in payment_installments
        )
        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "unit_amount": int(amount * 100),
                        "product_data": {"name": "Project Payment"},
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=redirect_url,
            metadata={"project_id": project.id},
        )
        # Delete any existing payments for this project
        Payment.objects.filter(project=project).delete()

        # Create new payment record
        Payment.objects.create(
            user=user,
            amount=amount,
            status="pending",
            project=project,
            stripe_payment_id=checkout_session.id,
        )
        project.status = "payment_in_progress"
        project.save()
        return Response(
            {
                "detail": "Stripe checkout session created successfully.",
                "stripe_checkout_session_url": checkout_session.url,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error creating Stripe checkout session: {e}")
        return Response({"error": "Failed to create checkout session"}, status=500)


# ====================================================================== Check Payment Status ======================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_payment_status(request):
    """
    Check the status of the payment
    """
    user = request.user
    token = request.query_params.get("token")
    try:
        project = Project.objects.get(invite_token=token)
        payment = Payment.objects.get(project=project)
        return Response({"status": payment.status}, status=200)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)
    except Payment.DoesNotExist:
        return Response({"status": "pending"}, status=200)

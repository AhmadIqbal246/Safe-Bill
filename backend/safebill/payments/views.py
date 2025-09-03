from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import stripe
from django.contrib.auth import get_user_model
from projects.models import Project, PaymentInstallment
from .models import Payment, Balance, Payout
from .serializers import (
    PaymentSerializer,
    BalanceSerializer,
    PayoutSerializer,
)
from .transfer_service import TransferService
from connect_stripe.models import StripeAccount

import logging

logger = logging.getLogger(__name__)

User = get_user_model()


# Create your views here.
# ====================================================================== Stripe Checkout Session ===========================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_stripe_payment(request, project_id):
    """
    Create a Stripe checkout session for the authenticated user
    """
    user = request.user
    project = Project.objects.get(id=project_id)
    redirect_url = request.data.get("redirect_url")
    stripe.api_key = settings.STRIPE_API_KEY

    try:
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
        # Delete any existing payments for this project by this user
        Payment.objects.filter(project=project, user=user).delete()

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
def check_payment_status(request, project_id):
    """
    Check the status of the payment
    """
    user = request.user
    try:
        project = Project.objects.get(id=project_id)
        # Get the most recent payment for this project by this user
        payment = (
            Payment.objects.filter(project=project, user=user)
            .order_by("-created_at")
            .first()
        )

        if payment:
            return Response({"status": payment.status}, status=200)
        else:
            return Response({"status": "pending"}, status=200)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)


# ====================================================================== Billings (Payments list) =============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_billings(request):
    """
    Return the authenticated user's payments (billings).
    """
    user = request.user
    payments = (
        Payment.objects.filter(user=user)
        .select_related("project")
        .order_by("-created_at")
    )
    serializer = PaymentSerializer(payments, many=True)
    return Response(
        {"count": len(serializer.data), "results": serializer.data}, status=200
    )


# ====================================================================== Balance summary ======================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance_summary(request):
    """
    Return current balance and related aggregates for the authenticated user.
    Creates a Balance row on first access if missing.
    """
    user = request.user
    balance, _ = Balance.objects.get_or_create(user=user)
    payments = Payment.objects.filter(user=user, status="paid")
    if user.role != "seller":
        balance.total_spent = sum(payment.amount for payment in payments)

    balance.save()
    serializer = BalanceSerializer(balance)
    return Response(serializer.data, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer_to_stripe_account(request):
    """
    Transfer seller's balance to their Stripe Connect account
    """
    try:
        user = request.user

        # Check if user has seller role
        if not hasattr(user, "role") or user.role != "seller":
            return Response(
                {"detail": "Only sellers can transfer funds."},
                status=400,
            )

        # Get amount from request (optional - defaults to full balance)
        amount = request.data.get("amount")
        if amount:
            try:
                amount = float(amount)
                if amount <= 0:
                    return Response(
                        {"detail": "Amount must be greater than 0."},
                        status=400,
                    )
            except (ValueError, TypeError):
                return Response(
                    {"detail": "Invalid amount format."},
                    status=400,
                )

        # Get currency (optional, defaults to EUR)
        currency = request.data.get("currency", "EUR").upper()

        # Create transfer
        result = TransferService.transfer_to_seller_account(user, amount, currency)

        if result.get("success"):
            return Response(result, status=201)
        else:
            return Response(
                {"detail": result.get("error", "Failed to create transfer")},
                status=400,
            )

    except Exception as e:
        logger.error(f"Error creating transfer: {e}")
        return Response(
            {"detail": "Failed to create transfer."},
            status=500,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_transfer_info(request):
    """
    Get transfer information for the authenticated seller
    """
    try:
        user = request.user

        # Check if user has seller role
        if not hasattr(user, "role") or user.role != "seller":
            return Response(
                {"detail": "Only sellers can access transfer information."},
                status=400,
            )

        # Get transfer info
        info = TransferService.get_transfer_info(user)
        return Response(info, status=200)

    except Exception as e:
        logger.error(f"Error getting transfer info: {e}")
        return Response(
            {"detail": "Failed to get transfer information."},
            status=500,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_transfers(request):
    """
    List transfer history for the authenticated seller
    """
    try:
        user = request.user

        # Check if user has seller role
        if not hasattr(user, "role") or user.role != "seller":
            return Response(
                {"detail": "Only sellers can view transfer history."},
                status=400,
            )

        # Get transfers for this user
        transfers = Payout.objects.filter(user=user).order_by("-created_at")
        serializer = PayoutSerializer(transfers, many=True)

        return Response(
            {"results": serializer.data, "count": transfers.count()}, status=200
        )

    except Exception as e:
        logger.error(f"Error listing transfers: {e}")
        return Response(
            {"detail": "Failed to retrieve transfer history."},
            status=500,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_stripe_login_link(request):
    """
    Generate a login link for the seller's Stripe Dashboard
    """
    try:
        user = request.user

        # Only sellers can generate login links
        if user.role != "seller":
            return Response(
                {"detail": "Only sellers can access Stripe Dashboard"},
                status=403,
            )

        # Generate login link using TransferService
        result = TransferService.generate_stripe_dashboard_login_link(user)

        if result["success"]:
            return Response(
                {
                    "success": True,
                    "login_url": result["login_url"],
                    "expires_at": result["expires_at"],
                    "account_id": result["account_id"],
                }
            )
        else:
            return Response(
                {"detail": result["error"]},
                status=400,
            )

    except Exception as e:
        logger.error(
            f"Error generating Stripe login link for user {request.user.id}: {str(e)}"
        )
        return Response(
            {"detail": "Failed to generate login link"},
            status=500,
        )

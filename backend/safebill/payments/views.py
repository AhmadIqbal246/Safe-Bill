from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import stripe
from django.contrib.auth import get_user_model
from projects.models import Project, PaymentInstallment, Milestone
from decimal import Decimal, ROUND_HALF_UP, DecimalException
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Q
from .models import Payment, Balance, Payout, PayoutHold, PayoutHold, Refund
from .serializers import (
    PaymentSerializer,
    BalanceSerializer,
    PayoutSerializer,
    PayoutHoldSerializer,
    RefundSerializer,
)
from .transfer_service import TransferService
from .services import BalanceService, FeeCalculationService
from connect_stripe.models import StripeAccount
from notifications.models import Notification
from notifications.services import NotificationService
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
        # Ensure Decimal math
        amount = Decimal(str(amount))

        # Calculate amounts: buyer pays base + VAT only; platform fee reduces seller net
        fees = FeeCalculationService.calculate_fees(
            base_amount=amount,
            platform_fee_percentage=project.platform_fee_percentage,
            vat_rate=project.vat_rate,
        )
        platform_fee = fees["platform_fee"]
        buyer_total = fees["buyer_total"]
        seller_net = fees["seller_net"]
        # Build checkout session params
        checkout_params = {
            "customer_email": user.email,
            "line_items": [
                {
                    "price_data": {
                        "currency": "eur",
                        "unit_amount": int(buyer_total * 100),
                        "product_data": {"name": "Project Payment"},
                    },
                    "quantity": 1,
                }
            ],
            "mode": "payment",
            "success_url": redirect_url,
            "metadata": {
                "project_id": project.id,
                "base_amount": str(amount),
                "platform_fee": str(platform_fee),
                "buyer_total": str(buyer_total),
                "seller_net": str(seller_net),
                "vat_amount": str((buyer_total - amount)),
            },
        }

        # Restrict to card only when buyer_total > 1000
        if buyer_total > Decimal("1000"):
            checkout_params["payment_method_types"] = ["card"]

        checkout_session = stripe.checkout.Session.create(**checkout_params)
        # Delete any existing payments for this project by this user
        Payment.objects.filter(project=project, user=user).delete()

        # Create new payment record
        Payment.objects.create(
            user=user,
            amount=amount,
            platform_fee_amount=platform_fee,
            buyer_total_amount=buyer_total,
            seller_net_amount=seller_net,
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
    # For buyers, reconcile escrow before returning billings
    if hasattr(user, "role") and user.role != "seller":
        try:
            BalanceService.reconcile_buyer_escrow(user)
        except Exception as e:
            logger.error(f"Error reconciling buyer escrow for user {user.id}: {e}")

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


# ======================================================================== Transfer to Stripe Account ======================================================================
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
                amount = Decimal(str(amount))
                if amount <= 0:
                    return Response(
                        {"detail": "Amount must be greater than 0."},
                        status=400,
                    )
            except (ValueError, TypeError, DecimalException):
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


# ======================================================================== Get Transfer Info ======================================================================
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


# ======================================================================== List Transfers ======================================================================
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


# ====================================================================== Payout holds (seller) =============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_payout_holds(request):
    """
    Return payout holds for the authenticated seller (unreleased and recent released).
    """
    try:
        user = request.user
        if not hasattr(user, "role") or user.role != "seller":
            return Response(
                {"detail": "Only sellers can view payout holds."}, status=400
            )

        # Release matured holds for all users (including current user)
        try:

            sellers = User.objects.filter(role="seller")
            total_released = 0
            for seller in sellers:
                released = BalanceService.release_matured_holds(seller)
                total_released += released
                if released > 0:
                    logger.info(f"Released ${released} for seller {seller.email}")
            if total_released > 0:
                logger.info(f"Auto-released total ${total_released} for all sellers")
        except Exception as e:
            logger.error(f"Error in auto-release of matured holds: {e}")

        # Only show unreleased holds (matured holds are automatically released above)
        holds = (
            PayoutHold.objects.filter(user=user, released=False)
            .select_related("project")
            .order_by("hold_until")
        )
        serializer = PayoutHoldSerializer(holds, many=True)
        return Response(
            {"results": serializer.data, "count": len(serializer.data)}, status=200
        )
    except Exception as e:
        logger.error(f"Error listing payout holds: {e}")
        return Response({"detail": "Failed to retrieve payout holds."}, status=500)


# ======================================================================== Get Project Platform Fee ======================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_project_platform_fee(request, project_id):
    """
    Return platform fee information for a specific project.
    Takes project_id as parameter and returns the platform fee percentage and calculated fee amount.
    """
    try:
        from projects.models import Project

        # Get the project
        project = Project.objects.get(id=project_id)

        # Get the platform fee percentage from the project
        platform_fee_percentage = project.platform_fee_percentage

        # Calculate the fee amount for the milestone
        milestone_amount = request.query_params.get("milestone_amount", 0)
        try:
            milestone_amount = float(milestone_amount)
        except (ValueError, TypeError):
            milestone_amount = 0.0

        # Convert milestone_amount to Decimal for proper calculation
        from decimal import Decimal

        milestone_amount_decimal = Decimal(str(milestone_amount))

        # Calculate platform fee amount using Decimal arithmetic
        platform_fee_amount = (milestone_amount_decimal * platform_fee_percentage) / 100

        response_data = {
            "platform_fee_percentage": float(platform_fee_percentage),
            "platform_fee_amount": round(float(platform_fee_amount), 2),
            "milestone_amount": milestone_amount,
            "project_id": project_id,
        }

        return Response(response_data, status=200)

    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)
    except Exception as e:
        logger.error(f"Error fetching project platform fee: {str(e)}")
        return Response({"error": "Failed to fetch platform fee"}, status=500)


# ======================================================================== Generate Stripe Login Link ======================================================================
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


# ======================================================================== Revenue Comparison ======================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def revenue_comparison(request):
    """
    Get current month's revenue and compare with last month's revenue
    based on completed milestones for the authenticated seller.
    """
    try:
        user = request.user

        # Check if user has seller role
        if not hasattr(user, "role") or user.role != "seller":
            return Response(
                {"detail": "Only sellers can access revenue data."},
                status=400,
            )

        # Get current date and calculate month boundaries
        now = timezone.now()
        current_month_start = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        # Calculate last month's start and end
        if current_month_start.month == 1:
            last_month_start = current_month_start.replace(
                year=current_month_start.year - 1, month=12
            )
        else:
            last_month_start = current_month_start.replace(
                month=current_month_start.month - 1
            )

        last_month_end = current_month_start - timedelta(microseconds=1)

        # Get seller's projects
        seller_projects = Project.objects.filter(user=user)

        # Calculate current month revenue from approved milestones
        current_month_milestones = Milestone.objects.filter(
            project__in=seller_projects,
            status="approved",
            completion_date__gte=current_month_start,
            completion_date__lt=now,
        )

        current_month_revenue = current_month_milestones.aggregate(
            total=Sum("relative_payment")
        )["total"] or Decimal("0")

        # Calculate last month revenue from approved milestones
        last_month_milestones = Milestone.objects.filter(
            project__in=seller_projects,
            status="approved",
            completion_date__gte=last_month_start,
            completion_date__lte=last_month_end,
        )

        last_month_revenue = last_month_milestones.aggregate(
            total=Sum("relative_payment")
        )["total"] or Decimal("0")

        # Calculate percentage change
        if last_month_revenue > 0:
            percentage_change = (
                (current_month_revenue - last_month_revenue) / last_month_revenue
            ) * 100
        else:
            # If last month had no revenue, we can't calculate percentage
            percentage_change = None

        # Determine if it's an increase or decrease
        if percentage_change is not None:
            is_increase = percentage_change > 0
            change_type = "increase" if is_increase else "decrease"
        else:
            change_type = "no_previous_data"

        # Get additional stats
        current_month_milestone_count = current_month_milestones.count()
        last_month_milestone_count = last_month_milestones.count()

        # Get current month name for display
        current_month_name = current_month_start.strftime("%B %Y")
        last_month_name = last_month_start.strftime("%B %Y")

        response_data = {
            "current_month": {
                "month": current_month_name,
                "revenue": float(current_month_revenue),
                "milestone_count": current_month_milestone_count,
                "currency": "EUR",  # Assuming EUR based on the payment views
            },
            "last_month": {
                "month": last_month_name,
                "revenue": float(last_month_revenue),
                "milestone_count": last_month_milestone_count,
                "currency": "EUR",
            },
            "comparison": {
                "revenue_difference": float(current_month_revenue - last_month_revenue),
                "percentage_change": (
                    float(percentage_change) if percentage_change is not None else None
                ),
                "change_type": change_type,
                "is_positive": is_increase if percentage_change is not None else True,
            },
        }

        return Response(response_data, status=200)

    except Exception as e:
        logger.error(
            f"Error calculating revenue comparison for user {request.user.id}: {e}"
        )
        return Response(
            {"detail": "Failed to calculate revenue comparison."},
            status=500,
        )


# ======================================================================== Payment Refund ======================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_refund(request, project_id):
    """
    Refund a payment
    """
    try:
        user = request.user
        project = Project.objects.get(id=project_id)
        amount = project.refundable_amount
        status = request.data.get("status", "pending")
        payment = Payment.objects.get(project=project)
        stripe_payment_id = payment.stripe_payment_id
        stripe.api_key = settings.STRIPE_API_KEY

        refund = Refund.objects.create(
            user=user,
            project=project,
            amount=amount,
            status=status,
        )

        stripe_refund = stripe.Refund.create(
            payment_intent=stripe_payment_id,
            amount=int(amount * 100),
            reason="requested_by_customer",
            metadata={"refund_id": str(refund.id)},
        )
        refund.stripe_refund_id = stripe_refund.id
        refund.save()

        return Response({"detail": "Refund created successfully"}, status=201)
    except Exception as e:
        logger.error(f"Error creating refund: {e}")
        return Response({"detail": "Failed to create refund."}, status=500)


# ======================================================================== Update Refund balance ======================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_refund_balance(request, milestone_id):
    """
    Update the balance of a refund
    """
    try:
        milestone = Milestone.objects.get(id=milestone_id)
        milestone.status = "payment_withdrawal"
        milestone.save()
        project = milestone.project
        project.refundable_amount += milestone.relative_payment
        project.save()

        balance = Balance.objects.get(user=project.client)
        balance.held_in_escrow -= milestone.relative_payment
        balance.save()

        NotificationService.create_notification(
            user=project.client,
            message="Refund balance updated successfully",
            notification_type="refund_balance_updated",
        )
        return Response({"detail": "Refund updated successfully"}, status=200)
    except Exception as e:
        logger.error(f"Error updating refund balance: {e}")
        return Response({"detail": "Failed to update refund balance."}, status=500)

from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Balance, Payment, PayoutHold, PlatformFeeConfig
from django.contrib.auth import get_user_model
from projects.models import Project, Milestone
from notifications.services import NotificationService
import logging

User = get_user_model()

logger = logging.getLogger(__name__)


class FeeCalculationService:
    """
    Service class for calculating all platform and Stripe fees
    """

    @staticmethod
    def calculate_fees(base_amount):
        """
        Calculate all fees for a given base amount.

        Args:
            base_amount (Decimal): The base project amount

        Returns:
            dict: Dictionary containing all calculated fees and amounts
        """
        # Ensure Decimal math
        base_amount = Decimal(str(base_amount))

        # Get fee configuration
        cfg = PlatformFeeConfig.current()
        buyer_fee_pct = Decimal(str(cfg.buyer_fee_pct))
        seller_fee_pct = Decimal(str(cfg.seller_fee_pct))

        # Stripe constants
        stripe_fee_pct = Decimal("0.029")
        stripe_fixed = Decimal("0.30")

        # Calculate platform fees
        buyer_fee_amount = base_amount * buyer_fee_pct
        seller_fee_amount = base_amount * seller_fee_pct

        # Platform fee is only the buyer fee (matching frontend logic)
        platform_fee = buyer_fee_amount

        # Stripe takes fee on total processed amount (base_amount + platform_fee)
        stripe_fee_base = base_amount + platform_fee
        stripe_fee = stripe_fee_base * stripe_fee_pct + stripe_fixed

        # Calculate final amounts
        # Buyer pays: base amount + buyer fee + stripe fee
        buyer_total = base_amount + buyer_fee_amount + stripe_fee

        # Seller receives: base amount - seller fee - stripe fee
        seller_net = base_amount - seller_fee_amount - stripe_fee

        return {
            "base_amount": base_amount,
            "buyer_fee_pct": buyer_fee_pct,
            "seller_fee_pct": seller_fee_pct,
            "buyer_fee_amount": buyer_fee_amount,
            "seller_fee_amount": seller_fee_amount,
            "platform_fee": platform_fee,
            "stripe_fee_pct": stripe_fee_pct,
            "stripe_fixed": stripe_fixed,
            "stripe_fee": stripe_fee,
            "buyer_total": buyer_total,
            "seller_net": seller_net,
        }

    @staticmethod
    def calculate_seller_net_for_amount(project, base_amount):
        """
        Calculate seller net amount for a given base amount using existing payment data if available.

        Args:
            project: Project object
            base_amount (Decimal): The base amount to calculate net for

        Returns:
            Decimal: Seller net amount
        """
        # Ensure Decimal math
        base_amount = Decimal(str(base_amount))

        # Try to use existing payment data for this project
        payment = Payment.objects.filter(project=project, status="paid").first()

        if payment and payment.amount > Decimal("0.00"):
            # Use the same fee structure as the existing payment
            net_factor = payment.seller_net_amount / payment.amount
            net_amount = base_amount * net_factor
            logger.info(
                f"Using stored payment fees for project {project.id}: net_factor={net_factor}, net_amount={net_amount}"
            )
            return net_amount
        else:
            # Calculate using current fee configuration
            fees = FeeCalculationService.calculate_fees(base_amount)
            return fees["seller_net"]

    @staticmethod
    def estimate_seller_net(base_amount):
        """
        Estimate seller net amount for a given base amount using current fee configuration.

        Args:
            base_amount (Decimal): The base amount to calculate net for

        Returns:
            Decimal: Estimated seller net amount
        """
        fees = FeeCalculationService.calculate_fees(base_amount)
        return max(fees["seller_net"], Decimal("0.00"))


class BalanceService:
    """
    Service class for managing user balances and payments
    """

    @staticmethod
    def update_seller_balance_on_milestone_approval(seller, milestone_amount):
        """
        Update seller's balance when a milestone is approved by the client.
        Expects a net milestone amount (after platform and processor fees).
        This adds the net amount to current_balance and total_earnings.

        Args:
            seller: User object (the seller)
            milestone_amount: Decimal amount to add to balance
        """
        with transaction.atomic():
            # Get or create balance for the seller
            balance, created = Balance.objects.get_or_create(
                user=seller,
                defaults={
                    "current_balance": Decimal("0.00"),
                    "total_earnings": Decimal("0.00"),
                    "total_spent": Decimal("0.00"),
                    "held_in_escrow": Decimal("0.00"),
                    "available_for_payout": Decimal("0.00"),
                },
            )

            # Update the balance
            balance.current_balance += milestone_amount
            balance.total_earnings += milestone_amount
            balance.save()

            return balance

    @staticmethod
    def create_payout_hold_for_milestone(seller, project, amount):
        """
        Create a payout hold record for the seller for the milestone amount (net).
        The hold will be released 7 days after the project's payment completion time,
        or after 7 days from now if the payment timestamp cannot be determined.
        """
        with transaction.atomic():
            # Determine the payment timestamp for the project
            payment = (
                Payment.objects.filter(project=project, status="paid")
                .order_by("-updated_at")
                .first()
            )
            base_time = payment.updated_at if payment else timezone.now()
            hold_until = base_time + timedelta(days=7)

            PayoutHold.objects.create(
                user=seller,
                project=project,
                amount=amount,
                currency="EUR",
                hold_until=hold_until,
                released=False,
            )

    @staticmethod
    def release_matured_holds(user):
        """
        Release all matured holds for the user and update available_for_payout.
        """
        with transaction.atomic():
            # Get or create balance for the user
            balance, created = Balance.objects.get_or_create(user=user)

            now = timezone.now()
            holds = (
                PayoutHold.objects.select_for_update()
                .filter(user=user, released=False, hold_until__lte=now)
                .order_by("hold_until")
            )

            # Debug logging

            logger.info(f"Found {len(holds)} matured holds for user {user.email}")

            total_released = Decimal("0.00")
            for hold in holds:
                logger.info(f"Releasing hold {hold.id} for ${hold.amount}")
                total_released += hold.amount
                hold.released = True
                hold.released_at = now
                hold.save()

            if total_released > 0:
                logger.info(
                    f"Adding ${total_released} to available_for_payout for {user.email}"
                )
                balance.available_for_payout += total_released
                balance.save()
                logger.info(
                    f"New available_for_payout: ${balance.available_for_payout}"
                )

                # Send notification to user
                try:
                    NotificationService.create_notification(
                        user,
                        f"Great news! ${total_released} has been released from hold and is now available for payout.",
                    )
                except Exception as e:
                    logger.error(f"Failed to send notification to {user.email}: {e}")

            return total_released

    @staticmethod
    def reconcile_buyer_escrow(user):
        """
        Recalculate buyer's held_in_escrow based on paid payments minus approved milestone releases
        across all projects where the user is the client.
        Returns the computed totals so callers may update additional aggregates.
        """
        if hasattr(user, "role") and user.role == "seller":
            return {"held_in_escrow": Decimal("0.00"), "total_spent": Decimal("0.00")}

        with transaction.atomic():
            # Ensure balance exists
            balance, _ = Balance.objects.get_or_create(
                user=user,
                defaults={
                    "current_balance": Decimal("0.00"),
                    "total_earnings": Decimal("0.00"),
                    "total_spent": Decimal("0.00"),
                    "held_in_escrow": Decimal("0.00"),
                },
            )

            projects_for_buyer = Project.objects.filter(client=user)
            total_paid = Decimal("0.00")
            total_approved_release = Decimal("0.00")

            for project in projects_for_buyer:
                # Total paid by this buyer for the project
                project_paid = sum(
                    (
                        p.amount
                        for p in Payment.objects.filter(
                            user=user, project=project, status="paid"
                        )
                    ),
                    Decimal("0.00"),
                )

                # Approved milestones total for the project
                approved_total = sum(
                    (
                        m.relative_payment
                        for m in Milestone.objects.filter(
                            project=project, status="approved"
                        )
                    ),
                    Decimal("0.00"),
                )

                total_paid += project_paid
                total_approved_release += min(project_paid, approved_total)

            recalculated_escrow = max(
                Decimal("0.00"), total_paid - total_approved_release
            )

            # Update balance fields
            balance.total_spent = total_paid
            balance.held_in_escrow = recalculated_escrow
            balance.save()

            return {"held_in_escrow": recalculated_escrow, "total_spent": total_paid}

    @staticmethod
    def update_buyer_balance_on_payment(buyer, payment_amount):
        """
        Update buyer's balance when a payment is made.
        This adds the payment amount to total_spent and held_in_escrow.

        Args:
            buyer: User object (the buyer)
            payment_amount: Decimal amount to add to spending/escrow
        """
        with transaction.atomic():
            # Get or create balance for the buyer
            balance, created = Balance.objects.get_or_create(
                user=buyer,
                defaults={
                    "current_balance": Decimal("0.00"),
                    "total_earnings": Decimal("0.00"),
                    "total_spent": Decimal("0.00"),
                    "held_in_escrow": Decimal("0.00"),
                },
            )

            # Update the balance
            balance.total_spent += payment_amount
            balance.held_in_escrow += payment_amount
            balance.save()

            return balance

    @staticmethod
    def release_escrow_funds(buyer, amount):
        """
        Release funds from escrow when a project is completed.
        This reduces the held_in_escrow amount.

        Args:
            buyer: User object (the buyer)
            amount: Decimal amount to release from escrow
        """
        with transaction.atomic():
            try:
                balance = Balance.objects.get(user=buyer)
                balance.held_in_escrow = max(
                    Decimal("0.00"), balance.held_in_escrow - amount
                )
                balance.save()
                return balance
            except Balance.DoesNotExist:
                # If no balance exists, create one
                balance = Balance.objects.create(
                    user=buyer,
                    current_balance=Decimal("0.00"),
                    total_earnings=Decimal("0.00"),
                    total_spent=Decimal("0.00"),
                    held_in_escrow=Decimal("0.00"),
                )
                return balance

    @staticmethod
    def process_milestone_payment(seller, buyer, milestone_amount):
        """
        Process payment for a completed milestone.
        This transfers funds from buyer's escrow to seller's balance (net) and
        creates a payout hold for the seller (net).

        Args:
            seller: User object (the seller)
            buyer: User object (the buyer)
            milestone_amount: Decimal amount for the milestone
        """
        with transaction.atomic():
            # Release funds from buyer's escrow (gross amount tracked in escrow)
            BalanceService.release_escrow_funds(buyer, milestone_amount)

            # Estimate net amount using fee formula when project context is unknown
            net_amount = BalanceService._estimate_seller_net(milestone_amount)

            # Add funds to seller's balance using net amount
            BalanceService.update_seller_balance_on_milestone_approval(
                seller, net_amount
            )

        # Create payout hold outside the balance lock
        # Need project context; caller should pass seller's current project via keyword if needed
        # The caller (MilestoneApprovalAPIView) knows the project; we add a project-aware overload
        return True

    @staticmethod
    def process_milestone_payment_with_project(
        seller, buyer, project, milestone_amount
    ):
        """
        Process milestone payment using verified payment fees from Stripe.
        Only deducts fees that were already calculated and verified during payment.
        """
        with transaction.atomic():
            # Release escrow (gross amount that buyer paid)
            BalanceService.release_escrow_funds(buyer, milestone_amount)

            # Get the verified payment to ensure fees were properly calculated
            payment = Payment.objects.filter(project=project, status="paid").first()
            if not payment:
                logger.error(f"No verified payment found for project {project.id}")
                return False

            # Compute net amount using the verified payment's fee structure
            net_amount = BalanceService._project_net_for_amount(
                project, milestone_amount
            )

            logger.info(
                f"Processing milestone payment: project={project.id}, milestone_amount={milestone_amount}, net_amount={net_amount}"
            )

            # Update seller balance with net amount (fees already deducted in payment)
            BalanceService.update_seller_balance_on_milestone_approval(
                seller, net_amount
            )

        # Create payout hold using net amount
        BalanceService.create_payout_hold_for_milestone(
            seller=seller, project=project, amount=net_amount
        )
        return True

    @staticmethod
    def _estimate_seller_net(base_amount: Decimal) -> Decimal:
        """
        Estimate seller's net for a given base amount using fee formula.
        For seller net: base_amount - seller_fee - stripe_fee
        Stripe fee is calculated on (base_amount + buyer_fee) since that's what buyer pays
        """
        if base_amount <= Decimal("0.00"):
            return Decimal("0.00")
        return FeeCalculationService.estimate_seller_net(base_amount)

    @staticmethod
    def _project_net_for_amount(project, base_amount: Decimal) -> Decimal:
        """
        Compute seller's net for a given project and base amount using actual
        paid Payment ratios when available; otherwise fall back to fee estimate.
        """
        return FeeCalculationService.calculate_seller_net_for_amount(
            project, base_amount
        )

from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Balance, Payment, PayoutHold
from django.contrib.auth import get_user_model
from projects.models import Project, Milestone
from notifications.services import NotificationService
from .tasks import send_hold_released_email_task
import logging

User = get_user_model()

logger = logging.getLogger(__name__)


class FeeCalculationService:
    """
    Service class for calculating amounts: buyer pays base + VAT only;
    platform fee applies to the seller side (reduces seller net).
    """

    @staticmethod
    def get_commission_rate(gross_amount):
        """
        Determine the commission rate based on the gross amount (incl. VAT).
        """
        gross_amount = Decimal(str(gross_amount))
        if gross_amount <= Decimal("1000"):
            return Decimal("10")
        elif gross_amount <= Decimal("100000"):
            return Decimal("7")
        elif gross_amount <= Decimal("200000"):
            return Decimal("5")
        elif gross_amount <= Decimal("300000"):
            return Decimal("3")
        elif gross_amount <= Decimal("400000"):
            return Decimal("2.5")
        elif gross_amount <= Decimal("500000"):
            return Decimal("2")
        else:
            return Decimal("1.5")

    @staticmethod
    def calculate_stripe_fees(gross_amount, payment_method="card"):
        """
        Calculate Stripe fees based on payment method and gross amount.
        - Card: 1.5% + €0.25 (for €500 - €1,000)
        - Bank Transfer: 0.5% in + 0.5% out (for > €1,000)
        """
        gross_amount = Decimal(str(gross_amount))
        if gross_amount > Decimal("1000") or payment_method == "bank_transfer":
            # 0.5% incoming + 0.5% outgoing
            return (gross_amount * Decimal("0.005")) + (gross_amount * Decimal("0.005"))
        else:
            # 1.5% + €0.25
            return (gross_amount * Decimal("0.015")) + Decimal("0.25")

    @staticmethod
    def calculate_fees(base_amount, platform_fee_percentage=None, vat_rate=Decimal("20")):
        """
        Calculate core amounts for a given base amount.
        Platform commission is calculated on the GROSS amount (base + VAT).
        Stripe fees are deducted from the platform commission.

        Args:
            base_amount (Decimal): The base project amount (excl. VAT)
            platform_fee_percentage (Decimal, optional): If provided, overrides degressive logic
            vat_rate (Decimal): VAT rate percentage (e.g., 20)

        Returns:
            dict: Dictionary containing calculated amounts
        """
        # Ensure Decimal math
        base_amount = Decimal(str(base_amount))
        vat_rate = Decimal(str(vat_rate))
        
        # Calculate VAT and Gross Amount
        vat_amount = (base_amount * vat_rate) / Decimal("100")
        gross_amount = base_amount + vat_amount

        # Determine platform commission rate (use provided or degressive logic)
        if platform_fee_percentage is None:
            commission_rate = FeeCalculationService.get_commission_rate(gross_amount)
        else:
            commission_rate = Decimal(str(platform_fee_percentage))

        # Calculate Gross Platform Commission (on gross amount)
        platform_gross_commission = (gross_amount * commission_rate) / Decimal("100")

        # Calculate Stripe fees (deducted from platform commission)
        stripe_fees = FeeCalculationService.calculate_stripe_fees(gross_amount)
        
        # Safe Bill's net commission
        platform_net_commission = platform_gross_commission - stripe_fees

        # Buyer pays: gross amount (base + VAT)
        buyer_total = gross_amount

        # Seller receives: gross amount - platform gross commission
        # (Since platform absorbs Stripe fees from its own gross commission)
        seller_net = gross_amount - platform_gross_commission

        return {
            "base_amount": base_amount,
            "vat_amount": vat_amount,
            "gross_amount": gross_amount,
            "commission_rate": commission_rate,
            "platform_fee": platform_gross_commission,
            "stripe_fees": stripe_fees,
            "platform_net_commission": platform_net_commission,
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
            fees = FeeCalculationService.calculate_fees(
                base_amount, project.platform_fee_percentage, project.vat_rate
            )
            return fees["seller_net"]

    @staticmethod
    def estimate_seller_net(base_amount, project):
        """
        Estimate seller net amount for a given base amount using current fee configuration.

        Args:
            base_amount (Decimal): The base amount to calculate net for

        Returns:
            Decimal: Estimated seller net amount
        """
        fees = FeeCalculationService.calculate_fees(
            base_amount, project.platform_fee_percentage, project.vat_rate
        )
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
                        message="notifications.funds_released",
                        amount=str(total_released)
                    )
                except Exception as e:
                    logger.error(f"Failed to send notification to {user.email}: {e}")

                # Send email asynchronously
                try:
                    send_hold_released_email_task.delay(user.email, float(total_released))
                except Exception:
                    pass

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
            platform_fee_amount = (
                project.platform_fee_percentage * milestone_amount
            ) / Decimal("100")
            net_amount = milestone_amount - platform_fee_amount

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
        For seller net: base_amount minus platform fee (seller side only).
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

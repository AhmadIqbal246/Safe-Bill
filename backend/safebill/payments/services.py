from decimal import Decimal
from django.db import transaction
from .models import Balance, Payment
from django.contrib.auth import get_user_model

User = get_user_model()


class BalanceService:
    """
    Service class for managing user balances and payments
    """

    @staticmethod
    def update_seller_balance_on_milestone_approval(seller, milestone_amount):
        """
        Update seller's balance when a milestone is approved by the client.
        This adds the milestone amount to both current_balance and total_earnings.

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
                },
            )

            # Update the balance
            balance.current_balance += milestone_amount
            balance.total_earnings += milestone_amount
            balance.save()

            return balance

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
        This transfers funds from buyer's escrow to seller's balance.

        Args:
            seller: User object (the seller)
            buyer: User object (the buyer)
            milestone_amount: Decimal amount for the milestone
        """
        with transaction.atomic():
            # Release funds from buyer's escrow
            BalanceService.release_escrow_funds(buyer, milestone_amount)

            # Add funds to seller's balance (only when milestone is approved)
            BalanceService.update_seller_balance_on_milestone_approval(
                seller, milestone_amount
            )

            return True

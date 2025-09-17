from django.conf import settings
from decimal import Decimal
import logging
import stripe

from .models import Balance, Payout
from .services import BalanceService
from connect_stripe.models import StripeAccount
from notifications.services import NotificationService
from .tasks import (
    send_transfer_initiated_email_task,
    send_transfer_paid_email_task,
    send_transfer_reversed_email_task,
)

logger = logging.getLogger(__name__)


class TransferService:
    """
    Simple service to transfer funds from platform to seller's Stripe Connect accounts
    """

    @staticmethod
    def transfer_to_seller_account(user, amount=None, currency="EUR"):
        """
        Transfer seller's available balance to their Stripe Connect account
        """
        try:
            # Get user's balance
            try:
                # Release any matured holds first
                BalanceService.release_matured_holds(user)
                balance = Balance.objects.get(user=user)
                max_available = balance.available_for_payout
                if amount is None:
                    transfer_amount = max_available
                else:
                    transfer_amount = amount

                # Convert to Decimal for consistent financial calculations
                transfer_amount_decimal = Decimal(str(transfer_amount))

                if transfer_amount <= 0:
                    return {
                        "success": False,
                        "error": "No funds available for transfer",
                    }

                if transfer_amount > max_available:
                    return {
                        "success": False,
                        "error": "Insufficient available-for-payout funds",
                    }

            except Balance.DoesNotExist:
                return {"success": False, "error": "No balance found for user"}

            # Get user's Stripe Connect account
            try:
                stripe_account = StripeAccount.objects.get(user=user)
                if not stripe_account.account_id:
                    return {
                        "success": False,
                        "error": "No Stripe Connect account found",
                    }
            except StripeAccount.DoesNotExist:
                return {"success": False, "error": "Stripe Connect account not found"}

            # Set Stripe API key
            stripe.api_key = settings.STRIPE_API_KEY

            # Create transfer to connected account
            transfer = stripe.Transfer.create(
                amount=int(transfer_amount * 100),  # Amount in cents
                currency=currency.lower(),
                destination=stripe_account.account_id,
                description=f"Platform earnings transfer for {user.email}",
                metadata={
                    "user_id": str(user.id),
                    "user_email": user.email,
                    "transfer_type": "earnings",
                    "platform": "Safe-Bill",
                },
            )

            # Create Payout record to track the transfer
            payout = Payout.objects.create(
                user=user,
                amount=transfer_amount_decimal,
                currency=currency,
                status="in_transit",  # Stripe transfer is created but not yet completed
                stripe_transfer_id=transfer.id,
                stripe_account_id=stripe_account.account_id,
            )

            # Immediately deduct balance when transfer is created
            balance.current_balance -= transfer_amount_decimal
            balance.available_for_payout -= transfer_amount_decimal
            balance.save()

            logger.info(
                (
                    f"Transfer created for user {user.id}: {transfer_amount_decimal} {currency} - "
                    f"Balance deducted immediately: current={balance.current_balance}, "
                    f"available={balance.available_for_payout}"
                )
            )

            # Send notification
            NotificationService.create_notification(
                user,
                f"Transfer of {transfer_amount_decimal} {currency} has been sent to your Stripe account.",
            )

            # Send email asynchronously
            send_transfer_initiated_email_task.delay(
                user.email, float(transfer_amount_decimal), currency
            )

            logger.info(
                f"Transfer created for user {user.id}: {transfer.id} - {transfer_amount_decimal} {currency}"
            )

            return {
                "success": True,
                "transfer_id": transfer.id,
                "payout_id": payout.id,
                "amount": float(transfer_amount_decimal),
                "currency": currency,
                "destination": stripe_account.account_id,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating transfer for user {user.id}: {e}")
            return {"success": False, "error": f"Transfer failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Error creating transfer for user {user.id}: {e}")
            return {"success": False, "error": "System error - please try again"}

    @staticmethod
    def handle_transfer_reversal(transfer_id, reason="Transfer failed"):
        """
        Handle transfer reversal - add balance back and notify user
        """
        try:
            payout = Payout.objects.get(stripe_transfer_id=transfer_id)

            # Add balance back
            balance = Balance.objects.get(user=payout.user)
            balance.current_balance += payout.amount
            balance.available_for_payout += payout.amount
            balance.save()

            # Update payout status
            payout.status = "failed"
            payout.save()

            # Send notification to user
            NotificationService.create_notification(
                payout.user,
                f"Transfer of {payout.amount} {payout.currency} was reversed. Reason: {reason}. "
                f"Funds have been returned to your balance.",
                notification_type="transfer_reversal",
            )

            # Send email asynchronously
            send_transfer_reversed_email_task.delay(
                payout.user.email, float(payout.amount), payout.currency
            )

            logger.info(
                f"Transfer {transfer_id} reversed for user {payout.user.id}: "
                f"Added back {payout.amount} {payout.currency} to balance"
            )

            return True

        except Payout.DoesNotExist:
            logger.warning(f"Payout not found for transfer {transfer_id}")
            return False
        except Balance.DoesNotExist:
            logger.error(
                f"Balance not found for user {payout.user.id} - could not reverse transfer"
            )
            return False
        except Exception as e:
            logger.error(f"Error handling transfer reversal {transfer_id}: {e}")
            return False

    @staticmethod
    def get_transfer_info(user):
        """
        Get transfer information for the user
        """
        try:
            balance = Balance.objects.get(user=user)
            stripe_account = StripeAccount.objects.get(user=user)

            return {
                "available_balance": float(balance.current_balance),
                "currency": balance.currency,
                "has_stripe_account": bool(stripe_account.account_id),
                "stripe_account_id": stripe_account.account_id,
                "can_transfer": balance.current_balance > 0
                and bool(stripe_account.account_id),
            }
        except (Balance.DoesNotExist, StripeAccount.DoesNotExist):
            return {
                "available_balance": 0.0,
                "currency": "EUR",
                "has_stripe_account": False,
                "stripe_account_id": None,
                "can_transfer": False,
            }

    @staticmethod
    def generate_stripe_dashboard_login_link(user):
        """
        Generate a login link for the seller's Stripe Dashboard
        """
        try:
            stripe.api_key = settings.STRIPE_API_KEY

            # Get the seller's Stripe Connect account
            stripe_account = StripeAccount.objects.get(user=user)

            # Generate login link
            login_link = stripe.Account.create_login_link(stripe_account.account_id)

            logger.info(
                f"Generated Stripe login link for user {user.id}, account {stripe_account.account_id}"
            )

            return {
                "success": True,
                "login_url": login_link.url,
                "expires_at": login_link.created + 300,  # Links expire in 5 minutes
                "account_id": stripe_account.account_id,
            }

        except StripeAccount.DoesNotExist:
            logger.warning(f"No Stripe account found for user {user.id}")
            return {
                "success": False,
                "error": "No Stripe account connected",
                "login_url": None,
            }

        except stripe.error.StripeError as e:
            logger.error(
                f"Stripe error generating login link for user {user.id}: {str(e)}"
            )
            return {
                "success": False,
                "error": f"Stripe error: {str(e)}",
                "login_url": None,
            }

        except Exception as e:
            logger.error(
                f"Unexpected error generating login link for user {user.id}: {str(e)}"
            )
            return {
                "success": False,
                "error": "Failed to generate login link",
                "login_url": None,
            }

    @staticmethod
    def handle_transfer_created(event):
        """
        Handle transfer.created webhook event - update status to paid
        """
        try:
            transfer_data = event["data"]["object"]
            transfer_id = str(transfer_data["id"])
            payout = Payout.objects.get(stripe_transfer_id=str(transfer_id))

            # Skip if already paid
            if payout.status == "paid":
                logger.info(
                    f"Payout {payout.id} for transfer {transfer_id} is already paid - skipping"
                )
                return

            # Update payout status to paid (balance was already deducted when transfer was created)
            payout.status = "paid"
            payout.save()
            logger.info(
                f"Updated payout {payout.id} status to 'paid' for transfer {transfer_id}"
            )

            # Send email asynchronously
            try:
                user_email = payout.user.email
                amount = float(payout.amount)
                currency = payout.currency
                send_transfer_paid_email_task.delay(user_email, amount, currency)
            except Exception as e:
                logger.error(f"Failed to enqueue transfer paid email: {e}")

        except Payout.DoesNotExist:
            logger.warning(f"Payout not found for transfer {transfer_id}")
        except Exception as e:
            logger.error(f"Error handling transfer.created event: {e}")

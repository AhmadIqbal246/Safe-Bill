from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import logging
import stripe

from .models import Balance, Payout
from .services import BalanceService
from connect_stripe.models import StripeAccount
from notifications.services import NotificationService

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

            # Note: Balance will be deducted when webhook confirms transfer success
            logger.info(
                f"Transfer created for user {user.id}: {transfer_amount_decimal} {currency} - "
                f"Balance will be deducted when webhook confirms success"
            )

            # Send notification
            NotificationService.create_notification(
                user,
                f"Transfer of {transfer_amount_decimal} {currency} has been sent to your Stripe account.",
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
        Handle transfer.created webhook event - deduct balance when transfer is created
        """
        try:
            transfer_data = event["data"]["object"]
            transfer_id = transfer_data["id"]

            # Update payout status to in_transit and deduct balance
            try:
                payout = Payout.objects.get(stripe_transfer_id=transfer_id)

                # Check if payout is already paid to avoid duplicate processing
                if payout.status == "paid":
                    logger.info(
                        f"Payout {payout.id} for transfer {transfer_id} is already paid - skipping processing"
                    )
                    return

                payout.status = "in_transit"
                payout.save()

                logger.info(
                    f"Updated payout {payout.id} status to 'in_transit' for transfer {transfer_id}"
                )

                # Deduct balance now that transfer is created by Stripe
                try:
                    balance = Balance.objects.get(user=payout.user)
                    logger.info(
                        f"BEFORE deduction - User {payout.user.id} balance: current={balance.current_balance}, available={balance.available_for_payout}"
                    )
                    logger.info(
                        f"Deducting {payout.amount} {payout.currency} from user {payout.user.id} balance when transfer created"
                    )
                    balance.current_balance -= payout.amount
                    balance.available_for_payout -= payout.amount
                    balance.save()

                    logger.info(
                        f"AFTER deduction - User {payout.user.id} balance: current={balance.current_balance}, available={balance.available_for_payout}"
                    )
                    logger.info(
                        f"Transfer created successfully for user {payout.user.id}: "
                        f"{payout.amount} {payout.currency} - Balance deducted"
                    )

                except Balance.DoesNotExist:
                    logger.error(
                        f"Balance not found for user {payout.user.id} - could not deduct funds"
                    )

                logger.info(
                    f"Transfer created webhook processed for transfer {transfer_id}"
                )

            except Payout.DoesNotExist:
                logger.warning(f"Payout not found for transfer {transfer_id}")

        except Exception as e:
            logger.error(f"Error handling transfer.created event: {e}")

    @staticmethod
    def handle_transfer_updated(event):
        """
        Handle transfer.updated webhook event - handles all status changes
        """
        try:
            transfer_data = event["data"]["object"]
            transfer_id = transfer_data["id"]
            status = transfer_data.get("status", "")

            logger.info(
                f"Processing transfer.updated webhook for transfer {transfer_id} with status: {status}"
            )

            try:
                payout = Payout.objects.get(stripe_transfer_id=transfer_id)
                old_status = payout.status
                logger.info(
                    f"Found payout {payout.id} for user {payout.user.id}, amount: {payout.amount}, old_status: {old_status}"
                )

                # Check if payout is already paid to avoid duplicate processing
                if payout.status == "paid":
                    logger.info(
                        f"Payout {payout.id} for transfer {transfer_id} is already paid - skipping processing"
                    )
                    return

                # Map Stripe transfer status to our status
                status_mapping = {
                    "pending": "pending",
                    "in_transit": "in_transit",
                    "paid": "paid",
                    "failed": "failed",
                    "canceled": "canceled",
                }

                new_status = status_mapping.get(status, status)
                payout.status = new_status
                payout.save()  # Save the status update

                logger.info(
                    f"Updated payout {payout.id} status from '{old_status}' to '{new_status}' for transfer {transfer_id}"
                )

                # Handle status-specific logic
                if status == "paid":
                    logger.info(
                        f"Transfer status is 'paid' - transfer completed successfully for user {payout.user.id}"
                    )
                    payout.completed_at = timezone.now()
                    payout.save()  # Save the completion time

                    # Balance was already deducted when transfer was created
                    logger.info(
                        f"Transfer completed successfully for user {payout.user.id}: "
                        f"{payout.amount} {payout.currency} - Balance was already deducted when transfer created"
                    )

                    # Send success notification
                    NotificationService.create_notification(
                        payout.user,
                        f"Transfer of {payout.amount} {payout.currency} has been completed successfully. "
                        f"Funds are now available in your Stripe account.",
                    )

                elif status == "failed":
                    failure_code = transfer_data.get("failure_code", "")
                    failure_message = transfer_data.get(
                        "failure_message", "Transfer failed"
                    )
                    payout.failure_reason = f"{failure_code}: {failure_message}"

                    # Restore balance since transfer failed (balance was deducted when transfer was created)
                    try:
                        balance = Balance.objects.get(user=payout.user)
                        logger.info(
                            f"Restoring balance for failed transfer - User {payout.user.id}: "
                            f"current={balance.current_balance} -> {balance.current_balance + payout.amount}, "
                            f"available={balance.available_for_payout} -> {balance.available_for_payout + payout.amount}"
                        )
                        balance.current_balance += payout.amount
                        balance.available_for_payout += payout.amount
                        balance.save()
                        logger.info(
                            f"Balance restored for user {payout.user.id} after transfer failure"
                        )
                    except Balance.DoesNotExist:
                        logger.error(
                            f"Balance not found for user {payout.user.id} - could not restore funds"
                        )

                    # Send failure notification
                    NotificationService.create_notification(
                        payout.user,
                        f"Transfer of {payout.amount} {payout.currency} failed: {failure_message}. "
                        f"The amount has been restored to your balance. Please contact support if this continues.",
                    )

                payout.save()

                logger.info(
                    f"Transfer updated webhook processed for transfer {transfer_id}: {old_status} -> {new_status}"
                )

            except Payout.DoesNotExist:
                logger.warning(f"Payout not found for transfer {transfer_id}")

        except Exception as e:
            logger.error(f"Error handling transfer.updated event: {e}")

    @staticmethod
    def handle_transfer_reversed(event):
        """
        Handle transfer.reversed webhook event
        """
        try:
            transfer_data = event["data"]["object"]
            transfer_id = transfer_data["id"]

            try:
                payout = Payout.objects.get(stripe_transfer_id=transfer_id)
                payout.status = "canceled"
                payout.failure_reason = "Transfer was reversed"
                payout.save()

                # Restore user balance since transfer was reversed
                try:
                    balance = Balance.objects.get(user=payout.user)
                    balance.current_balance += payout.amount
                    balance.available_for_payout += payout.amount
                    balance.save()

                    logger.info(
                        f"Restored balance of {payout.amount} {payout.currency} for user {payout.user.id} due to reversal"
                    )

                except Balance.DoesNotExist:
                    logger.error(
                        f"Balance not found for user {payout.user.id} - could not restore funds"
                    )

                # Send reversal notification
                NotificationService.create_notification(
                    payout.user,
                    f"Transfer of {payout.amount} {payout.currency} was reversed. "
                    f"The amount has been restored to your balance.",
                )

                logger.info(
                    f"Transfer reversed webhook processed for transfer {transfer_id}"
                )

            except Payout.DoesNotExist:
                logger.warning(f"Payout not found for transfer {transfer_id}")

        except Exception as e:
            logger.error(f"Error handling transfer.reversed event: {e}")

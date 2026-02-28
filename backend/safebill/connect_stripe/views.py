from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from hubspot.tasks import sync_deal_task
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
import stripe
from django.contrib.auth import get_user_model
import logging
import json
from django.db import transaction
from django.utils import timezone
from .models import StripeAccount, StripeIdentity
from projects.models import Project
from payments.models import Payment, Refund, Balance
from payments.utils import send_payment_websocket_update
from notifications.services import NotificationService
from .tasks import (
    send_payment_success_email_task,
    send_payment_failed_email_task,
)
from payments.tasks import send_payment_success_email_seller_task
from payments.services import BalanceService
from payments.transfer_service import TransferService
from adminpanelApp.services import RevenueService
from adminpanelApp.models import PlatformRevenue
from hubspot.tasks import sync_contact_task, sync_revenue_task

User = get_user_model()
logger = logging.getLogger(__name__)

# Create your views here.


# ====================================================================== Connect Stripe ======================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def connect_stripe(request):
    stripe.api_key = settings.STRIPE_API_KEY
    user = request.user

    # Added: restrict Connect onboarding to users with seller role enabled
    if not (getattr(user, "role", None) == "seller"):
        return Response({"detail": "Seller role not enabled for this account."}, status=409)

    # Get or create StripeAccount for the user
    stripe_account, created = StripeAccount.objects.get_or_create(
        user=user, defaults={"account_status": "onboarding"}
    )

    if stripe_account.account_id is None:
        account = stripe.Account.create(
            type="express",
            country="FR",
            tos_acceptance={
                "service_agreement": "full",
            },
            capabilities={
                "transfers": {"requested": True},
            },
            metadata={
                "user_id": str(user.id),
            },
        )
        stripe_account.account_id = account.id
        stripe_account.save()
    else:
        account = stripe.Account.retrieve(stripe_account.account_id)

    account_link = stripe.AccountLink.create(
        account=stripe_account.account_id,
        refresh_url=f"{settings.FRONTEND_URL}onboarding/",
        return_url=f"{settings.FRONTEND_URL}onboarding/",
        type="account_onboarding",
        collection_options={
            "fields": "eventually_due",
        },
    )

    return Response(
        {"detail": "Stripe connected successfully.", "account_link": account_link.url},
        status=200,
    )


# ====================================================================== Stripe Connect Webhook ======================================================================
@api_view(["POST"])
@permission_classes([AllowAny])
def stripe_connect_webhook(request):
    """
    Simple Stripe webhook to handle account connection updates
    """
    logger = logging.getLogger(__name__)

    # Get the raw request body
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_CONNECT_WEBHOOK_SECRET

    # Verify webhook signature (optional for development, required for production)
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return Response({"error": "Invalid payload"}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return Response({"error": "Invalid signature"}, status=400)

    # Handle account.updated event
    if event["type"] == "account.updated":
        logger.info(f"Account updated event: {event}")
        account = event["data"]["object"]
        account_id = account["id"]
        user_id = account["metadata"]["user_id"]
        user = User.objects.get(id=user_id)

        try:
            # Find StripeAccount by account ID
            stripe_account = StripeAccount.objects.get(account_id=account_id)

            # Update StripeAccount status with comprehensive checks
            details_submitted = account.get("details_submitted", False)
            charges_enabled = account.get("charges_enabled", False)
            payouts_enabled = account.get("payouts_enabled", False)

            # Check if business verification is complete
            requirements = account.get("requirements", {})
            currently_due = requirements.get("currently_due", [])
            past_due = requirements.get("past_due", [])

            # Onboarding is complete only if all conditions are met
            is_onboarding_complete = (
                details_submitted
                and charges_enabled
                and payouts_enabled
                and len(currently_due) == 0
                and len(past_due) == 0
            )

            if is_onboarding_complete:
                stripe_account.account_status = "active"
                user.onboarding_complete = True
                user.seller_onboarding_complete = True
                user.save()
                stripe_account.onboarding_complete = True

                # Sync with HubSpot after Stripe onboarding completion
                from hubspot.sync_utils import safe_contact_sync
                safe_contact_sync(user.id, "stripe_onboarding_complete")

                # Send notification for successful Stripe onboarding
                NotificationService.create_notification(
                    user,
                    message="notifications.stripe_onboarding_complete"
                )

                logger.info(
                    f"Stripe account {account_id} is now fully active for user {stripe_account.user.id}"
                )
            else:
                # Only change to "pending" if user has started onboarding (details_submitted is True)
                # Otherwise keep the current status (likely "onboarding")
                if details_submitted:
                    stripe_account.account_status = "pending"
                # If details_submitted is False, keep the current status (probably "onboarding")
                logger.info(
                    f"Stripe account {account_id} status updated for user {stripe_account.user.id} - details_submitted: {details_submitted}, charges_enabled: {charges_enabled}, payouts_enabled: {payouts_enabled}, currently_due: {currently_due}, past_due: {past_due}, status: {stripe_account.account_status}"
                )

            # Store account information and last webhook event payload
            stripe_account.account_data = {
                "country": account.get("country"),
                "default_currency": account.get("default_currency"),
                "business_type": account.get("business_type"),
                "charges_enabled": charges_enabled,
                "payouts_enabled": payouts_enabled,
                "details_submitted": details_submitted,
                "requirements": requirements,
                "currently_due": currently_due,
                "eventually_due": requirements.get("eventually_due", []),
                "past_due": past_due,
                "last_webhook_event": event,
            }

            stripe_account.save()
            logger.info(f"Updated StripeAccount {stripe_account.id} with account data")

            # Update or create payout preferences if payouts are enabled
            if payouts_enabled:
                # Check if this is a settings change by comparing with previous data
                previous_data = (
                    stripe_account.account_data.get("settings", {})
                    if stripe_account.account_data
                    else {}
                )
                current_settings = account.get("settings", {})

                # Removed payout preferences update - sellers manage directly in Stripe Dashboard

        except StripeAccount.DoesNotExist:
            logger.error(f"StripeAccount not found for account {account_id}")
        except Exception as e:
            logger.error(f"Error updating StripeAccount for account {account_id}: {e}")

    # Handle account deauthorization
    elif event["type"] == "account.application.deauthorized":
        account = event["data"]["object"]
        account_id = account["id"]

        try:
            stripe_account = StripeAccount.objects.get(account_id=account_id)
            stripe_account.account_status = "disconnected"
            stripe_account.onboarding_complete = False
            stripe_account.account_data = {}
            stripe_account.save()

            # Send notification for Stripe account disconnection
            NotificationService.create_notification(
                stripe_account.user,
                message="notifications.stripe_account_disconnected"
            )

            logger.info(
                f"Stripe account {account_id} disconnected for user {stripe_account.user.id}"
            )

        except StripeAccount.DoesNotExist:
            logger.error(f"StripeAccount not found for account {account_id}")
        except Exception as e:
            logger.error(f"Error disconnecting Stripe account {account_id}: {e}")

    return Response({"status": "success"}, status=200)


# ====================================================================== Check Stripe Status ======================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_stripe_status(request):
    """
    Check the current Stripe onboarding status for the authenticated user
    """
    user = request.user

    try:
        stripe_account = StripeAccount.objects.get(user=user)
    except StripeAccount.DoesNotExist:
        return Response(
            {
                "stripe_connected": False,
                "onboarding_complete": False,
                "account_status": "not_created",
                "message": "No Stripe account connected",
            },
            status=200,
        )

    # Get the latest account information from Stripe
    if stripe_account.account_id:
        try:
            stripe.api_key = settings.STRIPE_API_KEY
            account = stripe.Account.retrieve(stripe_account.account_id)

            # Update StripeAccount status based on current account state
            # Check if all requirements are met for complete onboarding
            details_submitted = account.get("details_submitted", False)
            charges_enabled = account.get("charges_enabled", False)
            payouts_enabled = account.get("payouts_enabled", False)

            # Check if business verification is complete
            requirements = account.get("requirements", {})
            currently_due = requirements.get("currently_due", [])
            eventually_due = requirements.get("eventually_due", [])
            past_due = requirements.get("past_due", [])

            # Onboarding is complete only if all conditions are met
            is_onboarding_complete = (
                details_submitted
                and charges_enabled
                and payouts_enabled
                and len(currently_due) == 0
                and len(past_due) == 0
            )

            if is_onboarding_complete:
                stripe_account.account_status = "active"
                stripe_account.onboarding_complete = True
                user.onboarding_complete = True
                user.seller_onboarding_complete = True
                user.save()

                # Sync with HubSpot after Stripe onboarding completion
                from hubspot.sync_utils import safe_contact_sync
                safe_contact_sync(user.id, "stripe_onboarding_complete_flow2")
            else:
                # Only change to "pending" if user has started onboarding (details_submitted is True)
                # Otherwise keep the current status (likely "onboarding")
                if details_submitted:
                    stripe_account.account_status = "pending"
                # If details_submitted is False, keep the current status (probably "onboarding")
                stripe_account.onboarding_complete = False

            # Update account data
            stripe_account.account_data = {
                "country": account.get("country"),
                "default_currency": account.get("default_currency"),
                "business_type": account.get("business_type"),
                "charges_enabled": charges_enabled,
                "payouts_enabled": payouts_enabled,
                "details_submitted": details_submitted,
                "requirements": requirements,
                "currently_due": currently_due,
                "eventually_due": eventually_due,
                "past_due": past_due,
            }

            stripe_account.save()

            return Response(
                {
                    "stripe_connected": True,
                    "onboarding_complete": stripe_account.onboarding_complete,
                    "seller_onboarding_complete": getattr(user, "seller_onboarding_complete", False),
                    "account_status": stripe_account.account_status,
                    "charges_enabled": charges_enabled,
                    "payouts_enabled": payouts_enabled,
                    "details_submitted": details_submitted,
                    "requirements": requirements,
                    "currently_due": currently_due,
                    "eventually_due": eventually_due,
                    "past_due": past_due,
                    "account_data": stripe_account.account_data,
                },
                status=200,
            )

        except stripe.error.StripeError as e:
            logging.error(f"Stripe API error for user {user.id}: {e}")
            return Response(
                {
                    "stripe_connected": True,
                    "onboarding_complete": stripe_account.onboarding_complete,
                    "seller_onboarding_complete": getattr(user, "seller_onboarding_complete", False),
                    "account_status": stripe_account.account_status,
                    "error": "Failed to fetch latest account status from Stripe",
                    "account_data": stripe_account.account_data,
                },
                status=200,
            )
    else:
        return Response(
            {
                "stripe_connected": False,
                "onboarding_complete": False,
                "seller_onboarding_complete": getattr(user, "seller_onboarding_complete", False),
                "account_status": stripe_account.account_status,
                "message": "No Stripe account ID found",
            },
            status=200,
        )


# ====================================================================== Create Stripe Identity Session ======================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_stripe_identity_session(request):
    """
    Create a Stripe Identity verification session for professional buyers
    """
    stripe.api_key = settings.STRIPE_API_KEY
    user = request.user

    # Added: restrict Identity verification to users with professional-buyer role enabled
    if not (getattr(user, "role", None) == "professional-buyer"):
        return Response({"detail": "Professional-buyer role not enabled for this account."}, status=409)

    try:
        # Get or create StripeIdentity for the user
        stripe_identity, created = StripeIdentity.objects.get_or_create(
            user=user, defaults={"identity_status": "not_started"}
        )

        # Create a Stripe Identity verification session
        verification_session = stripe.identity.VerificationSession.create(
            type="document",
            options={
                "document": {
                    "require_live_capture": True,
                    "require_matching_selfie": True,
                }
            },
            provided_details={"email": user.email},
            metadata={
                "user_id": str(user.id),
            },
        )

        # Store the verification session ID with the StripeIdentity
        stripe_identity.verification_session_id = verification_session.id
        stripe_identity.identity_status = "pending"
        stripe_identity.save()

        return Response(
            {
                "detail": "Stripe Identity verification session created successfully.",
                "verification_session_id": verification_session.id,
                "client_secret": verification_session.client_secret,
                "session_url": verification_session.url,
            },
            status=200,
        )

    except stripe.error.StripeError as e:
        logging.error(f"Stripe Identity error for user {user.id}: {e}")
        return Response(
            {"error": f"Failed to create verification session: {str(e)}"},
            status=400,
        )
    except Exception as e:
        logging.error(
            f"Unexpected error creating Stripe Identity session for user {user.id}: {e}"
        )
        return Response(
            {"error": "An unexpected error occurred"},
            status=500,
        )


# ====================================================================== Check Stripe Identity Status ======================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_stripe_identity_status(request):
    """
    Check the current Stripe Identity verification status for the authenticated user
    """
    user = request.user

    try:
        stripe_identity = StripeIdentity.objects.get(user=user)
        return Response(
            {
                "identity_verified": stripe_identity.identity_verified,
                "identity_status": stripe_identity.identity_status,
                "pro_buyer_onboarding_complete": getattr(user, "pro_buyer_onboarding_complete", False),
                "verification_data": stripe_identity.verification_data,
            },
            status=200,
        )
    except StripeIdentity.DoesNotExist:
        return Response(
            {
                "identity_verified": False,
                "identity_status": "not_started",
                "pro_buyer_onboarding_complete": getattr(user, "pro_buyer_onboarding_complete", False),
                "verification_data": {},
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error checking identity status for user {user.id}: {e}")
        return Response(
            {"error": "Failed to check identity verification status"},
            status=500,
        )


# ====================================================================== Stripe Identity Webhook ======================================================================
@api_view(["POST"])
@permission_classes([AllowAny])
def stripe_identity_webhook(request):
    """
    Handle Stripe Identity verification webhook events
    """
    logger = logging.getLogger(__name__)

    # Get the raw request body
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return Response({"error": "Invalid payload"}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return Response({"error": "Invalid signature"}, status=400)

    logger.info(f"Received Stripe Identity webhook: {event['type']}")

    # Handle identity.verification_session.processing event
    if event["type"] == "identity.verification_session.processing":
        verification_session = event["data"]["object"]
        session_id = verification_session["id"]

        try:
            stripe_identity = StripeIdentity.objects.get(
                verification_session_id=session_id
            )
            stripe_identity.identity_status = "processing"
            # Save the exact webhook response
            stripe_identity.verification_data = event
            stripe_identity.save()
            logger.info(
                f"Updated identity status to processing for user {stripe_identity.user.id}"
            )
        except StripeIdentity.DoesNotExist:
            logger.error(f"StripeIdentity not found for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating identity status: {e}")

    # Handle identity.verification_session.verified event
    elif event["type"] == "identity.verification_session.verified":
        verification_session = event["data"]["object"]
        session_id = verification_session["id"]
        user_id = verification_session["metadata"]["user_id"]
        user = User.objects.get(id=user_id)
        logger.info(f"User {user.id} verified identity")

        try:
            stripe_identity = StripeIdentity.objects.get(
                verification_session_id=session_id
            )
            stripe_identity.identity_status = "verified"
            stripe_identity.identity_verified = True
            stripe_identity.verification_data = event

            user.onboarding_complete = True
            user.pro_buyer_onboarding_complete = True
            user.save()
            stripe_identity.verified_at = timezone.now()
            stripe_identity.save()

            # Sync with HubSpot after identity verification completion
            from hubspot.sync_utils import safe_contact_sync
            safe_contact_sync(user.id, "identity_verification_complete")

            # Send notification for successful identity verification
            NotificationService.create_notification(
                user,
                message="notifications.identity_verification_success"
            )

            logger.info(
                f"Identity verification completed for user {stripe_identity.user.id}"
            )
        except StripeIdentity.DoesNotExist:
            logger.error(f"StripeIdentity not found for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating identity status: {e}")

    # Handle identity.verification_session.requires_input event
    elif event["type"] == "identity.verification_session.requires_input":
        verification_session = event["data"]["object"]
        session_id = verification_session["id"]

        try:
            stripe_identity = StripeIdentity.objects.get(
                verification_session_id=session_id
            )
            stripe_identity.identity_status = "requires_input"
            stripe_identity.identity_verified = False
            # Save the exact webhook response
            stripe_identity.verification_data = event
            stripe_identity.save()
            logger.info(
                f"Identity verification requires input for user {stripe_identity.user.id}"
            )
        except StripeIdentity.DoesNotExist:
            logger.error(f"StripeIdentity not found for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating identity status: {e}")

    # Handle identity.verification_session.failed event
    elif event["type"] == "identity.verification_session.failed":
        verification_session = event["data"]["object"]
        session_id = verification_session["id"]

        try:
            stripe_identity = StripeIdentity.objects.get(
                verification_session_id=session_id
            )
            stripe_identity.identity_status = "failed"
            stripe_identity.identity_verified = False
            # Save the exact webhook response
            stripe_identity.verification_data = event
            stripe_identity.save()

            # Send notification for failed identity verification
            NotificationService.create_notification(
                stripe_identity.user,
                message="notifications.identity_verification_failed"
            )

            logger.info(
                f"Identity verification failed for user {stripe_identity.user.id}"
            )
        except StripeIdentity.DoesNotExist:
            logger.error(f"StripeIdentity not found for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating identity status: {e}")

    # Handle identity.verification_session.canceled event
    elif event["type"] == "identity.verification_session.canceled":
        verification_session = event["data"]["object"]
        session_id = verification_session["id"]

        try:
            stripe_identity = StripeIdentity.objects.get(
                verification_session_id=session_id
            )
            stripe_identity.identity_status = "canceled"
            stripe_identity.identity_verified = False
            # Save the exact webhook response
            stripe_identity.verification_data = event
            stripe_identity.save()
            logger.info(
                f"Identity verification canceled for user {stripe_identity.user.id}"
            )
        except StripeIdentity.DoesNotExist:
            logger.error(f"StripeIdentity not found for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating identity status: {e}")

    # Handle checkout.session.completed event
    elif event["type"] == "checkout.session.completed":
        payment = event["data"]["object"]
        payment_id = payment["id"]
        project_id = payment["metadata"]["project_id"]
        project = Project.objects.get(id=project_id)
        project.status = "approved"
        project.save()
        # HubSpot sync now handled automatically by Django signals
        payment = Payment.objects.get(stripe_payment_id=payment_id)
        if payment.status != "paid":
            platform_revenue = PlatformRevenue.objects.all().first()
            platform_revenue.vat_collected += (
                payment.buyer_total_amount - payment.amount
            )
            platform_revenue.save()
        payment.status = "paid"
        payment.webhook_response = event
        payment.save()

        # Update HubSpot Payments record via task (keeps Payments object in sync)
        try:
            from hubspot.tasks import sync_payment_to_hubspot
            sync_payment_to_hubspot.delay(payment_id=payment.id)
        except Exception:
            pass

        # Enqueue HubSpot Revenue monthly sync for payment metrics only
        from hubspot.sync_utils import sync_revenue_to_hubspot
        from django.db import transaction
        now = timezone.now()
        
        # Ensure revenue sync only happens after database commit
        # Only sync payment-related metrics (VAT collected + total payments)
        transaction.on_commit(
            lambda: sync_revenue_to_hubspot(now.year, now.month, "payment_webhook_success", sync_type="payment")
        )

        try:
            # The payment is held in escrow until milestones are approved
            if project.client:
                BalanceService.update_buyer_balance_on_payment(
                    buyer=project.client, payment_amount=payment.buyer_total_amount
                )
        except Exception as e:
            logger.error(f"Error updating buyer balance: {e}")
            # Don't break the webhook flow if balance update fails

        # Buyer revenue tracking removed: buyers are only charged VAT

        # Email: notify client of successful payment
        try:
            if project.client:
                client = project.client
                client_name = (
                    client.get_full_name()
                    or getattr(client, "username", None)
                    or (
                        client.email.split("@")[0]
                        if getattr(client, "email", None)
                        else "User"
                    )
                )
                send_payment_success_email_task.delay(
                    user_email=client.email,
                    user_name=client_name,
                    project_name=project.name,
                    amount=str(payment.amount),
                    language="fr",
                )
                # Also notify the seller in French
                try:
                    seller = project.user
                    if seller and getattr(seller, "email", None):
                        seller_name = (
                            seller.get_full_name()
                            or getattr(seller, "username", None)
                            or seller.email
                        )
                        send_payment_success_email_seller_task.delay(
                            seller.email,
                            seller_name,
                            project.name,
                            float(payment.buyer_total_amount or payment.amount),
                            "fr",
                        )
                except Exception:
                    pass
        except Exception:
            # Avoid breaking webhook flow if email fails
            pass

        # Send notifications for successful payment
        NotificationService.create_notification(
            project.user,
            message="notifications.project_approved_seller",
            project_name=project.name
        )
        NotificationService.create_notification(
            project.client,
            message="notifications.payment_processed_buyer",
            amount=str(payment.amount),
            project_name=project.name
        )

        # Send WebSocket update
        send_payment_websocket_update(
            project_id=project.id,
            payment_status="paid",
            payment_amount=payment.amount,
            project_status="approved",
            updated_at=payment.updated_at,
        )

    # Handle async success for bank transfers (customer_balance)
    elif event["type"] == "checkout.session.async_payment_succeeded":
        payment = event["data"]["object"]
        payment_id = payment["id"]
        project_id = payment["metadata"]["project_id"]
        project = Project.objects.get(id=project_id)
        project.status = "approved"
        project.save()
        # HubSpot sync now handled automatically by Django signals

        payment_obj = Payment.objects.get(stripe_payment_id=payment_id)
        if payment_obj.status != "paid":
            platform_revenue = PlatformRevenue.objects.all().first()
            platform_revenue.vat_collected += (
                payment_obj.buyer_total_amount - payment_obj.amount
            )
            platform_revenue.save()
        payment_obj.status = "paid"
        payment_obj.webhook_response = event
        payment_obj.save()

        try:
            if project.client:
                client = project.client
                client_name = (
                    client.get_full_name()
                    or getattr(client, "username", None)
                    or (
                        client.email.split("@")[0]
                        if getattr(client, "email", None)
                        else "User"
                    )
                )
                send_payment_success_email_task.delay(
                    user_email=client.email,
                    user_name=client_name,
                    project_name=project.name,
                    amount=str(payment_obj.amount),
                    language="fr",
                )
                # Notify seller in French
                try:
                    seller = project.user
                    if seller and getattr(seller, "email", None):
                        seller_name = (
                            seller.get_full_name()
                            or getattr(seller, "username", None)
                            or seller.email
                        )
                        send_payment_success_email_seller_task.delay(
                            seller.email,
                            seller_name,
                            project.name,
                            float(payment_obj.buyer_total_amount or payment_obj.amount),
                            "fr",
                        )
                except Exception:
                    pass
        except Exception:
            pass

        NotificationService.create_notification(
            project.user,
            message="notifications.project_approved_seller",
            project_name=project.name
        )
        NotificationService.create_notification(
            project.client,
            message="notifications.payment_processed_buyer",
            amount=str(payment_obj.amount),
            project_name=project.name
        )

        send_payment_websocket_update(
            project_id=project.id,
            payment_status="paid",
            payment_amount=payment_obj.amount,
            project_status="approved",
            updated_at=payment_obj.updated_at,
        )

    # Handle checkout.session.expired event
    elif event["type"] == "checkout.session.expired":
        payment = event["data"]["object"]
        payment_id = payment["id"]
        project_id = payment["metadata"]["project_id"]
        payment = Payment.objects.get(stripe_payment_id=payment_id)
        payment.status = "pending"
        payment.webhook_response = event
        payment.save()

        # Update HubSpot Payments record via task
        try:
            from hubspot.tasks import sync_payment_to_hubspot
            sync_payment_to_hubspot.delay(payment_id=payment.id)
        except Exception:
            pass
        project = Project.objects.get(id=project_id)
        project.status = "pending"
        project.save()

        # Send notifications for expired payment session
        NotificationService.create_notification(
            project.client,
            message="notifications.payment_session_expired",
            project_name=project.name
        )

        # Send WebSocket update
        send_payment_websocket_update(
            project_id=project.id,
            payment_status="pending",
            payment_amount=payment.amount,
            project_status="pending",
            updated_at=payment.updated_at,
        )

    # Handle checkout.session.failed event
    elif event["type"] == "checkout.session.async_payment_failed":
        payment = event["data"]["object"]
        payment_id = payment["id"]
        project_id = payment["metadata"]["project_id"]
        payment = Payment.objects.get(stripe_payment_id=payment_id)
        payment.status = "failed"
        payment.webhook_response = event
        payment.save()

        # Update HubSpot Payments record via task
        try:
            from hubspot.tasks import sync_payment_to_hubspot
            sync_payment_to_hubspot.delay(payment_id=payment.id)
        except Exception:
            pass
        project = Project.objects.get(id=project_id)
        project.status = "pending"
        project.save()

        # Email: notify client of failed payment
        try:
            if project.client:
                client = project.client
                client_name = (
                    client.get_full_name()
                    or getattr(client, "username", None)
                    or (
                        client.email.split("@")[0]
                        if getattr(client, "email", None)
                        else "User"
                    )
                )
                send_payment_failed_email_task.delay(
                    user_email=client.email,
                    user_name=client_name,
                    project_name=project.name,
                    amount=str(payment.amount),
                    language="fr",
                )
        except Exception:
            # Avoid breaking webhook flow if email fails
            pass

        # Send notifications for failed payment
        NotificationService.create_notification(
            project.client,
            message="notifications.payment_failed",
            project_name=project.name
        )

        # Send WebSocket update
        send_payment_websocket_update(
            project_id=project.id,
            payment_status="failed",
            payment_amount=payment.amount,
            project_status="pending",
            updated_at=payment.updated_at,
        )

    # Handle transfer webhook events
    elif event["type"] in ["transfer.created", "transfer.updated"]:
        logger.info(f"Processing transfer.{event['type'].split('.')[1]} webhook event")
        TransferService.handle_transfer_created(event)
    elif event["type"] == "transfer.reversed":
        logger.info(f"Processing transfer.reversed webhook event")
        transfer_data = event["data"]["object"]
        transfer_id = transfer_data["id"]
        reason = transfer_data.get("reversal_details", {}).get(
            "reason", "Transfer reversed"
        )
        TransferService.handle_transfer_reversal(transfer_id, reason)
    elif event["type"] == "transfer.failed":
        logger.info(f"Processing transfer.failed webhook event")
        transfer_data = event["data"]["object"]
        transfer_id = transfer_data["id"]
        reason = "Transfer failed"
        TransferService.handle_transfer_reversal(transfer_id, reason)

    elif event["type"] == "refund.created":
        refund = event["data"]["object"]
        refund_id = refund["metadata"]["refund_id"]
        project_id = refund["metadata"]["project_id"]
        project = Project.objects.get(id=project_id)
        project.refundable_amount = 0.00
        project.save()
        refund = Refund.objects.get(id=refund_id)
        # client = refund.project.client
        # balance = Balance.objects.get(user=client)
        # balance.total_spent -= refund.amount
        # balance.save()

        refund.status = "paid"
        refund.save()

    elif event["type"] == "refund.updated":
        refund = event["data"]["object"]
        refund_id = refund["metadata"]["refund_id"]
        project_id = refund["metadata"]["project_id"]
        project = Project.objects.get(id=project_id)
        project.refundable_amount = 0.00
        project.save()
        refund = Refund.objects.get(id=refund_id)
        refund.status = "paid"
        refund.save()
        # client = refund.project.client
        # balance = Balance.objects.get(user=client)
        # balance.total_spent -= refund.amount
        # balance.save()

    elif event["type"] == "refund.failed":
        refund = event["data"]["object"]
        refund_id = refund["metadata"]["refund_id"]
        refund = Refund.objects.get(id=refund_id)
        refund.status = "failed"
        refund.save()

    # Handle REFUND events
    else:
        logger.info(f"Unhandled Stripe Identity event type: {event['type']}")

    return Response({"status": "success"}, status=200)

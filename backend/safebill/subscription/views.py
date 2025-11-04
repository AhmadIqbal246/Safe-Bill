from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone
from django.db import transaction
import stripe
import logging

from .models import Subscription
from payments.models import Payment


logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subscribe(request):
    """
    Create a Stripe Checkout Session (mode=subscription) for the authenticated user.
    Body: { success_url, cancel_url }
    Returns: { checkout_url }
    """
    stripe.api_key = settings.STRIPE_API_KEY

    price_id = getattr(settings, "STRIPE_SUBSCRIPTION_PRICE_ID", "")
    if not price_id:
        return Response({"detail": "Subscription price not configured."}, status=500)

    success_url = request.data.get("success_url") or f"{settings.FRONTEND_URL}onboarding"
    cancel_url = request.data.get("cancel_url") or f"{settings.FRONTEND_URL}onboarding"

    user = request.user

    try:
        # Ensure local record exists
        sub, _ = Subscription.objects.get_or_create(user=user)

        # Find or create Stripe Customer
        customer_id = sub.stripe_customer_id
        if not customer_id:
            existing = stripe.Customer.list(email=user.email, limit=1)
            if existing.data:
                customer_id = existing.data[0].id
            else:
                customer = stripe.Customer.create(email=user.email, metadata={"user_id": str(user.id)})
                customer_id = customer.id
            sub.stripe_customer_id = customer_id
            sub.save(update_fields=["stripe_customer_id", "updated_at"])

        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
            metadata={"user_id": str(user.id), "flow": "subscription"},
        )

        return Response({"checkout_url": session.url}, status=200)

    except Exception as e:
        logger.error(f"Error creating subscription session for user {user.id}: {e}")
        return Response({"detail": "Failed to create subscription session."}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """
    Return the user's subscription state cached in DB.
    """
    user = request.user
    sub = Subscription.objects.filter(user=user).first()
    if not sub:
        return Response(
            {
                "membership_active": False,
                "status": "",
                "current_period_end": None,
                "stripe_customer_id": None,
                "stripe_subscription_id": None,
            },
            status=200,
        )

    return Response(
        {
            "membership_active": sub.membership_active,
            "status": sub.status,
            "current_period_end": sub.current_period_end,
            "stripe_customer_id": sub.stripe_customer_id or None,
            "stripe_subscription_id": sub.stripe_subscription_id or None,
        },
        status=200,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def subscription_webhook(request):
    """
    Handle platform subscription lifecycle events.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = getattr(settings, "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET", "") or getattr(
        settings, "STRIPE_WEBHOOK_SECRET", ""
    )

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception as e:
        logger.error(f"Invalid subscription webhook: {e}")
        return Response({"error": "invalid"}, status=400)

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    try:
        if event_type == "checkout.session.completed":
            # Only handle subscription sessions here
            if data_object.get("mode") != "subscription":
                return Response({"status": "ignored"}, status=200)

            customer_id = data_object.get("customer")
            subscription_id = data_object.get("subscription")
            user_id = None
            try:
                user_id = int(data_object.get("metadata", {}).get("user_id"))
            except Exception:
                pass

            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    logger.error(f"User {user_id} not found for checkout.session.completed")
                    return Response({"status": "error", "detail": "User not found"}, status=200)
            else:
                # Fallback: try to map by customer email
                user = None
                logger.warning("No user_id in checkout.session.completed metadata")

            if not subscription_id:
                logger.error("No subscription_id in checkout.session.completed")
                return Response({"status": "error", "detail": "No subscription_id"}, status=200)

            # Retrieve subscription to get current_period_end and status
            try:
                sub_obj = stripe.Subscription.retrieve(subscription_id)
                status = sub_obj.status if hasattr(sub_obj, "status") else "active"
                
                # Get current_period_end from Stripe subscription object
                cpe = None
                if hasattr(sub_obj, "current_period_end") and sub_obj.current_period_end:
                    try:
                        # Stripe returns Unix timestamp as integer
                        if isinstance(sub_obj.current_period_end, (int, float)):
                            cpe = datetime.fromtimestamp(sub_obj.current_period_end, tz=dt_timezone.utc)
                        else:
                            # If it's already a datetime-like object
                            cpe = sub_obj.current_period_end
                    except (ValueError, TypeError, OSError) as e:
                        logger.error(f"Error parsing current_period_end: {e}, value: {sub_obj.current_period_end}")
                        cpe = None
                
                logger.info(f"Subscription {subscription_id} - status: {status}, current_period_end: {cpe}")
                
                if user:
                    with transaction.atomic():
                        sub, created = Subscription.objects.select_for_update().get_or_create(user=user)
                        sub.stripe_customer_id = customer_id or sub.stripe_customer_id
                        sub.stripe_subscription_id = subscription_id or sub.stripe_subscription_id
                        sub.status = status
                        if cpe:
                            sub.current_period_end = cpe
                        sub.membership_active = status in ["active", "trialing"]
                        sub.save()
                        logger.info(f"Updated subscription for user {user.id}: status={status}, period_end={cpe}, active={sub.membership_active}")
                else:
                    logger.warning(f"User not found for subscription {subscription_id}")
                    
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error retrieving subscription {subscription_id}: {e}")
                return Response({"status": "error", "detail": str(e)}, status=200)
            except Exception as e:
                logger.error(f"Error handling checkout.session.completed: {e}")
                return Response({"status": "error", "detail": str(e)}, status=200)

        elif event_type in ("invoice.payment_succeeded", "invoice.paid"):
            subscription_id = data_object.get("subscription")
            if not subscription_id:
                return Response({"status": "ignored"}, status=200)
            try:
                sub_obj = stripe.Subscription.retrieve(subscription_id)
                status = sub_obj.status if hasattr(sub_obj, "status") else "active"
                cpe = None
                if hasattr(sub_obj, "current_period_end") and sub_obj.current_period_end:
                    try:
                        if isinstance(sub_obj.current_period_end, (int, float)):
                            cpe = datetime.fromtimestamp(sub_obj.current_period_end, tz=dt_timezone.utc)
                        else:
                            cpe = sub_obj.current_period_end
                    except (ValueError, TypeError, OSError) as e:
                        logger.error(f"Error parsing current_period_end in invoice.payment_succeeded: {e}")
                        cpe = None
                
                if cpe:
                    Subscription.objects.filter(stripe_subscription_id=subscription_id).update(
                        status=status,
                        current_period_end=cpe,
                        membership_active=status in ["active", "trialing"],
                    )
                    logger.info(f"Updated subscription {subscription_id} from invoice.payment_succeeded: period_end={cpe}")
                else:
                    Subscription.objects.filter(stripe_subscription_id=subscription_id).update(
                        status=status,
                        membership_active=status in ["active", "trialing"],
                    )
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error in invoice.payment_succeeded: {e}")
            except Exception as e:
                logger.error(f"Error handling invoice.payment_succeeded: {e}")

        elif event_type == "invoice.payment_failed":
            subscription_id = data_object.get("subscription")
            if subscription_id:
                Subscription.objects.filter(stripe_subscription_id=subscription_id).update(
                    status="past_due",
                    membership_active=False,
                )

        elif event_type == "customer.subscription.created":
            # Handle new subscription creation
            subscription_id = data_object.get("id")
            if not subscription_id:
                return Response({"status": "ignored"}, status=200)
            
            customer_id = data_object.get("customer")
            status = data_object.get("status", "active")
            
            # Get current_period_end from event data
            cpe = None
            current_period_end = data_object.get("current_period_end")
            if current_period_end:
                try:
                    if isinstance(current_period_end, (int, float)):
                        cpe = datetime.fromtimestamp(current_period_end, tz=dt_timezone.utc)
                    else:
                        cpe = current_period_end
                except (ValueError, TypeError, OSError) as e:
                    logger.error(f"Error parsing current_period_end in customer.subscription.created: {e}")
                    cpe = None
            
            # Try to find user by customer_id
            try:
                sub = Subscription.objects.filter(stripe_customer_id=customer_id).first()
                if sub:
                    sub.stripe_subscription_id = subscription_id
                    sub.status = status
                    if cpe:
                        sub.current_period_end = cpe
                    sub.membership_active = status in ["active", "trialing"]
                    sub.save()
                    logger.info(f"Created subscription {subscription_id} for customer {customer_id}: period_end={cpe}")
            except Exception as e:
                logger.error(f"Error handling customer.subscription.created: {e}")

        elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
            subscription_id = data_object.get("id")
            if not subscription_id:
                return Response({"status": "ignored"}, status=200)
            
            status = data_object.get("status", "")
            deactivate = status in ["canceled", "unpaid", "incomplete_expired"]
            
            # Get current_period_end from event data
            cpe = None
            current_period_end = data_object.get("current_period_end")
            if current_period_end:
                try:
                    if isinstance(current_period_end, (int, float)):
                        cpe = datetime.fromtimestamp(current_period_end, tz=dt_timezone.utc)
                    else:
                        cpe = current_period_end
                except (ValueError, TypeError, OSError) as e:
                    logger.error(f"Error parsing current_period_end in customer.subscription.updated: {e}, value: {current_period_end}")
                    cpe = None
            
            # If current_period_end is not in event data, retrieve subscription
            if not cpe:
                try:
                    sub_obj = stripe.Subscription.retrieve(subscription_id)
                    if hasattr(sub_obj, "current_period_end") and sub_obj.current_period_end:
                        try:
                            if isinstance(sub_obj.current_period_end, (int, float)):
                                cpe = datetime.fromtimestamp(sub_obj.current_period_end, tz=dt_timezone.utc)
                            else:
                                cpe = sub_obj.current_period_end
                        except (ValueError, TypeError, OSError) as e:
                            logger.error(f"Error parsing current_period_end from retrieved subscription: {e}")
                except stripe.error.StripeError as e:
                    logger.error(f"Stripe error retrieving subscription {subscription_id}: {e}")
            
            membership_active = (not deactivate) and status in ["active", "trialing"]
            
            if cpe:
                Subscription.objects.filter(stripe_subscription_id=subscription_id).update(
                    status=status or "",
                    current_period_end=cpe,
                    membership_active=membership_active,
                )
                logger.info(f"Updated subscription {subscription_id} from customer.subscription.updated: period_end={cpe}, active={membership_active}")
            else:
                Subscription.objects.filter(stripe_subscription_id=subscription_id).update(
                    status=status or "",
                    membership_active=membership_active,
                )
                logger.warning(f"Updated subscription {subscription_id} without current_period_end")

        else:
            # Ignore unrelated events
            pass

    except Exception as e:
        logger.error(f"Error handling subscription webhook {event_type}: {e}")
        return Response({"error": "failed"}, status=500)

    return Response({"status": "success"}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def eligibility(request):
    """
    Return whether the current user must subscribe now (has >=1 paid projects and membership is inactive).
    """
    user = request.user
    needs_subscription = False
    if getattr(user, "role", None) == "seller":
        paid_projects_count = (
            Payment.objects.filter(project__user=user, status="paid")
            .values("project")
            .distinct()
            .count()
        )
        sub = Subscription.objects.filter(user=user).first()
        is_active_member = bool(sub and sub.membership_active)
        needs_subscription = paid_projects_count >= 1 and not is_active_member

    sub = Subscription.objects.filter(user=user).first()
    return Response(
        {
            "needs_subscription": needs_subscription,
            "membership_active": bool(sub and sub.membership_active),
            "status": getattr(sub, "status", ""),
            "current_period_end": getattr(sub, "current_period_end", None),
        }
    )



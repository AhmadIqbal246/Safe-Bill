from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timezone as dt_timezone
from django.db import transaction
from decimal import Decimal
import stripe
import logging

from .models import Subscription, SubscriptionInvoice
from .serializers import SubscriptionInvoiceSerializer
from payments.models import Payment


logger = logging.getLogger(__name__)
User = get_user_model()


def extract_current_period_end(sub_obj):
    """
    Extract current_period_end from Stripe subscription object.
    Supports both classic and flexible billing modes.
    In flexible mode, current_period_end is in items.data[0].current_period_end
    """
    # Try subscription-level first (classic mode)
    cpe = getattr(sub_obj, "current_period_end", None)
    if cpe:
        if isinstance(cpe, (int, float)):
            try:
                return datetime.fromtimestamp(cpe, tz=dt_timezone.utc)
            except (ValueError, TypeError, OSError) as e:
                logger.error(f"Error parsing current_period_end from subscription: {e}, value: {cpe}")
        else:
            return cpe
    
    # Fallback to subscription item (flexible billing mode)
    # Access items as dict key, not attribute (to avoid Python dict.items() method)
    if "items" in sub_obj:
        items = sub_obj["items"]
        if items and isinstance(items, dict) and items.get("data"):
            item = items["data"][0]
            item_cpe = item.get("current_period_end")
            if item_cpe:
                if isinstance(item_cpe, (int, float)):
                    try:
                        return datetime.fromtimestamp(item_cpe, tz=dt_timezone.utc)
                    except (ValueError, TypeError, OSError) as e:
                        logger.error(f"Error parsing current_period_end from subscription item: {e}, value: {item_cpe}")
                else:
                    return item_cpe
    
    return None


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
        if sig_header:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        else:
            # Fallback for local development
            event = json.loads(payload)
            logger.warning("No Stripe signature found, using raw payload (Dev mode)")
    except Exception as e:
        logger.error(f"Invalid subscription webhook: {e}")
        return Response({"error": "invalid"}, status=400)

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})
    logger.info(f"[WEBHOOK] Received event type: {event_type}")

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
                
                # Get current_period_end from Stripe subscription object (supports flexible billing mode)
                cpe = extract_current_period_end(sub_obj)
                
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
            logger.info(f"[INVOICE_DEBUG] Handling {event_type} event")
            # Try to get subscription_id from parent.subscription_details.subscription
            subscription_id = None
            parent = data_object.get("parent", {})
            if parent and isinstance(parent, dict):
                subscription_details = parent.get("subscription_details", {})
                if subscription_details and isinstance(subscription_details, dict):
                    subscription_id = subscription_details.get("subscription")
            
            logger.info(f"[INVOICE_DEBUG] subscription_id from parent.subscription_details: {subscription_id}")
            if not subscription_id:
                logger.warning(f"[INVOICE_DEBUG] No subscription_id found in invoice event")
                return Response({"status": "ignored"}, status=200)
            try:
                sub_obj = stripe.Subscription.retrieve(subscription_id)
                status = sub_obj.status if hasattr(sub_obj, "status") else "active"
                cpe = extract_current_period_end(sub_obj)
                
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
                
                # Create SubscriptionInvoice record
                try:
                    logger.info(f"[INVOICE_DEBUG] Creating invoice for payment_succeeded event")
                    invoice_data = stripe.Invoice.retrieve(data_object.get("id"))
                    subscription = Subscription.objects.filter(stripe_subscription_id=subscription_id).first()
                    logger.info(f"[INVOICE_DEBUG] Found subscription: {subscription}, User: {subscription.user if subscription else 'None'}")
                    
                    if subscription and subscription.user:
                        logger.info(f"[INVOICE_DEBUG] Creating invoice record for user {subscription.user.id}")
                        
                        # Get billing period from subscription's current_period_end
                        # Calculate period_start as 1 month before period_end
                        period_end_dt = subscription.current_period_end
                        if period_end_dt:
                            # Period end is the subscription's current_period_end
                            period_end = period_end_dt.date() if hasattr(period_end_dt, 'date') else period_end_dt
                            # Period start is 1 month before (approximately 30 days)
                            from datetime import timedelta
                            period_start = (period_end_dt - timedelta(days=30)).date() if hasattr(period_end_dt, 'date') else period_end_dt
                        else:
                            # Fallback to invoice period if subscription period not available
                            period_start = datetime.fromtimestamp(
                                invoice_data.period_start, tz=dt_timezone.utc
                            ).date()
                            period_end = datetime.fromtimestamp(
                                invoice_data.period_end, tz=dt_timezone.utc
                            ).date()
                        
                        # Convert amount from cents to euros (fixed €3.00)
                        amount = Decimal(str(invoice_data.amount_paid / 100)) if invoice_data.amount_paid else Decimal("3.00")
                        
                        logger.info(f"[INVOICE_DEBUG] Invoice data - amount: {amount}, period: {period_start} to {period_end}")
                        
                        # Create or update invoice
                        SubscriptionInvoice.objects.update_or_create(
                            stripe_invoice_id=invoice_data.id,
                            defaults={
                                'user': subscription.user,
                                'subscription': subscription,
                                'amount': amount,
                                'billing_period_start': period_start,
                                'billing_period_end': period_end,
                                'status': 'paid'
                            }
                        )
                        logger.info(f"✅ CREATED/UPDATED SubscriptionInvoice for user {subscription.user.id}: {period_start} to {period_end}, amount: €{amount}")
                    else:
                        logger.warning(f"[INVOICE_DEBUG] Subscription or user not found")
                except Exception as e:
                    logger.error(f"❌ Error creating subscription invoice: {str(e)}", exc_info=True)
                    
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
            
            # Get current_period_end from event data (try subscription-level first, then items)
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
            
            # If not in event data, check items (flexible billing mode)
            if not cpe:
                items = data_object.get("items")
                if items and isinstance(items, dict) and items.get("data"):
                    item = items["data"][0]
                    item_cpe = item.get("current_period_end")
                    if item_cpe:
                        try:
                            if isinstance(item_cpe, (int, float)):
                                cpe = datetime.fromtimestamp(item_cpe, tz=dt_timezone.utc)
                            else:
                                cpe = item_cpe
                        except (ValueError, TypeError, OSError) as e:
                            logger.error(f"Error parsing current_period_end from event items in customer.subscription.created: {e}")
            
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
            
            # Get current_period_end from event data (try subscription-level first, then items)
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
            
            # If not in event data, check items (flexible billing mode)
            if not cpe:
                items = data_object.get("items")
                if items and isinstance(items, dict) and items.get("data"):
                    item = items["data"][0]
                    item_cpe = item.get("current_period_end")
                    if item_cpe:
                        try:
                            if isinstance(item_cpe, (int, float)):
                                cpe = datetime.fromtimestamp(item_cpe, tz=dt_timezone.utc)
                            else:
                                cpe = item_cpe
                        except (ValueError, TypeError, OSError) as e:
                            logger.error(f"Error parsing current_period_end from event items: {e}, value: {item_cpe}")
            
            # If current_period_end is not in event data, retrieve subscription
            if not cpe:
                try:
                    sub_obj = stripe.Subscription.retrieve(subscription_id)
                    cpe = extract_current_period_end(sub_obj)
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def seller_subscription_invoices(request):
    """
    Return all subscription invoices for the authenticated seller.
    Only accessible to sellers.
    """
    user = request.user
    if not (getattr(user, "role", None) == "seller"):
        return Response(
            {"detail": "Only sellers can access this endpoint."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    invoices = SubscriptionInvoice.objects.filter(user=user).order_by("billing_period_start")
    serializer = SubscriptionInvoiceSerializer(invoices, many=True)
    return Response({
        "invoices": serializer.data,
        "count": invoices.count()
    })


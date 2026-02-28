import stripe
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone

from subscription.models import Subscription


class Command(BaseCommand):
    help = "Sync a user's Stripe subscription data (status, current_period_end) from Stripe by email or user_id."

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="User email to sync", default=None)
        parser.add_argument("--user_id", type=int, help="User ID to sync", default=None)

    def handle(self, *args, **options):
        email = options.get("email")
        user_id = options.get("user_id")

        if not email and not user_id:
            raise CommandError("Provide --email or --user_id")

        User = get_user_model()
        try:
            if email:
                user = User.objects.get(email=email)
            else:
                user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise CommandError("User not found")

        sub = Subscription.objects.filter(user=user).first()
        if not sub:
            raise CommandError("No local Subscription record found for this user")

        stripe.api_key = settings.STRIPE_API_KEY

        # Resolve Stripe subscription ID
        stripe_subscription_id = sub.stripe_subscription_id
        if not stripe_subscription_id:
            # Try to find via customer
            if not sub.stripe_customer_id:
                # Attempt to find customer by email
                customers = stripe.Customer.list(email=user.email, limit=1)
                if customers and customers.data:
                    sub.stripe_customer_id = customers.data[0].id
                    sub.save(update_fields=["stripe_customer_id"]) 
            if sub.stripe_customer_id:
                # Get active subscriptions for the customer
                subs_list = stripe.Subscription.list(customer=sub.stripe_customer_id, status="all", limit=1)
                if subs_list and subs_list.data:
                    stripe_subscription_id = subs_list.data[0].id
                    sub.stripe_subscription_id = stripe_subscription_id
                    sub.save(update_fields=["stripe_subscription_id"]) 

        if not stripe_subscription_id:
            raise CommandError("Could not resolve Stripe subscription id for this user")

        # Retrieve subscription from Stripe
        s = stripe.Subscription.retrieve(stripe_subscription_id)
        status = getattr(s, "status", "")

        # Parse current_period_end (supports flexible billing mode)
        current_period_end = None
        # Try subscription-level first (classic mode)
        ts = getattr(s, "current_period_end", None)
        if ts:
            if isinstance(ts, (int, float)):
                current_period_end = datetime.fromtimestamp(ts, tz=dt_timezone.utc)
            else:
                current_period_end = ts
        else:
            # Fallback to subscription item (flexible billing mode)
            # Access items as dict key, not attribute (to avoid Python dict.items() method)
            if "items" in s:
                items = s["items"]
                if items and isinstance(items, dict) and items.get("data"):
                    item = items["data"][0]
                    ts = item.get("current_period_end")
                    if ts:
                        if isinstance(ts, (int, float)):
                            current_period_end = datetime.fromtimestamp(ts, tz=dt_timezone.utc)
                        else:
                            current_period_end = ts

        sub.status = status
        if current_period_end:
            sub.current_period_end = current_period_end
        sub.membership_active = status in ["active", "trialing"]
        sub.save()

        self.stdout.write(self.style.SUCCESS(
            f"Synced subscription for {user.email}: status={sub.status}, current_period_end={sub.current_period_end}"
        ))




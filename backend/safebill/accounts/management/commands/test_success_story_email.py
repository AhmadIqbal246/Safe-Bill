import os
import time
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone

from feedback.models import EmailLog
from accounts.tasks import orchestrate_success_story_emails_task


class Command(BaseCommand):
    help = "Trigger a one-off Success Story email test for a specific email and verify delivery."

    def add_arguments(self, parser):
        parser.add_argument(
            "email",
            type=str,
            help="Email address of the user to receive the Success Story email.",
        )
        parser.add_argument(
            "--timeout",
            type=int,
            default=120,
            help="Seconds to wait for EmailLog confirmation (default: 120).",
        )
        parser.add_argument(
            "--language",
            type=str,
            default=None,
            help="Optional two-letter language code to set as preferred_language (e.g., en or fr).",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        email = options["email"].strip()
        timeout = options["timeout"]
        language = options["language"]

        if not email:
            raise CommandError("Email is required.")

        # Ensure a user exists and is eligible
        user, _ = User.objects.get_or_create(email=email, defaults={"username": email.split("@")[0]})

        # Mark active + verified
        modified_fields = []
        if not getattr(user, "is_active", True):
            user.is_active = True
            modified_fields.append("is_active")
        if not getattr(user, "is_email_verified", False):
            user.is_email_verified = True
            modified_fields.append("is_email_verified")

        # Backdate date_joined so the user crosses the Success Story threshold
        # Get delay from .env - required, no fallback
        delay_minutes = int(os.environ["SUCCESS_STORY_DELAY_MINUTES"])
        target_joined = timezone.now() - timedelta(minutes=delay_minutes + 1)
        user.date_joined = target_joined
        modified_fields.append("date_joined")

        # Optionally set preferred_language for localization
        if language:
            if hasattr(user, "preferred_language"):
                user.preferred_language = language
                modified_fields.append("preferred_language")

        if modified_fields:
            user.save(update_fields=modified_fields)

        # Remove any prior log to allow a fresh send in this test
        EmailLog.objects.filter(user=user, campaign_key="success_story_day20").delete()

        self.stdout.write(self.style.NOTICE("Triggering orchestrator..."))
        # Run orchestrator (async) - rely on worker handling; we will poll for EmailLog
        orchestrate_success_story_emails_task.delay()

        # Poll EmailLog until timeout
        start = time.time()
        while time.time() - start < timeout:
            if EmailLog.objects.filter(user=user, campaign_key="success_story_day20").exists():
                self.stdout.write(self.style.SUCCESS("Success Story email was enqueued and logged."))
                return
            time.sleep(2)

        raise CommandError(
            "Timed out waiting for Success Story email log. Check worker logs and SMTP configuration."
        )








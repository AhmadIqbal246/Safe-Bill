"""
Diagnostic command to check why users haven't received the success story email.
Run: python manage.py diagnose_success_story_email --email user@example.com
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from feedback.models import EmailLog

User = get_user_model()


class Command(BaseCommand):
    help = "Diagnose why a user hasn't received the success story email"

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address of the user to check',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='User ID to check',
        )
        parser.add_argument(
            '--all-eligible',
            action='store_true',
            help='Show all users who should receive the email but haven\'t',
        )

    def handle(self, *args, **options):
        # Get delay from .env - required, no fallback
        delay_minutes = int(os.environ['SUCCESS_STORY_DELAY_MINUTES'])
        threshold = timezone.now() - timedelta(minutes=delay_minutes)
        campaign_key = 'success_story_day20'

        if options['email']:
            try:
                user = User.objects.get(email=options['email'])
                self.check_user(user, threshold, campaign_key, delay_minutes)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"User with email {options['email']} not found")
                )
        elif options['user_id']:
            try:
                user = User.objects.get(pk=options['user_id'])
                self.check_user(user, threshold, campaign_key, delay_minutes)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"User with ID {options['user_id']} not found")
                )
        elif options['all_eligible']:
            self.show_all_eligible_users(threshold, campaign_key, delay_minutes)
        else:
            self.stdout.write(
                self.style.ERROR("Please provide --email, --user-id, or --all-eligible")
            )

    def check_user(self, user, threshold, campaign_key, delay_minutes):
        """Check why a specific user hasn't received the email"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS(f"Diagnostic for: {user.email} (ID: {user.id})"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))

        issues = []
        checks_passed = []

        # Check 1: Has user already received the email?
        email_log = EmailLog.objects.filter(user=user, campaign_key=campaign_key).first()
        if email_log:
            self.stdout.write(
                self.style.WARNING(f"❌ ALREADY RECEIVED: Email was sent on {email_log.sent_at}")
            )
            self.stdout.write(f"   Status: {email_log.status}")
            self.stdout.write(f"   Campaign Key: {email_log.campaign_key}\n")
            return
        else:
            checks_passed.append("✅ Has not received email yet")

        # Check 2: Has enough time passed?
        time_since_joined = timezone.now() - user.date_joined
        time_since_joined_minutes = time_since_joined.total_seconds() / 60
        if user.date_joined > threshold:
            issues.append(
                f"❌ TIMING: User joined {time_since_joined_minutes:.1f} minutes ago. "
                f"Need {delay_minutes} minutes. "
                f"Wait {delay_minutes - time_since_joined_minutes:.1f} more minutes."
            )
        else:
            checks_passed.append(
                f"✅ TIMING: User joined {time_since_joined_minutes:.1f} minutes ago "
                f"(threshold: {delay_minutes} minutes)"
            )

        # Check 3: User status (informational, not blocking anymore)
        if not user.is_active:
            self.stdout.write(
                self.style.WARNING(f"⚠️  INFO: User is inactive (but emails will still be sent)")
            )
        else:
            checks_passed.append("✅ User is active")

        if not user.is_email_verified:
            self.stdout.write(
                self.style.WARNING(f"⚠️  INFO: Email not verified (but emails will still be sent)")
            )
        else:
            checks_passed.append("✅ Email is verified")

        # Check 4: Would user be selected by orchestrator?
        eligible_users = (
            User.objects.filter(date_joined__lte=threshold)
            .exclude(email_logs__campaign_key=campaign_key)
            .values('id')
        )
        is_in_eligible_list = any(u['id'] == user.id for u in eligible_users)
        
        if is_in_eligible_list:
            checks_passed.append("✅ User is in eligible list for orchestrator")
        else:
            issues.append("❌ ELIGIBILITY: User is NOT in the eligible list")

        # Check 5: Batch limit impact
        eligible_count = eligible_users.count()
        if eligible_count > 1000:
            self.stdout.write(
                self.style.WARNING(
                    f"⚠️  BATCH LIMIT: There are {eligible_count} eligible users, "
                    f"but orchestrator processes only 1000 per run. "
                    f"User might be in the remaining {eligible_count - 1000} users."
                )
            )
        else:
            checks_passed.append(f"✅ Batch limit OK ({eligible_count} eligible users)")

        # Summary
        self.stdout.write("\n" + self.style.SUCCESS("CHECKS PASSED:"))
        for check in checks_passed:
            self.stdout.write(f"  {check}")

        if issues:
            self.stdout.write("\n" + self.style.ERROR("ISSUES FOUND:"))
            for issue in issues:
                self.stdout.write(f"  {issue}")
        else:
            self.stdout.write(
                "\n" + self.style.SUCCESS("✅ No issues found! User should receive email on next orchestrator run.")
            )

        # Recommendations
        self.stdout.write("\n" + self.style.SUCCESS("RECOMMENDATIONS:"))
        orchestrator_interval = float(os.environ['SUCCESS_STORY_ORCHESTRATOR_INTERVAL'])
        self.stdout.write(f"  • Orchestrator runs every {orchestrator_interval/60:.1f} minutes")
        self.stdout.write(f"  • Next run should pick up this user if eligible")
        self.stdout.write(f"  • Check Celery Beat is running: celery -A safebill beat")
        self.stdout.write(f"  • Check Celery Worker is running: celery -A safebill worker -Q emails")

    def show_all_eligible_users(self, threshold, campaign_key, delay_minutes):
        """Show all users who should receive the email"""
        eligible_users = (
            User.objects.filter(date_joined__lte=threshold)
            .exclude(email_logs__campaign_key=campaign_key)
            .values('id', 'email', 'date_joined', 'is_active', 'is_email_verified')
        )

        total = eligible_users.count()
        self.stdout.write(
            self.style.SUCCESS(f"\n{'='*60}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"Total Eligible Users: {total}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"Delay Minutes: {delay_minutes}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"Threshold: {threshold}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"{'='*60}\n")
        )

        if total == 0:
            self.stdout.write(self.style.WARNING("No eligible users found."))
            return

        # Show first 50 users
        for i, u in enumerate(eligible_users[:50], 1):
            user = User.objects.get(id=u['id'])
            time_since_joined = (timezone.now() - u['date_joined']).total_seconds() / 60
            self.stdout.write(
                f"{i}. {u['email']} | "
                f"Joined {time_since_joined:.1f} min ago | "
                f"Active: {u['is_active']} | "
                f"Verified: {u['is_email_verified']}"
            )

        if total > 50:
            self.stdout.write(
                self.style.WARNING(f"\n... and {total - 50} more users")
            )

        self.stdout.write(
            f"\n⚠️  Batch Limit: Only first 1000 users will be processed per orchestrator run"
        )


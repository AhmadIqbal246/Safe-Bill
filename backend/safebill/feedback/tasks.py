import logging
from celery import shared_task
from utils.email_service import EmailService
from django.core.mail import send_mail
from django.conf import settings
import os
from django.utils import timezone
from datetime import timedelta
from django.db.models import Exists, OuterRef
from django.core.mail import get_connection
from django.contrib.auth import get_user_model
from projects.models import Project
from .models import EmailLog

logger = logging.getLogger(__name__)
logger.propagate = True


@shared_task(bind=True, max_retries=3)
def send_feedback_admin_notification_task(
    self, user_email, feedback_text, language="en"
):
    """
    Send feedback notification email to admin asynchronously via Celery
    """
    try:
        send_mail(
            subject=f"New Feedback from {user_email}",
            message=f"Email: {user_email}\n\nFeedback:\n{feedback_text}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=True,
        )
        logger.info(f"Feedback admin notification sent for {user_email}")
        return True
    except Exception as exc:
        logger.error(f"Error sending feedback admin notification: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_contact_admin_notification_task(
    self, name, email, subject, message, language="en"
):
    """
    Send contact message notification email to admin asynchronously via Celery
    """
    try:
        send_mail(
            subject=f"New Contact Message: {subject}",
            message=f"From: {name} <{email}>\n\n{message}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=True,
        )
        logger.info(f"Contact admin notification sent for {email}")
        return True
    except Exception as exc:
        logger.error(f"Error sending contact admin notification: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_quote_request_email_task(
    self,
    professional_email,
    from_email,
    subject,
    body,
    professional_id,
    language="en",
):
    """
    Send quote request email to professional asynchronously via Celery
    """
    try:
        result = EmailService.send_quote_request_email(
            professional_email=professional_email,
            from_email=from_email,
            subject=subject,
            body=body,
            professional_id=professional_id,
            language=language,
        )
        logger.info(f"Quote request email sent to {professional_email}")
        return result
    except Exception as exc:
        logger.error(f"Error sending quote request email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_quote_request_confirmation_email_task(
    self,
    sender_email,
    subject,
    professional_id,
    to_email,
    language="en",
):
    """
    Send quote request confirmation email to sender asynchronously via Celery
    """
    try:
        result = EmailService.send_quote_request_confirmation(
            sender_email=sender_email,
            subject=subject,
            professional_id=professional_id,
            to_email=to_email,
            language=language,
        )
        logger.info(f"Quote request confirmation email sent to {sender_email}")
        return result
    except Exception as exc:
        logger.error(f"Error sending quote request confirmation email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_callback_request_confirmation_email_task(
    self,
    user_email,
    first_name,
    language="fr",
):
    """
    Send a confirmation email to the user who submitted a callback request.
    """
    try:
        result = EmailService.send_callback_request_confirmation(
            user_email=user_email,
            first_name=first_name,
            language=language,
        )
        logger.info(f"Callback request confirmation email sent to {user_email}")
        return result
    except Exception as exc:
        logger.error(f"Error sending callback request confirmation email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_batch_no_project_nurture_emails_task(self, step, user_ids, batch_number=0):
    """Send no-project nurture emails in batch using a shared SMTP connection."""
    connection = None
    successful = 0
    failed = 0
    skipped = 0

    try:
        connection = get_connection()
        connection.open()
        logger.info(f"No-project {step} batch {batch_number}: Opened SMTP connection for batch of {len(user_ids)} users")

        User = get_user_model()
        for user_id in user_ids:
            try:
                user = User.objects.get(pk=user_id)
                user_email = user.email
                first_name = user.get_full_name() or user.username or ''

                # Skip duplicates
                if EmailLog.objects.filter(user=user, campaign_key=f'no_project_{step}').exists():
                    skipped += 1
                    continue

                # Send with shared connection
                result = EmailService.send_no_project_nurture_email(
                    user_email=user_email,
                    first_name=first_name,
                    step=step,
                    language='fr',
                    connection=connection,
                )
                if result:
                    EmailLog.objects.create(user_id=user_id, campaign_key=f'no_project_{step}', status='sent')
                    successful += 1
                else:
                    failed += 1

                delay_seconds = float(os.environ.get('NO_PROJECT_BATCH_DELAY_SECONDS', '0.5'))
                import time
                time.sleep(delay_seconds)

            except Exception as e:
                logger.error(f"No-project {step} batch {batch_number}: Error sending to user {user_id}: {e}")
                failed += 1

        logger.info(
            f"No-project {step} batch {batch_number}: Completed sending to {len(user_ids)} users "
            f"(successful: {successful}, failed: {failed}, skipped: {skipped})"
        )
        return {'successful': successful, 'failed': failed, 'skipped': skipped, 'total': len(user_ids)}

    except Exception as exc:
        logger.error(f"No-project {step} batch {batch_number}: Error in batch processing: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        if connection:
            try:
                connection.close()
                logger.info(f"No-project {step} batch {batch_number}: Closed SMTP connection")
            except Exception as e:
                logger.error(f"No-project {step} batch {batch_number}: Error closing connection: {e}")


@shared_task(bind=True, max_retries=3, queue='emails')
def orchestrate_no_project_nurture_task(self):
    """Select users at minute-based thresholds (7/14/30 equivalents) and enqueue batch emails."""
    try:
        User = get_user_model()
        now = timezone.now()

        # Subqueries for involvement
        buyer_exists = Project.objects.filter(client=OuterRef('pk'))
        seller_exists = Project.objects.filter(user=OuterRef('pk'))

        base_qs = (
            User.objects.filter(is_active=True, is_email_verified=True)
            .annotate(is_buyer=Exists(buyer_exists), is_seller=Exists(seller_exists))
            .filter(is_buyer=False, is_seller=False)
        )

        # REQUIRED minute thresholds from env (no fallbacks)
        minute_overrides = {
            # 'day7': int(os.environ['NO_PROJECT_MINUTES_DAY7']),  # temporarily disabled
            'day14': int(os.environ['NO_PROJECT_MINUTES_DAY14']),
            'day30': int(os.environ['NO_PROJECT_MINUTES_DAY30']),
        }

        def compute_threshold(step: str):
            return now - timedelta(minutes=minute_overrides[step])

        def enqueue_for(step: str):
            threshold = compute_threshold(step)
            users = (
                base_qs.filter(date_joined__lte=threshold)
                .exclude(email_logs__campaign_key=f'no_project_{step}')
                .values('id')[:1000]
            )
            users_list = list(users)
            total = len(users_list)
            if total == 0:
                logger.info(f"No-project {step}: No eligible users found")
                return
            batch_size = int(os.environ.get('NO_PROJECT_BATCH_SIZE', '50'))
            batch_number = 0
            for i in range(0, total, batch_size):
                chunk = users_list[i:i+batch_size]
                user_ids = [u['id'] for u in chunk]
                batch_number += 1
                send_batch_no_project_nurture_emails_task.delay(step, user_ids, batch_number)
                logger.info(f"No-project {step}: Queued batch {batch_number} with {len(user_ids)} users")

        # enqueue_for('day7')  # temporarily disabled
        enqueue_for('day14')
        enqueue_for('day30')

        logger.info("No-project nurture orchestrator enqueued emails.")
        return True
    except Exception as exc:
        logger.error(f"Error in orchestrator: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def cleanup_old_email_logs_task(self):
    """
    Clean up old EmailLog entries for all email campaigns.
    Deletes ALL logs older than the retention period (configurable via .env).
    This allows monthly campaigns to restart for users.
    """
    try:
        # Get retention period from .env (in minutes), default to 43200 minutes (31 days)
        retention_minutes = int(os.environ.get('EMAIL_LOG_RETENTION_MINUTES', '43200'))
        cutoff_date = timezone.now() - timedelta(minutes=retention_minutes)
        
        # Delete ALL old logs (not just success_story_day20 - all campaigns)
        deleted_count = EmailLog.objects.filter(
            sent_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(
            f"Email log cleanup: Deleted {deleted_count} old log entries "
            f"(older than {retention_minutes} minutes / {retention_minutes / 1440:.1f} days)"
        )
        
        return {'deleted_count': deleted_count}
        
    except Exception as exc:
        logger.error(f"Error in email log cleanup: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)
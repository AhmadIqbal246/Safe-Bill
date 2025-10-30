import logging
from celery import shared_task
from utils.email_service import EmailService
from django.core.mail import send_mail
from django.conf import settings
import os
from django.utils import timezone
from datetime import timedelta
from django.db.models import Exists, OuterRef
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
def send_no_project_nurture_email_task(self, user_id, first_name, step, language='fr'):
    try:
        user_email = get_user_model().objects.filter(id=user_id).values_list('email', flat=True).first()
        if not user_email:
            return False
        result = EmailService.send_no_project_nurture_email(
            user_email=user_email,
            first_name=first_name or '',
            step=step,
            language=language,
        )
        if result:
            EmailLog.objects.create(user_id=user_id, campaign_key=f'no_project_{step}', status='sent')
        return result
    except Exception as exc:
        logger.error(f"Error sending no-project nurture email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def orchestrate_no_project_nurture_task(self):
    """Runs every ~2h. Selects users at 7/14/30 days with no projects and enqueues emails."""
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

        # Test mode: allow minute-based thresholds via env for safe, reversible testing
        test_mode = (os.environ.get('NO_PROJECT_NURTURE_TEST_MODE', 'false').lower() == 'true')
        minutes_overrides = {
            'day7': int(os.environ.get('NO_PROJECT_NURTURE_MINUTES_DAY7', '4')),
            'day14': int(os.environ.get('NO_PROJECT_NURTURE_MINUTES_DAY14', '7')),
            'day30': int(os.environ.get('NO_PROJECT_NURTURE_MINUTES_DAY30', '10')),
        }

        def compute_threshold(step: str, min_days: int):
            if test_mode:
                return now - timedelta(minutes=minutes_overrides.get(step, 5))
            return now - timedelta(days=min_days)

        def enqueue_for(step: str, min_days: int):
            threshold = compute_threshold(step, min_days)
            users = (
                base_qs.filter(date_joined__lte=threshold)
                .exclude(email_logs__campaign_key=f'no_project_{step}')
                .values('id', 'first_name', 'username')[:500]
            )
            for u in users:
                first_name = u.get('first_name') or u.get('username') or ''
                # Determine language fallback (store later if available)
                language = 'fr'
                send_no_project_nurture_email_task.delay(u['id'], first_name, step, language)

        enqueue_for('day7', 7)
        enqueue_for('day14', 14)
        enqueue_for('day30', 30)

        logger.info("No-project nurture orchestrator enqueued emails.")
        return True
    except Exception as exc:
        logger.error(f"Error in orchestrator: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)
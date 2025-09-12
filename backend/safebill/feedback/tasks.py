import logging
from celery import shared_task
from utils.email_service import EmailService
from django.core.mail import send_mail
from django.conf import settings

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


@shared_task(bind=True, max_retries=3)
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


@shared_task(bind=True, max_retries=3)
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

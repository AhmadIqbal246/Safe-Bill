import logging
from celery import shared_task
from utils.email_service import EmailService

logger = logging.getLogger(__name__)
logger.propagate = True


@shared_task(bind=True, max_retries=3)
def send_payment_success_email_task(
    self,
    user_email,
    user_name,
    project_name,
    amount,
    language="en",
):
    """
    Send payment success email to client asynchronously via Celery
    """
    try:
        result = EmailService.send_client_payment_success_email(
            user_email=user_email,
            user_name=user_name,
            project_name=project_name,
            amount=str(amount),
            language=language,
        )
        logger.info(f"Payment success email sent to {user_email}")
        return result
    except Exception as exc:
        logger.error(f"Error sending payment success email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_payment_failed_email_task(
    self,
    user_email,
    user_name,
    project_name,
    amount,
    language="en",
):
    """
    Send payment failed email to client asynchronously via Celery
    """
    try:
        result = EmailService.send_client_payment_failed_email(
            user_email=user_email,
            user_name=user_name,
            project_name=project_name,
            amount=str(amount),
            language=language,
        )
        logger.info(f"Payment failed email sent to {user_email}")
        return result
    except Exception as exc:
        logger.error(f"Error sending payment failed email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)

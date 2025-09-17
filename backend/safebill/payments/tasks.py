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
    try:
        return EmailService.send_client_payment_success_email(
            user_email=user_email,
            user_name=user_name,
            project_name=project_name,
            amount=str(amount),
            language=language,
        )
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
    try:
        return EmailService.send_client_payment_failed_email(
            user_email=user_email,
            user_name=user_name,
            project_name=project_name,
            amount=str(amount),
            language=language,
        )
    except Exception as exc:
        logger.error(f"Error sending payment failed email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_transfer_initiated_email_task(
    self, user_email, amount, currency="EUR", language="en"
):
    try:
        message = (
            f"Your transfer of {amount} {currency} has been initiated "
            f"and is in transit."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Payout initiated",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending transfer initiated email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_transfer_paid_email_task(
    self, user_email, amount, currency="EUR", language="en"
):
    try:
        message = (
            f"Your transfer of {amount} {currency} has completed "
            f"successfully."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Payout completed",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending transfer paid email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_transfer_reversed_email_task(
    self, user_email, amount, currency="EUR", language="en"
):
    try:
        message = (
            f"Your transfer of {amount} {currency} was reversed. "
            f"The funds have been returned to your balance."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Payout reversed",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending transfer reversed email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_refund_created_email_task(
    self, user_email, project_name, amount, language="en"
):
    try:
        message = (
            f"A refund of {amount} has been requested for project "
            f"'{project_name}'."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Refund requested",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending refund created email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_refund_paid_email_task(
    self, user_email, project_name, amount, language="en"
):
    try:
        message = (
            f"Your refund of {amount} for project '{project_name}' has been "
            f"processed."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Refund processed",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending refund paid email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_refund_failed_email_task(
    self, user_email, project_name, amount, language="en"
):
    try:
        message = (
            f"Your refund of {amount} for project '{project_name}' could not be "
            f"processed."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Refund failed",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending refund failed email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)

@shared_task(bind=True, max_retries=3)
def send_hold_released_email_task(self, user_email, amount, language="en"):
    try:
        message = (
            f"Good news! {amount} has been released from hold and is now "
            f"available for payout."
        )
        return EmailService.send_notification_email(
            user_email=user_email,
            user_name=user_email,
            notification_title="Funds available for payout",
            notification_message=message,
        )
    except Exception as exc:
        logger.error(f"Error sending hold released email: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)



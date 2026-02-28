from .services import NotificationService
from django.contrib.auth import get_user_model

User = get_user_model()


def send_notification(user, message, notification_type=None):
    """
    Utility function to send a notification to a user

    Args:
        user: User instance or user ID
        message: Notification message
        notification_type: Optional notification type for future use

    Returns:
        Notification instance
    """
    return NotificationService.create_notification(user, message, notification_type)


def send_project_notification(project, message, notification_type=None):
    """
    Send notification to both project owner and client

    Args:
        project: Project instance
        message: Notification message
        notification_type: Optional notification type

    Returns:
        List of created notifications
    """
    notifications = []

    # Send to project owner (seller)
    if project.user:
        notifications.append(
            NotificationService.create_notification(
                project.user, message, notification_type
            )
        )

    # Send to project client (buyer)
    if project.client:
        notifications.append(
            NotificationService.create_notification(
                project.client, message, notification_type
            )
        )

    return notifications


def send_quote_notification(quote, message, notification_type=None):
    """
    Send notification related to a quote

    Args:
        quote: Quote instance
        message: Notification message
        notification_type: Optional notification type

    Returns:
        Notification instance
    """
    # Send to the quote owner (buyer)
    return NotificationService.create_notification(
        quote.user, message, notification_type
    )


def send_payment_notification(payment, message, notification_type=None):
    """
    Send notification related to a payment

    Args:
        payment: Payment instance
        message: Notification message
        notification_type: Optional notification type

    Returns:
        List of created notifications
    """
    notifications = []

    # Send to both parties involved in the payment
    if hasattr(payment, "project"):
        project = payment.project
        if project.user:
            notifications.append(
                NotificationService.create_notification(
                    project.user, message, notification_type
                )
            )
        if project.client:
            notifications.append(
                NotificationService.create_notification(
                    project.client, message, notification_type
                )
            )

    return notifications

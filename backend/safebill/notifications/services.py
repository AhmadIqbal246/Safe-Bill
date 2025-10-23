from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class NotificationService:
    """Service for managing notifications and WebSocket communication"""

    @staticmethod
    def create_notification(user, message, notification_type=None, **kwargs):
        """
        Create a new notification and send it via WebSocket

        Args:
            user: User instance or user ID
            message: Notification message (can be translation key or plain text)
            notification_type: Optional notification type for future use
            **kwargs: Variables for message formatting (e.g., project_name, amount)

        Returns:
            Notification instance
        """
        # Handle both User instance and user ID
        if isinstance(user, int):
            user = User.objects.get(id=user)

        # Check if message is a project-related translation key
        if (message.startswith('notifications.project_') or 
            message.startswith('notifications.payment_') or 
            message.startswith('notifications.milestone_') or
            message.startswith('notifications.stripe_') or
            message.startswith('notifications.identity_') or
            message.startswith('notifications.funds_') or
            message.startswith('notifications.transfer_') or
            message.startswith('notifications.dispute_') or
            message.startswith('notifications.refund_')):
            # Store translation key and variables in dedicated fields
            notification = Notification.objects.create(
                user=user,
                message=message,  # Store the translation key as message for backward compatibility
                translation_key=message,  # Store in dedicated field
                translation_variables=kwargs  # Store variables in dedicated field
            )
        else:
            # Store plain text (backward compatibility)
            notification = Notification.objects.create(
                user=user,
                message=message
            )

        # Send via WebSocket
        NotificationService.send_notification_websocket(notification)

        return notification

    @staticmethod
    def send_notification_websocket(notification):
        """
        Send notification via WebSocket to the user

        Args:
            notification: Notification instance
        """
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"notifications_{notification.user.id}"

            # Send the notification data
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "new_notification",
                    "notification": {
                        "id": notification.id,
                        "message": notification.message,
                        "translation_key": getattr(notification, "translation_key", None),
                        "translation_variables": getattr(notification, "translation_variables", None),
                        "created_at": notification.created_at.isoformat(),
                        "is_read": notification.is_read,
                    },
                },
            )

    @staticmethod
    def mark_notification_read(notification_id, user):
        """
        Mark a notification as read and notify via WebSocket

        Args:
            notification_id: ID of the notification
            user: User instance or user ID

        Returns:
            Updated notification instance or None
        """
        # Handle both User instance and user ID
        if isinstance(user, int):
            user = User.objects.get(id=user)

        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.is_read = True
            notification.save()

            # Send update via WebSocket
            NotificationService.send_notification_update_websocket(notification)

            return notification
        except Notification.DoesNotExist:
            return None

    @staticmethod
    def mark_all_notifications_read(user):
        """
        Mark all notifications as read for a user and notify via WebSocket

        Args:
            user: User instance or user ID

        Returns:
            Number of notifications updated
        """
        # Handle both User instance and user ID
        if isinstance(user, int):
            user = User.objects.get(id=user)

        updated_count = Notification.objects.filter(user=user, is_read=False).update(
            is_read=True
        )

        # Send update via WebSocket
        if updated_count > 0:
            NotificationService.send_all_read_websocket(user, updated_count)

        return updated_count

    @staticmethod
    def send_notification_update_websocket(notification):
        """
        Send notification update via WebSocket

        Args:
            notification: Notification instance
        """
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"notifications_{notification.user.id}"

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "notification_updated",
                    "notification": {
                        "id": notification.id,
                        "message": notification.message,
                        "translation_key": getattr(notification, "translation_key", None),
                        "translation_variables": getattr(notification, "translation_variables", None),
                        "created_at": notification.created_at.isoformat(),
                        "is_read": notification.is_read,
                    },
                },
            )

    @staticmethod
    def send_all_read_websocket(user, updated_count):
        """
        Send all notifications read update via WebSocket

        Args:
            user: User instance or user ID
            updated_count: Number of notifications that were marked as read
        """
        # Handle both User instance and user ID
        if isinstance(user, int):
            user = User.objects.get(id=user)

        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"notifications_{user.id}"

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "all_notifications_marked_read",
                    "updated_count": updated_count,
                },
            )

    @staticmethod
    def get_user_notifications(user, limit=20, unread_only=False):
        """
        Get notifications for a user

        Args:
            user: User instance or user ID
            limit: Maximum number of notifications to return
            unread_only: If True, only return unread notifications

        Returns:
            QuerySet of notifications
        """
        # Handle both User instance and user ID
        if isinstance(user, int):
            user = User.objects.get(id=user)

        queryset = Notification.objects.filter(user=user)

        if unread_only:
            queryset = queryset.filter(is_read=False)

        return queryset.order_by("-created_at")[:limit]

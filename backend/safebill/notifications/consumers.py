from urllib.parse import parse_qs
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Notification

User = get_user_model()


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""

    async def connect(self):
        # Authenticate user via JWT token in query string
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]
        self.user = None

        if token:
            try:
                access = AccessToken(token)
                self.user = await database_sync_to_async(User.objects.get)(
                    id=access["user_id"]
                )
            except Exception:
                pass

        if not self.user:
            await self.close()
            return

        # Create user-specific group for notifications
        self.group_name = f"notifications_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send any unread notifications on connection
        await self.send_unread_notifications()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")

        if event_type == "mark_notification_read":
            notification_id = content.get("notification_id")
            await self.mark_notification_read(notification_id)
        elif event_type == "mark_all_read":
            await self.mark_all_notifications_read()
        elif event_type == "get_notifications":
            await self.send_notifications()

    @database_sync_to_async
    def get_unread_notifications(self):
        """Get unread notifications for the user"""
        return list(
            Notification.objects.filter(user=self.user, is_read=False).order_by(
                "-created_at"
            )[:10]
        )

    @database_sync_to_async
    def get_recent_notifications(self, limit=20):
        """Get recent notifications for the user"""
        return list(
            Notification.objects.filter(user=self.user).order_by("-created_at")[:limit]
        )

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark a specific notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.is_read = True
            notification.save()
            return notification
        except Notification.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_all_as_read(self):
        """Mark all notifications as read for the user"""
        updated_count = Notification.objects.filter(
            user=self.user, is_read=False
        ).update(is_read=True)
        return updated_count

    async def send_unread_notifications(self):
        """Send unread notifications to the client"""
        notifications = await self.get_unread_notifications()
        if notifications:
            await self.send_json(
                {
                    "type": "unread_notifications",
                    "notifications": [
                        {
                            "id": n.id,
                            "message": n.message,
                            "translation_key": getattr(n, "translation_key", None),
                            "translation_variables": getattr(n, "translation_variables", None),
                            "created_at": n.created_at.isoformat(),
                            "is_read": n.is_read,
                        }
                        for n in notifications
                    ],
                }
            )

    async def send_notifications(self):
        """Send recent notifications to the client"""
        notifications = await self.get_recent_notifications()
        await self.send_json(
            {
                "type": "notifications_list",
                "notifications": [
                    {
                        "id": n.id,
                        "message": n.message,
                        "translation_key": getattr(n, "translation_key", None),
                        "translation_variables": getattr(n, "translation_variables", None),
                        "created_at": n.created_at.isoformat(),
                        "is_read": n.is_read,
                    }
                    for n in notifications
                ],
            }
        )

    async def mark_notification_read(self, notification_id):
        """Handle marking a notification as read"""
        notification = await self.mark_notification_as_read(notification_id)
        if notification:
            await self.send_json(
                {"type": "notification_marked_read", "notification_id": notification_id}
            )

    async def mark_all_notifications_read(self):
        """Handle marking all notifications as read"""
        updated_count = await self.mark_all_as_read()
        await self.send_json(
            {"type": "all_notifications_marked_read", "updated_count": updated_count}
        )

    # WebSocket event handlers for group messages
    async def new_notification(self, event):
        """Handle new notification from group"""
        await self.send_json(
            {"type": "new_notification", "notification": event["notification"]}
        )

    async def notification_updated(self, event):
        """Handle notification update from group"""
        await self.send_json(
            {"type": "notification_updated", "notification": event["notification"]}
        )

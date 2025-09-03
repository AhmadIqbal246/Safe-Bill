Notifications - Backend Usage

Overview
This module provides a Notification model, REST APIs, and a WebSocket-enabled service to deliver real-time notifications to users.

Key Modules and Imports
- Model: from .models import Notification
- Service (create/send/update via WebSocket): from .services import NotificationService
- Utility helpers (targeted sends): from .utils import send_notification, send_project_notification, send_quote_notification, send_payment_notification
- Views (REST): see views.py
- WebSocket Consumer: see consumers.py (joined under ws/notifications/)

Common Tasks
1) Create a notification (auto WebSocket push)
from notifications.services import NotificationService

notification = NotificationService.create_notification(user, "Your project was approved")

Arguments:
- user: User instance or user id
- message: string

2) Mark a specific notification as read (and broadcast update)
from notifications.services import NotificationService

NotificationService.mark_notification_read(notification_id, user)

Arguments:
- notification_id: int
- user: User instance or user id (ownership validated)

3) Mark all notifications as read for a user
from notifications.services import NotificationService

count = NotificationService.mark_all_notifications_read(user)

Arguments:
- user: User instance or user id
Returns: count of updated rows

4) Send notifications with convenience utilities
from notifications.utils import (
  send_notification,
  send_project_notification,
  send_quote_notification,
  send_payment_notification,
)

send_notification(user, "Message")
send_project_notification(project, "Message")
send_quote_notification(quote, "Message")
send_payment_notification(payment, "Message")

Notes
- All DB queries are user-scoped; WebSocket delivery uses per-user groups: notifications_{user.id}
- REST endpoints are protected by IsAuthenticated and restricted to the request.user’s notifications
- For WebSockets, the client must provide a valid JWT access token via the query string (token=...)



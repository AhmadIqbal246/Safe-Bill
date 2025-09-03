import BaseWebSocketService from "./baseWebSocketService.js";

class NotificationWebSocketService extends BaseWebSocketService {
  constructor() {
    super("Notification WebSocket");
    this.currentToken = null;
  }

  connect(token) {
    this.currentToken = token;
    const wsUrl = `${
      import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000"
    }/ws/notifications/?token=${token}`;
    super.connect(wsUrl, { token });
  }

  handleMessage(data) {
    const { type } = data;

    switch (type) {
      case "new_notification":
        if (this.messageHandlers.has("newNotification")) {
          this.messageHandlers.get("newNotification")(data.notification);
        }
        break;

      case "notification_updated":
        if (this.messageHandlers.has("notificationUpdated")) {
          this.messageHandlers.get("notificationUpdated")(data.notification);
        }
        break;

      case "all_notifications_marked_read":
        if (this.messageHandlers.has("allNotificationsMarkedRead")) {
          this.messageHandlers.get("allNotificationsMarkedRead")(
            data.updated_count
          );
        }
        break;

      case "unread_notifications":
        if (this.messageHandlers.has("unreadNotifications")) {
          this.messageHandlers.get("unreadNotifications")(data.notifications);
        }
        break;

      case "notifications_list":
        if (this.messageHandlers.has("notificationsList")) {
          this.messageHandlers.get("notificationsList")(data.notifications);
        }
        break;

      case "notification_marked_read":
        if (this.messageHandlers.has("notificationMarkedRead")) {
          this.messageHandlers.get("notificationMarkedRead")(
            data.notification_id
          );
        }
        break;

      default:
        console.log("Unknown Notification WebSocket message type:", type);
    }

    // Call parent handleMessage for generic handling
    super.handleMessage(data);
  }

  markNotificationRead(notificationId) {
    this.sendMessage("mark_notification_read", {
      notification_id: notificationId,
    });
  }

  markAllNotificationsRead() {
    this.sendMessage("mark_all_read");
  }

  getNotifications() {
    this.sendMessage("get_notifications");
  }

  onDisconnect(event) {
    // Clear token on disconnect
    this.currentToken = null;
    console.log(
      `Notification WebSocket disconnected:`,
      event.code,
      event.reason
    );
  }
}

// Create a singleton instance
const notificationWebSocketService = new NotificationWebSocketService();
export default notificationWebSocketService;

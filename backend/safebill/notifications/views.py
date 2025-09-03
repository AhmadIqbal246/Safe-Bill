from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )


class NotificationMarkReadAPIView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Notification.objects.all()
    http_method_names = ["patch"]

    def get_queryset(self):
        # Only allow the user to mark their own notifications as read
        return Notification.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        # Use the service to mark notification as read with WebSocket support
        notification = serializer.save(is_read=True)
        NotificationService.send_notification_update_websocket(notification)


class MarkAllNotificationsReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        # Use the service to mark all notifications as read with WebSocket support
        updated = NotificationService.mark_all_notifications_read(user)
        return Response(
            {"detail": f"{updated} notifications marked as read."},
            status=status.HTTP_200_OK,
        )

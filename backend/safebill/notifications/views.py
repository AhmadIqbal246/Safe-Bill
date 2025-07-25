from rest_framework import generics, permissions
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationMarkReadAPIView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Notification.objects.all()
    http_method_names = ['patch']

    def get_queryset(self):
        # Only allow the user to mark their own notifications as read
        return Notification.objects.filter(user=self.request.user)

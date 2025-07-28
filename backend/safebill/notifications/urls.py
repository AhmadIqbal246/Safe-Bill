from django.urls import path
from .views import (
    NotificationListAPIView,
    NotificationMarkReadAPIView,
    MarkAllNotificationsReadAPIView,
)

urlpatterns = [
    path('', NotificationListAPIView.as_view(), name='notification-list'),
    path(
        '<int:pk>/read/',
        NotificationMarkReadAPIView.as_view(),
        name='notification-mark-read',
    ),
    path(
        'mark-all-read/',
        MarkAllNotificationsReadAPIView.as_view(),
        name='notifications-mark-all-read',
    ),
] 
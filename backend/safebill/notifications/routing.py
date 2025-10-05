from django.urls import path
from .consumers import NotificationConsumer

websocket_urlpatterns = [
    path("ws/notifications/", NotificationConsumer.as_asgi()),
    # Accept non-prefixed path to avoid 404s from mismatched client routes, it shouldn't be causing any issues but just for production safety
    path("notifications/", NotificationConsumer.as_asgi()),
]

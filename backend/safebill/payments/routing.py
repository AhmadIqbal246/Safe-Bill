from django.urls import path
from .consumers import PaymentStatusConsumer

websocket_urlpatterns = [
    path("ws/payments/status/", PaymentStatusConsumer.as_asgi()),
]

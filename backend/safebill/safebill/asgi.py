"""
ASGI config for safebill project with Channels support.
"""

import os
import django

# Set up Django settings before importing anything else
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "safebill.settings")
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Import routing after Django setup
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from payments.routing import websocket_urlpatterns as payment_websocket_urlpatterns
from notifications.routing import (
    websocket_urlpatterns as notification_websocket_urlpatterns,
)

# Combine all WebSocket URL patterns
websocket_urlpatterns = (
    chat_websocket_urlpatterns
    + payment_websocket_urlpatterns
    + notification_websocket_urlpatterns
)

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)

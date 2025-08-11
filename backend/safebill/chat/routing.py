from django.urls import path
from .consumers import ProjectChatConsumer

websocket_urlpatterns = [
    path('ws/chat/project/<int:project_id>/', ProjectChatConsumer.as_asgi()),
]
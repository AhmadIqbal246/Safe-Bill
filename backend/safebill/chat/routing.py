from django.urls import path
from .consumers import ProjectChatConsumer, TestConsumer

websocket_urlpatterns = [
    # Test route to verify WebSocket routing works
    path('ws/test/', TestConsumer.as_asgi()),
    
    # Main chat route
    path('ws/chat/project/<int:project_id>/', 
         ProjectChatConsumer.as_asgi()),
]
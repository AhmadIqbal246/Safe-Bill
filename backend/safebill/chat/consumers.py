from urllib.parse import parse_qs
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Conversation, Message, ChatContact
from projects.models import Project
from django.utils import timezone

User = get_user_model()


class TestConsumer(AsyncJsonWebsocketConsumer):
    """Simple test consumer to verify WebSocket routing works"""
    
    async def connect(self):
        print(f"TestConsumer: Attempting to connect to {self.scope['path']}")
        await self.accept()
        print("TestConsumer: Connection accepted!")
        
    async def disconnect(self, close_code):
        print(f"TestConsumer: Disconnected with code {close_code}")
        
    async def receive_json(self, content):
        print(f"TestConsumer: Received message: {content}")
        await self.send_json({
            "type": "test.response",
            "message": f"Echo: {content}"
        })


class ProjectChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.project_id = int(self.scope["url_route"]["kwargs"]["project_id"])
        # Auth via JWT in query string
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]
        self.user = None
        if token:
            try:
                access = AccessToken(token)
                self.user = await database_sync_to_async(
                    User.objects.get
                )(id=access["user_id"]) 
            except Exception:
                pass
        if not self.user:
            await self.close()
            return
        allowed = await self._user_allowed()
        if not allowed:
            await self.close()
            return
        self.group_name = f"project_chat_{self.project_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def _user_allowed(self) -> bool:
        try:
            project = Project.objects.get(id=self.project_id)
        except Project.DoesNotExist:
            return False
        return (project.user_id == self.user.id or 
                project.client_id == self.user.id)

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name, 
                self.channel_name
            )

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")
        if event_type == "send_message":
            await self._handle_send_message(content)
        elif event_type == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "typing.event", 
                    "user_id": self.user.id, 
                    "is_typing": bool(content.get("is_typing"))
                },
            )
        elif event_type == "read":
            last_id = content.get("last_read_message_id")
            await self._mark_read(last_id)
        else:
            pass

    @database_sync_to_async
    def _create_message(self, content, client_message_id):
        project = Project.objects.get(id=self.project_id)
        conv, created = Conversation.objects.get_or_create(project=project)
        if created:
            conv.participants.set([project.user_id, project.client_id])
        msg = Message.objects.create(
            conversation=conv,
            sender=self.user,
            content=content or "",
            client_message_id=client_message_id or "",
        )
        conv.last_message_at = timezone.now()
        conv.last_message_text = msg.content[:255]
        conv.save(update_fields=["last_message_at", "last_message_text"])
        
        # Update chat contacts for both participants
        if msg.content:
            conv.update_chat_contacts(msg.content, msg.created_at, self.user)
        
        return msg

    async def _handle_send_message(self, payload):
        msg = await self._create_message(
            payload.get("content"), 
            payload.get("client_message_id")
        )
        data = {
            "type": "new.message",
            "message": {
                "id": msg.id,
                "client_message_id": msg.client_message_id,
                "project": self.project_id,
                "sender": {
                    "id": self.user.id, 
                    "username": self.user.username
                },
                "content": msg.content,
                "attachment": None,
                "created_at": msg.created_at.isoformat(),
                "read_at": None,
            },
        }
        await self.channel_layer.group_send(self.group_name, data)

    @database_sync_to_async
    def _mark_all_read_up_to(self, last_id):
        if not last_id:
            return 0
        project = Project.objects.get(id=self.project_id)
        conv = Conversation.objects.get(project=project)
        
        # Mark messages as read
        updated_count = Message.objects.filter(
            conversation=conv, 
            sender__ne=self.user, 
            id__lte=last_id, 
            read_at__isnull=True
        ).update(read_at=timezone.now())
        
        # Update chat contact unread count
        if updated_count > 0:
            other_participant = conv.get_other_participant(self.user)
            if other_participant:
                try:
                    chat_contact = ChatContact.objects.get(
                        user=self.user,
                        contact=other_participant,
                        project=project
                    )
                    chat_contact.reset_unread_count()
                except ChatContact.DoesNotExist:
                    pass
        
        return updated_count

    async def _mark_read(self, last_id):
        updated = await self._mark_all_read_up_to(last_id)
        if updated:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "read.receipt", 
                    "user_id": self.user.id, 
                    "message_id": last_id, 
                    "read_at": timezone.now().isoformat()
                },
            )

    async def new_message(self, event):
        await self.send_json(event)

    async def typing_event(self, event):
        await self.send_json({"type": "typing", **event})

    async def read_receipt(self, event):
        await self.send_json({"type": "read_receipt", **event})
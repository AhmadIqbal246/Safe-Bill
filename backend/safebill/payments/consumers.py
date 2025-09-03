from urllib.parse import parse_qs
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from projects.models import Project
from .models import Payment

User = get_user_model()


class PaymentStatusConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time payment status updates"""

    async def connect(self):
        # Get token from query string
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]

        self.user = None
        self.project = None

        if token:
            try:
                # Authenticate user
                access = AccessToken(token)
                self.user = await database_sync_to_async(User.objects.get)(
                    id=access["user_id"]
                )

                # Get project from invite token
                invite_token = (query.get("invite_token") or [None])[0]
                if invite_token:
                    self.project = await database_sync_to_async(Project.objects.get)(
                        invite_token=invite_token
                    )

                    # Create group name for this project's payment status
                    self.group_name = f"payment_status_{self.project.id}"
                    await self.channel_layer.group_add(
                        self.group_name, self.channel_name
                    )
                    await self.accept()
                    return

            except Exception as e:
                print(f"Payment WebSocket authentication error: {e}")
                pass

        # If authentication fails, close connection
        await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        """Handle incoming messages from client"""
        event_type = content.get("type")

        if event_type == "get_payment_status":
            await self._send_current_payment_status()
        elif event_type == "ping":
            await self.send_json({"type": "pong"})

    @database_sync_to_async
    def _get_payment_status(self):
        """Get current payment status from database"""
        try:
            payment = Payment.objects.get(project=self.project)
            return {
                "status": payment.status,
                "amount": float(
                    payment.amount
                ),  # Convert Decimal to float for JSON serialization
                "created_at": (
                    payment.created_at.isoformat() if payment.created_at else None
                ),
                "updated_at": (
                    payment.updated_at.isoformat() if payment.updated_at else None
                ),
            }
        except Payment.DoesNotExist:
            return {"status": "pending"}

    async def _send_current_payment_status(self):
        """Send current payment status to client"""
        status_data = await self._get_payment_status()
        await self.send_json({"type": "payment_status_update", "data": status_data})

    async def payment_status_update(self, event):
        """Handle payment status updates from webhook"""
        await self.send_json({"type": "payment_status_update", "data": event["data"]})

    async def project_status_update(self, event):
        """Handle project status updates from webhook"""
        await self.send_json({"type": "project_status_update", "data": event["data"]})

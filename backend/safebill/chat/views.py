from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q, Max, Count

from .models import Conversation, Message, ChatContact
from .serializers import (
    MessageSerializer, ConversationSerializer, ChatContactSerializer
)
from projects.models import Project
from accounts.models import User


class ProjectChatPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if not project_id:
            return False
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return False
        return request.user.is_authenticated and (
            project.user_id == request.user.id or project.client_id == request.user.id
        )


class EnsureConversationMixin:
    def get_conversation(self, project_id, user):
        project = Project.objects.get(id=project_id)
        conv, created = Conversation.objects.get_or_create(project=project)
        if created:
            conv.participants.set([project.user_id, project.client_id])
        return conv


class MessageListAPIView(EnsureConversationMixin, generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectChatPermission]

    def get_queryset(self):
        project_id = self.kwargs["project_id"]
        conversation = self.get_conversation(project_id, self.request.user)
        qs = Message.objects.filter(conversation=conversation)
        before_id = self.request.query_params.get("before_id")
        if before_id:
            qs = qs.filter(id__lt=before_id)
        limit = int(self.request.query_params.get("limit", 30))
        return qs.order_by("-id")[:limit]


class MessageCreateAPIView(EnsureConversationMixin, generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectChatPermission]

    def create(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        conversation = self.get_conversation(project_id, request.user)
        # Inject sender on server side and validate content/client_message_id only
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data.get("content", ""),
            client_message_id=serializer.validated_data.get("client_message_id", ""),
        )
        conversation.last_message_at = timezone.now()
        conversation.last_message_text = message.content[:255]
        conversation.save(update_fields=["last_message_at", "last_message_text"])
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class AttachmentUploadAPIView(EnsureConversationMixin, generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectChatPermission]

    def post(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        conversation = self.get_conversation(project_id, request.user)
        file_obj = request.FILES.get("file")
        client_message_id = request.data.get("client_message_id", "")
        if not file_obj:
            return Response({"detail": "file is required"}, status=400)
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            attachment=file_obj,
            client_message_id=client_message_id,
        )
        conversation.last_message_at = timezone.now()
        conversation.last_message_text = message.content[:255]
        conversation.save(update_fields=["last_message_at", "last_message_text"])
        return Response(MessageSerializer(message).data, status=201)


class MarkReadAPIView(EnsureConversationMixin, generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, ProjectChatPermission]

    def post(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        conversation = self.get_conversation(project_id, request.user)
        last_id = request.data.get("last_read_message_id")
        if not last_id:
            return Response({"detail": "last_read_message_id required"}, status=400)
        
        # Mark messages as read
        unread_messages = (
            Message.objects
            .filter(
                conversation=conversation,
                id__lte=last_id,
                read_at__isnull=True,
            )
            .exclude(sender=request.user)
        )
        unread_messages.update(read_at=timezone.now())
        
        # Update chat contact unread count
        other_participant = conversation.get_other_participant(request.user)
        if other_participant:
            try:
                chat_contact = ChatContact.objects.get(
                    user=request.user,
                    contact=other_participant,
                    project=conversation.project
                )
                chat_contact.reset_unread_count()
            except ChatContact.DoesNotExist:
                pass
        
        return Response({"status": "ok"})


class StartQuoteChatAPIView(generics.CreateAPIView):
    """
    Create or return a lightweight hidden Project to enable chat between
    the current user (buyer) and a professional (seller). Reuses existing
    project-scoped chat infrastructure with no changes to sockets/APIs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        professional_id = kwargs.get("professional_id")
        try:
            professional = User.objects.get(id=professional_id)
        except User.DoesNotExist:
            return Response({"detail": "Professional not found"}, status=404)

        # Prevent chatting with yourself
        if professional.id == request.user.id:
            return Response({"detail": "Cannot start chat with yourself"}, status=400)

        # Determine seller/buyer roles in project fields
        # We store professional as project.user (seller), requester as client (buyer)
        seller = professional
        buyer = request.user

        # Find existing quote project between these two users (idempotent)
        existing = (
            Project.objects.filter(user=seller, client=buyer, name__startswith="Quote Chat:")
            .order_by("id")
            .first()
        )
        if existing:
            return Response({
                "project_id": existing.id,
                "project_name": existing.name,
            })

        # Create a minimal hidden project to back the chat
        project = Project.objects.create(
            user=seller,
            client=buyer,
            name=f"Quote Chat: {buyer.username} ↔ {seller.username}",
            client_email=buyer.email or "",
        )

        return Response({
            "project_id": project.id,
            "project_name": project.name,
        }, status=201)


class InboxListAPIView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .annotate(
                last_time=Max("last_message_at"),
                num_unread=Count(
                    "messages",
                    filter=Q(messages__read_at__isnull=True) & ~Q(messages__sender=self.request.user),
                ),
            )
            .order_by("-last_time")
        )


class ChatContactListAPIView(generics.ListAPIView):
    """
    Get all chat contacts for the current user (WhatsApp-like chat list).
    This shows all users the current user has chatted with through projects.
    """
    serializer_class = ChatContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatContact.objects.filter(user=user).order_by('-last_message_at')


class ChatContactDetailAPIView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific chat contact.
    """
    serializer_class = ChatContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatContact.objects.filter(user=user)


class MarkContactReadAPIView(generics.UpdateAPIView):
    """
    Mark all messages from a specific contact as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        contact_id = kwargs.get("contact_id")
        try:
            chat_contact = ChatContact.objects.get(
                id=contact_id,
                user=request.user
            )
            
            # Mark all unread messages from this contact as read
            unread_messages = Message.objects.filter(
                conversation__project=chat_contact.project,
                sender=chat_contact.contact,
                read_at__isnull=True
            )
            unread_messages.update(read_at=timezone.now())
            
            # Reset unread count for this contact
            chat_contact.reset_unread_count()
            
            return Response({"status": "ok"})
        except ChatContact.DoesNotExist:
            return Response(
                {"detail": "Chat contact not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
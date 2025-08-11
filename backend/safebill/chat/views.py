from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q, Max, Count

from .models import Conversation, Message
from .serializers import MessageSerializer, ConversationSerializer
from projects.models import Project


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
        Message.objects.filter(
            conversation=conversation,
            sender__ne=request.user,
            id__lte=last_id,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"status": "ok"})


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
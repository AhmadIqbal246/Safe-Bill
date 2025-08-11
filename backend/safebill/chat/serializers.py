from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "client_message_id",
            "sender",
            "sender_name",
            "content",
            "attachment",
            "created_at",
            "read_at",
        ]
        read_only_fields = ["id", "created_at", "read_at", "sender_name", "sender"]


class ConversationSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "project_id", "last_message_at", "last_message_text"]
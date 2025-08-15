from rest_framework import serializers
from .models import Conversation, Message, ChatContact
from accounts.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for chat contacts"""
    role_display = serializers.CharField(
        source='get_role_display', 
        read_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 
            'role_display', 'first_name', 'last_name', 
            'profile_pic'
        ]


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    sender_info = UserBasicSerializer(source="sender", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "client_message_id",
            "sender",
            "sender_name",
            "sender_info",
            "content",
            "attachment",
            "created_at",
            "read_at",
        ]
        read_only_fields = [
            "id", "created_at", "read_at", "sender_name", 
            "sender_info", "sender"
        ]


class ConversationSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    other_participant = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "project_id", "project_name", "last_message_at", 
            "last_message_text", "other_participant", "unread_count"
        ]

    def get_other_participant(self, obj):
        """Get the other participant in this conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return UserBasicSerializer(other_user).data
        return None

    def get_unread_count(self, obj):
        """Get unread message count for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(
                sender__ne=request.user,
                read_at__isnull=True
            ).count()
        return 0


class ChatContactSerializer(serializers.ModelSerializer):
    """Serializer for chat contacts (WhatsApp-like chat list)"""
    contact_info = UserBasicSerializer(source="contact", read_only=True)
    project_info = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatContact
        fields = [
            "id", "contact_info", "project_info", "last_message_at",
            "last_message_text", "last_message_preview", "unread_count", 
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_project_info(self, obj):
        """Get basic project information"""
        return {
            "id": obj.project.id,
            "name": obj.project.name,
            "created_at": obj.project.created_at
        }

    def get_last_message_preview(self, obj):
        """Get a preview of the last message"""
        if obj.last_message_text:
            if len(obj.last_message_text) > 50:
                return obj.last_message_text[:50] + "..."
            return obj.last_message_text
        return "No messages yet"
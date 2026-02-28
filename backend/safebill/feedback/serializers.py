from rest_framework import serializers
from django.core.validators import EmailValidator
from .models import Feedback, QuoteRequest, ContactMessage, CallbackRequest


class FeedbackSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[EmailValidator(
            message="Please enter a valid email address."
        )]
    )

    def validate_email(self, value):
        """
        Validate that the email is properly formatted and can be used
        for sending emails.
        """
        if not value:
            raise serializers.ValidationError("Email is required.")

        # Check for common invalid email patterns
        if value.startswith('.') or value.endswith('.'):
            raise serializers.ValidationError(
                "Email cannot start or end with a dot."
            )

        if '..' in value:
            raise serializers.ValidationError(
                "Email cannot contain consecutive dots."
            )

        if len(value) > 254:  # RFC 5321 limit
            raise serializers.ValidationError("Email address is too long.")

        # Basic domain validation
        if '@' not in value or value.count('@') != 1:
            raise serializers.ValidationError(
                "Please enter a valid email address."
            )

        local_part, domain = value.split('@')
        if not local_part or not domain:
            raise serializers.ValidationError(
                "Please enter a valid email address."
            )

        if len(local_part) > 64 or len(domain) > 253:
            raise serializers.ValidationError("Email address is too long.")

        return value

    class Meta:
        model = Feedback
        fields = ['id', 'email', 'feedback', 'created_at']
        read_only_fields = ['id', 'created_at']


class QuoteRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteRequest
        fields = [
            'id', 'from_email', 'to_email', 'subject', 'body',
            'professional_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class CallbackRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallbackRequest
        fields = [
            'id', 'company_name', 'siret_number', 'first_name', 'last_name',
            'email', 'phone', 'role', 'source', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'source', 'created_at']
from rest_framework import serializers
from .models import Project, Quote, PaymentInstallment, Milestone
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
import secrets
from utils.email_service import EmailService
from django.conf import settings
from notifications.models import Notification


class PaymentInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInstallment
        fields = ['amount', 'step', 'description']


class QuoteSerializer(serializers.ModelSerializer):
    reference_number = serializers.CharField(read_only=True)

    class Meta:
        model = Quote
        fields = ['file', 'reference_number']


class MilestoneSerializer(serializers.ModelSerializer):
    created_date = serializers.DateTimeField(
        format="%Y-%m-%d %H:%M:%S", 
        read_only=True
    )
    completion_date = serializers.DateTimeField(
        format="%Y-%m-%d %H:%M:%S", 
        required=False
    )

    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'name', 'description', 'supporting_doc',
            'completion_notice', 'review_comment', 'created_date', 'completion_date',
            'status', 'relative_payment'
        ]
        read_only_fields = ['id', 'created_date']


class MilestoneUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating milestones and their corresponding installments
    """
    created_date = serializers.DateTimeField(
        format="%Y-%m-%d %H:%M:%S", 
        read_only=True
    )
    completion_date = serializers.DateTimeField(
        format="%Y-%m-%d %H:%M:%S", 
        required=False
    )

    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'name', 'description', 'supporting_doc',
            'completion_notice', 'review_comment', 'created_date', 'completion_date',
            'status', 'relative_payment'
        ]
        read_only_fields = ['id', 'created_date', 'project']

    def update(self, instance, validated_data):
        # Update milestone fields
        milestone = super().update(instance, validated_data)
        
        # Update corresponding installment if it exists
        if milestone.related_installment:
            installment = milestone.related_installment
            
            # Update installment fields that correspond to milestone fields
            if 'name' in validated_data:
                installment.step = validated_data['name']
            if 'description' in validated_data:
                installment.description = validated_data['description']
            if 'relative_payment' in validated_data:
                installment.amount = validated_data['relative_payment']
            
            installment.save()
        
        return milestone


class ProjectCreateSerializer(serializers.ModelSerializer):
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)

    class Meta:
        model = Project
        fields = ['name', 'client_email', 'quote', 'installments']

    def create(self, validated_data):
        user = self.context['request'].user
        quote_data = validated_data.pop('quote', {})
        installments_data = validated_data.pop('installments')
        # Generate secure invite token and expiry
        invite_token = secrets.token_urlsafe(32)
        invite_token_expiry = timezone.now() + timedelta(days=2)
        project = Project.objects.create(
            user=user,
            invite_token=invite_token,
            invite_token_expiry=invite_token_expiry,
            **validated_data
        )
        # Generate reference number: QT-2024-XXX
        ref_number = (
            f"QT-2024-"
            f"{get_random_string(3, '0123456789')}{project.pk}"
        )
        Quote.objects.create(
            project=project, reference_number=ref_number, **quote_data
        )
        
        # Create installments and corresponding milestones
        for inst in installments_data:
            # Create the payment installment
            installment = PaymentInstallment.objects.create(project=project, **inst)
            
            # Create milestone based on the installment
            Milestone.objects.create(
                project=project,
                related_installment=installment,  # Link to the installment
                name=inst['step'],  # Use step as milestone name
                description=inst['description'],  # Use description as
                relative_payment=inst['amount'],  # Use amount as relative
                status='not_submitted',  # Default status
                # Other fields will be empty and can be edited later
            )
        
        # Send invite email to client using EmailService
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        invite_link = f"{frontend_url}/project-invite?token={invite_token}"
        
        try:
            EmailService.send_project_invitation_email(
                client_email=project.client_email,
                project_name=project.name,
                invitation_url=invite_link,
                invitation_token=invite_token
            )
        except Exception as e:
            # Log the error but don't fail project creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"Failed to send project invitation email to "
                f"{project.client_email}: {str(e)}"
            )
        # Create notification for the user
        Notification.objects.create(
            user=user,
            message=f"New project '{project.name}' created."
        )
        return project

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = instance.id
        return data


class ProjectListSerializer(serializers.ModelSerializer):
    reference_number = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'client_email', 'client', 'quote', 'installments',
            'reference_number', 'total_amount', 'created_at', 'status', 'project_type'
        ]

    def get_reference_number(self, obj):
        if hasattr(obj, 'quote') and obj.quote:
            return obj.quote.reference_number
        return None

    def get_total_amount(self, obj):
        return sum(float(inst.amount) for inst in obj.installments.all())


class ClientProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for projects where the current user is the client
    """
    reference_number = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    seller_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'seller_name', 'quote', 'installments', 'milestones',
            'reference_number', 'total_amount', 'created_at', 'status', 'project_type'
        ]

    def get_reference_number(self, obj):
        if hasattr(obj, 'quote') and obj.quote:
            return obj.quote.reference_number
        return None

    def get_total_amount(self, obj):
        return sum(float(inst.amount) for inst in obj.installments.all())
 
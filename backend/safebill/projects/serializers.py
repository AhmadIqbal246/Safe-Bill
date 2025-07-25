from rest_framework import serializers
from .models import Project, Quote, PaymentInstallment
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
import secrets
from django.core.mail import send_mail
from django.conf import settings


class PaymentInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInstallment
        fields = ['amount', 'step', 'description']


class QuoteSerializer(serializers.ModelSerializer):
    reference_number = serializers.CharField(read_only=True)

    class Meta:
        model = Quote
        fields = ['file', 'reference_number']


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
        for inst in installments_data:
            PaymentInstallment.objects.create(project=project, **inst)
        # Send invite email to client
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        invite_link = f"{frontend_url}/project-invite?token={invite_token}"
        send_mail(
            subject='You have been invited to view your project',
            message=(
                'Hello,\n\nA new project has been created for you on SafeBill. '
                'Please use the following secure link to view your project '
                'details:'
                '\n' + f'{invite_link}' +
                '\n\nThis link will expire in 2 days.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[project.client_email],
            fail_silently=True,
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
            'id', 'name', 'client_email', 'quote', 'installments',
            'reference_number', 'total_amount', 'created_at'
        ]

    def get_reference_number(self, obj):
        if hasattr(obj, 'quote') and obj.quote:
            return obj.quote.reference_number
        return None

    def get_total_amount(self, obj):
        return sum(float(inst.amount) for inst in obj.installments.all())
 
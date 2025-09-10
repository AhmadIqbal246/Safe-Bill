from rest_framework import serializers
from .models import Project, Quote, PaymentInstallment, Milestone
from payments.models import Payment
from decimal import Decimal
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
import secrets
from utils.email_service import EmailService
from django.conf import settings
from notifications.models import Notification
from django.db.models import Sum


class PaymentInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInstallment
        fields = ["amount", "step", "description"]


class QuoteSerializer(serializers.ModelSerializer):
    reference_number = serializers.CharField(read_only=True)

    class Meta:
        model = Quote
        fields = ["file", "reference_number"]


class MilestoneSerializer(serializers.ModelSerializer):
    created_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    completion_date = serializers.DateTimeField(
        format="%Y-%m-%d %H:%M:%S", required=False
    )
    related_installment = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Milestone
        fields = [
            "id",
            "project",
            "name",
            "description",
            "supporting_doc",
            "completion_notice",
            "review_comment",
            "created_date",
            "completion_date",
            "status",
            "relative_payment",
            "related_installment",
        ]
        read_only_fields = ["id", "created_date"]


class MilestoneUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating milestones and their corresponding installments
    """

    created_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    completion_date = serializers.DateTimeField(
        format="%Y-%m-%d %H:%M:%S", required=False
    )

    class Meta:
        model = Milestone
        fields = [
            "id",
            "project",
            "name",
            "description",
            "supporting_doc",
            "completion_notice",
            "review_comment",
            "created_date",
            "completion_date",
            "status",
            "relative_payment",
        ]
        read_only_fields = ["id", "created_date", "project"]

    def update(self, instance, validated_data):
        project = instance.project

        # Validate milestone amount within paid amount limit if changing
        if "relative_payment" in validated_data:
            try:
                total_paid = (
                    Payment.objects.filter(project=project, status="paid")
                    .values_list("amount", flat=True)
                )
                total_paid_amount = sum((Decimal(str(a)) for a in total_paid), Decimal("0"))
            except Exception:
                total_paid_amount = Decimal("0")

            # Sum of other milestones (excluding current one)
            other_total = (
                project.milestones.exclude(id=instance.id)
                .values_list("relative_payment", flat=True)
            )
            other_total_amount = sum((Decimal(str(a)) for a in other_total), Decimal("0"))

            new_relative_payment = Decimal(str(validated_data.get("relative_payment")))

            # Enforce: total milestones amount must not exceed amount paid by buyer
            if other_total_amount + new_relative_payment > total_paid_amount:
                print(other_total_amount + new_relative_payment)
                print("Buyer Paid:", total_paid_amount)
                raise serializers.ValidationError(
                    {
                        "relative_payment": [
                            "Milestones total cannot exceed buyer-paid amount."
                        ]
                    }
                )

        # Update milestone fields
        milestone = super().update(instance, validated_data)

        # Update corresponding installment if it exists
        if milestone.related_installment:
            installment = milestone.related_installment

            # Update installment fields that correspond to milestone fields
            if "name" in validated_data:
                installment.step = validated_data["name"]
            if "description" in validated_data:
                installment.description = validated_data["description"]
            if "relative_payment" in validated_data:
                installment.amount = validated_data["relative_payment"]

            installment.save()

        # If amount changed, compute and persist refundable_amount on the project
        if "relative_payment" in validated_data:
            try:
                # i) amount paid for the project by the buyer
                total_paid_amount = (
                    Payment.objects.filter(project=project, status="paid")
                    .aggregate(total_amount=Sum("amount"))
                    .get("total_amount")
                    or Decimal("0")
                )
                total_paid_amount = Decimal(str(total_paid_amount))

                # ii) paid_amount: cumulative of approved milestones
                approved_sum = (
                    project.milestones.filter(status="approved")
                    .aggregate(total=Sum("relative_payment"))
                    .get("total")
                    or Decimal("0")
                )
                approved_sum = Decimal(str(approved_sum))

                # iii) new_amount = amount - paid_amount
                new_amount = total_paid_amount - approved_sum

                # iv) un_paid_amount: milestones status other than approved
                unapproved_sum = (
                    project.milestones.exclude(status="approved")
                    .aggregate(total=Sum("relative_payment"))
                    .get("total")
                    or Decimal("0")
                )
                unapproved_sum = Decimal(str(unapproved_sum))

                # v) refundable_amount = new_amount - un_paid_amount
                refundable_amount = new_amount - unapproved_sum
                if refundable_amount < Decimal("0"):
                    refundable_amount = Decimal("0")

                # Persist on project
                project.refundable_amount = refundable_amount
                project.save(update_fields=["refundable_amount"])
            except Exception:
                # Do not fail milestone update if refund calc errs
                pass

        return milestone


class ProjectCreateSerializer(serializers.ModelSerializer):
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)

    class Meta:
        model = Project
        fields = ["name", "client_email", "quote", "installments"]

    def create(self, validated_data):
        user = self.context["request"].user
        quote_data = validated_data.pop("quote", {})
        installments_data = validated_data.pop("installments")
        # Generate secure invite token and expiry
        invite_token = secrets.token_urlsafe(32)
        invite_token_expiry = timezone.now() + timedelta(days=2)
        project = Project.objects.create(
            user=user,
            invite_token=invite_token,
            invite_token_expiry=invite_token_expiry,
            **validated_data,
        )
        # Generate reference number: QT-2024-XXX
        ref_number = f"QT-2024-" f"{get_random_string(3, '0123456789')}{project.pk}"
        Quote.objects.create(project=project, reference_number=ref_number, **quote_data)

        # Create installments and corresponding milestones
        for inst in installments_data:
            # Create the payment installment
            installment = PaymentInstallment.objects.create(project=project, **inst)

            # Create milestone based on the installment
            Milestone.objects.create(
                project=project,
                related_installment=installment,  # Link to the installment
                name=inst["step"],  # Use step as milestone name
                description=inst["description"],  # Use description as
                relative_payment=inst["amount"],  # Use amount as relative
                status="not_submitted",  # Default status
                # Other fields will be empty and can be edited later
            )

        # Send invite email to client using EmailService
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        invite_link = f"{frontend_url}/project-invite?token={invite_token}"

        try:
            # Try to infer language from request header if available
            req = self.context.get("request")
            preferred_lang = None
            if req is not None:
                preferred_lang = req.headers.get("X-User-Language") or req.META.get("HTTP_ACCEPT_LANGUAGE")
            EmailService.send_project_invitation_email(
                client_email=project.client_email,
                project_name=project.name,
                invitation_url=invite_link,
                invitation_token=invite_token,
                language=(preferred_lang.split(",")[0] if preferred_lang else "en"),
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
            user=user, message=f"New project '{project.name}' created."
        )
        return project

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = instance.id
        return data


class ProjectListSerializer(serializers.ModelSerializer):
    reference_number = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    approved_milestones = serializers.SerializerMethodField()
    total_milestones = serializers.SerializerMethodField()
    progress_pct = serializers.SerializerMethodField()
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "client_email",
            "client",
            "quote",
            "installments",
            "reference_number",
            "total_amount",
            "created_at",
            "status",
            "project_type",
            "invite_token",
            "approved_milestones",
            "total_milestones",
            "progress_pct",
        ]

    def get_reference_number(self, obj):
        if hasattr(obj, "quote") and obj.quote:
            return obj.quote.reference_number
        return None

    def get_total_amount(self, obj):
        return sum(float(inst.amount) for inst in obj.installments.all())

    def get_approved_milestones(self, obj):
        try:
            return obj.milestones.filter(status="approved").count()
        except Exception:
            return 0

    def get_total_milestones(self, obj):
        try:
            return obj.milestones.count()
        except Exception:
            return 0

    def get_progress_pct(self, obj):
        total = self.get_total_milestones(obj)
        if not total:
            return 0
        approved = self.get_approved_milestones(obj)
        pct = round((approved / total) * 100)
        return max(0, min(100, pct))


class ClientProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for projects where the current user is the client
    """

    reference_number = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    approved_milestones = serializers.SerializerMethodField()
    total_milestones = serializers.SerializerMethodField()
    progress_pct = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    seller_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "seller_name",
            "quote",
            "installments",
            "milestones",
            "reference_number",
            "total_amount",
            "created_at",
            "status",
            "project_type",
            "invite_token",
            "approved_milestones",
            "total_milestones",
            "progress_pct",
        ]

    def get_reference_number(self, obj):
        if hasattr(obj, "quote") and obj.quote:
            return obj.quote.reference_number
        return None

    def get_total_amount(self, obj):
        return sum(float(inst.amount) for inst in obj.installments.all())

    def get_approved_milestones(self, obj):
        try:
            return obj.milestones.filter(status="approved").count()
        except Exception:
            return 0

    def get_total_milestones(self, obj):
        try:
            return obj.milestones.count()
        except Exception:
            return 0

    def get_progress_pct(self, obj):
        total = self.get_total_milestones(obj)
        if not total:
            return 0
        approved = self.get_approved_milestones(obj)
        pct = round((approved / total) * 100)
        return max(0, min(100, pct))

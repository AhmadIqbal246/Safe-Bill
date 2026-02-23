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
from notifications.services import NotificationService
from django.db.models import Sum
from .tasks import send_project_invitation_email_task
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

# HubSpot syncing is now handled automatically by Django signals
class PaymentInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInstallment
        fields = ["amount", "step", "description"]


class QuoteSerializer(serializers.ModelSerializer):
    reference_number = serializers.CharField(read_only=True)

    class Meta:
        model = Quote
        fields = ["file", "reference_number"]

    def validate_file(self, value):
        """
        Validate that the uploaded file is either a PDF or an image.
        """
        if value:
            # Check file extension
            allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']
            file_name = value.name.lower()
            if not any(file_name.endswith(ext) for ext in allowed_extensions):
                raise serializers.ValidationError(
                    "Only PDF and image files (JPEG, PNG, WEBP) are allowed."
                )
            # Check MIME type if available
            if hasattr(value, 'content_type'):
                allowed_types = [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp'
                ]
                if value.content_type not in allowed_types:
                    raise serializers.ValidationError(
                        "Only PDF and image files (JPEG, PNG, WEBP) are allowed."
                    )
        return value


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
        old_status = instance.status

        # Validate milestone amount within paid amount limit if changing
        if "relative_payment" in validated_data:
            try:
                total_paid = Payment.objects.filter(
                    project=project, status="paid"
                ).values_list("amount", flat=True)
                total_paid_amount = sum(
                    (Decimal(str(a)) for a in total_paid), Decimal("0")
                )
            except Exception:
                total_paid_amount = Decimal("0")

            # Sum of other milestones (excluding current one)
            other_total = project.milestones.exclude(id=instance.id).values_list(
                "relative_payment", flat=True
            )
            other_total_amount = sum(
                (Decimal(str(a)) for a in other_total), Decimal("0")
            )

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

        # Check if milestone just entered pending state and notify buyer
        if milestone.status == "pending" and old_status != "pending":
            try:
                from projects.tasks import send_milestone_approval_request_email_task
                
                if project.client and project.client.email:
                    # Get language from request context if available
                    request = self.context.get('request')
                    if request:
                        preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
                        language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
                    else:
                        language = "fr"  # Default to French
                    
                    buyer_name = (
                        getattr(project.client, "username", None)
                        or project.client.email.split("@")[0]
                    )
                    
                    send_milestone_approval_request_email_task.delay(
                        user_email=project.client.email,
                        user_name=buyer_name,
                        project_name=project.name,
                        milestone_name=milestone.name,
                        amount=str(milestone.relative_payment),
                        language=language,
                    )
            except Exception as e:
                # Do not fail milestone update if email cannot be sent
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send milestone approval email for milestone {milestone.id}: {e}")

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
                total_paid_amount = Payment.objects.filter(
                    project=project, status="paid"
                ).aggregate(total_amount=Sum("amount")).get("total_amount") or Decimal(
                    "0"
                )
                total_paid_amount = Decimal(str(total_paid_amount))

                # ii) paid_amount: cumulative of approved milestones
                approved_sum = project.milestones.filter(status="approved").aggregate(
                    total=Sum("relative_payment")
                ).get("total") or Decimal("0")
                approved_sum = Decimal(str(approved_sum))

                # iii) new_amount = amount - paid_amount
                new_amount = total_paid_amount - approved_sum

                # iv) un_paid_amount: milestones status other than approved
                unapproved_sum = project.milestones.exclude(
                    status="approved"
                ).aggregate(total=Sum("relative_payment")).get("total") or Decimal("0")
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
    vat_rate = serializers.DecimalField(max_digits=4, decimal_places=1, required=False)
    platform_fee_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False
    )

    class Meta:
        model = Project
        fields = [
            "name",
            "client_email",
            "quote",
            "installments",
            "vat_rate",
            "platform_fee_percentage",
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        # Added: prevent self-invite by rejecting when client_email equals seller's email
        client_email = (validated_data.get("client_email") or "").strip().lower()
        if client_email and client_email == (getattr(user, "email", "") or "").strip().lower():
            raise serializers.ValidationError({"client_email": "You cannot invite yourself as the client."})
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
        created_milestones = []
        for inst in installments_data:
            # Create the payment installment
            installment = PaymentInstallment.objects.create(project=project, **inst)
    
            # Create milestone based on the installment
            # Keep step identifier as-is (step_1, step_2, step_3) - frontend will translate
            ms = Milestone.objects.create(
                project=project,
                related_installment=installment,  # Link to the installment
                name=inst["step"],  # Store step identifier (step_1, step_2, step_3)
                description=inst["description"],  # Use description as
                relative_payment=inst["amount"],  # Use amount as relative
                status="not_submitted",  # Default status
                # Other fields will be empty and can be edited later
            )
            created_milestones.append(ms.id)
    
        # Trigger initial HubSpot deal sync AFTER installments are created
        # to ensure the full project amount is available for the deal.
        try:
            from hubspot.sync_utils import sync_project_to_hubspot
            sync_result = sync_project_to_hubspot(
                project_id=project.id,
                reason="project_created",
            )
            logger.info(f"Project {project.id} initial HubSpot sync result: {sync_result}")
        except Exception as e:
            logger.error(f"Failed to trigger initial HubSpot sync for project {project.id}: {e}")

        # Send invite email to client asynchronously via Celery
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        invite_link = f"{frontend_url}/project-invite?token={invite_token}"

        try:
            # Try to infer language from request header if available
            req = self.context.get("request")
            preferred_lang = None
            if req is not None:
                preferred_lang = req.headers.get("X-User-Language") or req.META.get("HTTP_ACCEPT_LANGUAGE")
            language = (preferred_lang.split(",")[0] if preferred_lang else "en")
            
            send_project_invitation_email_task.delay(
                client_email=project.client_email,
                project_name=project.name,
                invitation_url=invite_link,
                invitation_token=invite_token,
                language=language
            )
        except Exception as e:
            # Log the error but don't fail project creation
            logger.error(
                f"Failed to send project invitation email to "
                f"{project.client_email}: {str(e)}"
            )
        # Create notification for the user
        NotificationService.create_notification(
            user=user, 
            message="notifications.project_created",
            project_name=project.name
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
    completion_date = serializers.SerializerMethodField()

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
            "completion_date",
            "status",
            "project_type",
            "invite_token",
            "vat_rate",
            "platform_fee_percentage",
            "approved_milestones",
            "total_milestones",
            "progress_pct",
            "refundable_amount",
        ]

    def get_completion_date(self, obj):
        # Use the latest milestone completion_date as completion date fallback
        latest = (
            obj.milestones.filter(completion_date__isnull=False)
            .order_by("-completion_date")
            .first()
        )
        return latest.completion_date.strftime("%Y-%m-%d") if latest else None

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
            "vat_rate",
            "platform_fee_percentage",
            "approved_milestones",
            "total_milestones",
            "progress_pct",
            "refundable_amount",
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


class SellerReceiptProjectSerializer(serializers.ModelSerializer):
    """
    Serializer tailored for seller receipts with milestones and totals.
    """

    reference_number = serializers.SerializerMethodField()
    platform_invoice_reference = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    quote = QuoteSerializer()
    installments = PaymentInstallmentSerializer(many=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    completion_date = serializers.SerializerMethodField()
    seller_username = serializers.CharField(source="user.username", read_only=True)
    seller_email = serializers.EmailField(source="user.email", read_only=True)
    seller_address = serializers.SerializerMethodField()
    seller_siret = serializers.SerializerMethodField()
    seller_company = serializers.SerializerMethodField()
    seller_phone = serializers.SerializerMethodField()
    buyer_username = serializers.CharField(source="client.username", read_only=True)
    buyer_email = serializers.EmailField(source="client.email", read_only=True)
    buyer_full_name = serializers.SerializerMethodField()
    buyer_address = serializers.SerializerMethodField()
    payment_id = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_date = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "quote",
            "installments",
            "milestones",
            "reference_number",
            "platform_invoice_reference",
            "total_amount",
            "created_at",
            "completion_date",
            "status",
            "project_type",
            "vat_rate",
            "platform_fee_percentage",
            "seller_username",
            "seller_email",
            "seller_address",
            "seller_siret",
            "seller_company",
            "seller_phone",
            "buyer_username",
            "buyer_email",
            "buyer_full_name",
            "buyer_address",
            "payment_id",
            "payment_status",
            "payment_date",
        ]

    def get_reference_number(self, obj):
        if hasattr(obj, "quote") and obj.quote:
            return obj.quote.reference_number
        return None

    def get_platform_invoice_reference(self, obj):
        if hasattr(obj, "quote") and obj.quote:
            return obj.quote.platform_invoice_reference
        return None

    def get_total_amount(self, obj):
        return sum(float(inst.amount) for inst in obj.installments.all())

    def get_completion_date(self, obj):
        # Use the latest milestone completion_date as completion date fallback
        latest = (
            obj.milestones.filter(completion_date__isnull=False)
            .order_by("-completion_date")
            .first()
        )
        return latest.completion_date.strftime("%Y-%m-%d %H:%M:%S") if latest else None

    def get_payment_id(self, obj):
        """Get the Stripe payment ID for this project"""
        try:
            from payments.models import Payment
            payment = Payment.objects.filter(project=obj).order_by("-created_at").first()
            return payment.stripe_payment_id if payment else None
        except Exception:
            return None

    def get_payment_status(self, obj):
        """Get the payment status for this project"""
        try:
            from payments.models import Payment
            payment = Payment.objects.filter(project=obj).order_by("-created_at").first()
            
            # If project is completed, payment should be paid
            if obj.status == "completed" and payment:
                # Ensure payment status is consistent with project completion
                if payment.status == "pending":
                    # Log this inconsistency for debugging
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Project {obj.id} is completed but payment {payment.id} is still pending. This should not happen.")
                    # Return "paid" since completed projects imply successful payment
                    return "paid"
                return payment.status
            elif obj.status == "completed" and not payment:
                # Project is completed but no payment record - this is an error
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Project {obj.id} is completed but has no payment record. This is a data inconsistency.")
                return "paid"  # Assume paid since project is completed
            
            return payment.status if payment else None
        except Exception:
            return None

    def get_payment_date(self, obj):
        """Get the payment date for this project"""
        try:
            from payments.models import Payment
            payment = Payment.objects.filter(project=obj).order_by("-created_at").first()
            return payment.created_at.strftime("%Y-%m-%d %H:%M:%S") if payment else None
        except Exception:
            return None

    def get_seller_address(self, obj):
        """Get seller's address from business detail"""
        try:
            if hasattr(obj.user, 'business_detail') and obj.user.business_detail:
                return obj.user.business_detail.full_address
            return None
        except Exception:
            return None

    def get_seller_siret(self, obj):
        """Get seller's SIRET number from business detail"""
        try:
            if hasattr(obj.user, 'business_detail') and obj.user.business_detail:
                return obj.user.business_detail.siret_number
            return None
        except Exception:
            return None

    def get_buyer_address(self, obj):
        """Get buyer's address from buyer_profile or business_detail"""
        try:
            if obj.client:
                # Try buyer_profile first (for individual buyers)
                if hasattr(obj.client, 'buyer_profile') and obj.client.buyer_profile:
                    return obj.client.buyer_profile.address
                # Try business_detail (for professional buyers)
                elif hasattr(obj.client, 'business_detail') and obj.client.business_detail:
                    return obj.client.business_detail.full_address
            return None
        except Exception:
            return None

    def get_seller_company(self, obj):
        """Return the seller's company name if available"""
        try:
            if hasattr(obj.user, "business_detail") and obj.user.business_detail:
                return obj.user.business_detail.company_name
            return obj.user.username
        except Exception:
            return obj.user.username

    def get_seller_phone(self, obj):
        """Return the seller's phone number"""
        try:
            return obj.user.phone_number
        except Exception:
            return None

    def get_buyer_full_name(self, obj):
        """Return buyer full name preferring buyer profile names"""
        try:
            if obj.client:
                profile = getattr(obj.client, "buyer_profile", None)
                if profile and (profile.first_name or profile.last_name):
                    first = profile.first_name or ""
                    last = profile.last_name or ""
                    full = f"{first} {last}".strip()
                    return full or obj.client.username
                return obj.client.username
            return None
        except Exception:
            return None

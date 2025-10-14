from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from datetime import timedelta
from .models import Project, Quote, PaymentInstallment, Milestone
from .serializers import (
    ProjectCreateSerializer,
    ProjectListSerializer,
    ClientProjectSerializer,
    MilestoneSerializer,
    MilestoneUpdateSerializer,
    SellerReceiptProjectSerializer,
)
from notifications.models import Notification
from utils.email_service import EmailService
from django.conf import settings
import secrets
from notifications.services import NotificationService
from decimal import Decimal
from payments.services import BalanceService
from chat.models import ChatContact, Conversation
from adminpanelApp.services import RevenueService
import logging
from .tasks import (
    send_project_invitation_email_task,
    send_milestone_approval_request_email_task,
)
from django.db import transaction
# HubSpot syncing is now handled automatically by Django signals
# No need to manually import sync functions

logger = logging.getLogger(__name__)


class ProjectCreateAPIView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Check if user has seller role (supports legacy role, flags, and active_role)
        user = self.request.user
        has_seller = getattr(user, "role", None) == "seller"
        if not has_seller:
            raise PermissionDenied("Only users with seller role can create projects.")

        # Extract and process the form data
        data = {}

        # Handle regular fields
        data["name"] = (
            request.data.get("name")[0]
            if isinstance(request.data.get("name"), list)
            else request.data.get("name")
        )
        data["client_email"] = (
            request.data.get("client_email")[0]
            if isinstance(request.data.get("client_email"), list)
            else request.data.get("client_email")
        )

        # Handle installments JSON
        installments_raw = request.data.get("installments")
        if installments_raw:
            installments_str = (
                installments_raw[0]
                if isinstance(installments_raw, list)
                else installments_raw
            )
            try:
                import json

                data["installments"] = json.loads(installments_str)
            except (json.JSONDecodeError, ValueError):
                return Response({"installments": ["Invalid JSON format"]}, status=400)

        # Handle quote file
        quote_file = request.data.get("quote.file")
        if quote_file:
            file_obj = quote_file[0] if isinstance(quote_file, list) else quote_file
            data["quote"] = {"file": file_obj}
        else:
            data["quote"] = {}

        # Handle VAT rate (optional, defaults server-side)
        vat_rate_val = request.data.get("vat_rate")
        if vat_rate_val is not None and vat_rate_val != "":
            try:
                data["vat_rate"] = float(vat_rate_val)
            except (TypeError, ValueError):
                return Response({"vat_rate": ["Invalid VAT rate value"]}, status=400)

        # Handle platform fee percentage (optional, defaults server-side)
        platform_fee_pct_val = request.data.get("platform_fee_percentage")
        if platform_fee_pct_val is not None and platform_fee_pct_val != "":
            try:
                data["platform_fee_percentage"] = float(platform_fee_pct_val)
            except (TypeError, ValueError):
                return Response(
                    {
                        "platform_fee_percentage": [
                            "Invalid platform fee percentage value"
                        ]
                    },
                    status=400,
                )

        # Create serializer with processed data
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def perform_create(self, serializer):
        project = serializer.save()
        # HubSpot sync now handled automatically by Django signals in hubspot/signals.py
        # This ensures 100% reliability without manual sync calls

class ProjectListAPIView(generics.ListAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show real projects, not quote chat projects
        return Project.objects.filter(
            user=self.request.user, project_type="real_project"
        ).order_by("-id")


class ClientProjectListAPIView(generics.ListAPIView):
    """
    View for clients to list their projects
    """

    serializer_class = ClientProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client=self.request.user).order_by("-id")


class ProjectDeleteAPIView(generics.DestroyAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class ProjectStatusUpdateAPIView(APIView):
    """
    API view for updating project status from 'approved' to 'in_progress'
    Only sellers can update their own projects
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        try:
            # Get the project and verify ownership
            project = Project.objects.get(id=project_id, user=request.user)
        except Project.DoesNotExist:
            return Response(
                {
                    "detail": "Project not found or you do not have permission to modify it."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has seller role
        user_is_seller = getattr(request.user, "role", None) == "seller"
        if not user_is_seller:
            return Response(
                {"detail": "Only sellers can update project status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate current status
        if project.status != "approved":
            return Response(
                {
                    "detail": f'Project status can only be changed to "In Progress" when current status is "Approved". Current status: {project.status}'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update status to in_progress
        project.status = "in_progress"
        project.save()
        # HubSpot sync now handled automatically by Django signals

        # Create notification for the client
        if project.client:
            NotificationService.create_notification(
                project.client,
                f"Project '{project.name}' has been started and is now in progress.",
            )

        # Create notification for the seller
        NotificationService.create_notification(
            request.user,
            f"You have started project '{project.name}' and it is now in progress.",
        )

        return Response(
            {
                "detail": 'Project status updated successfully to "in_progress".',
                "new_status": "in_progress",
            },
            status=status.HTTP_200_OK,
        )


class ProjectCompletionAPIView(APIView):
    """
    API view for updating project status from 'in_progress' to 'completed'
    Only sellers can update their own projects
    Project can only be completed if all milestones are approved
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        try:
            # Get the project and verify ownership
            project = Project.objects.get(id=project_id, user=request.user)
        except Project.DoesNotExist:
            return Response(
                {
                    "detail": "Project not found or you do not have permission to modify it."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has seller role
        user_is_seller = getattr(request.user, "role", None) == "seller"
        if not user_is_seller:
            return Response(
                {"detail": "Only sellers can complete projects."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate current status
        if project.status != "in_progress":
            return Response(
                {
                    "detail": f'Project can only be completed when current status is "In Progress". Current status: {project.status}',
                    "error_type": "invalid_status",
                    "current_status": project.status,
                    "required_status": "in_progress",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if all milestones are approved
        milestones = project.milestones.all()
        if not milestones.exists():
            return Response(
                {
                    "detail": "Project cannot be completed without any milestones.",
                    "error_type": "no_milestones",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if all milestones are approved
        non_approved_milestones = milestones.exclude(status="approved")
        if non_approved_milestones.exists():
            non_approved_names = [m.name for m in non_approved_milestones]
            milestone_list = ", ".join(non_approved_names)
            return Response(
                {
                    "detail": f"Project cannot be completed. The following milestones are not approved: {milestone_list}",
                    "error_type": "milestones_not_approved",
                    "non_approved_milestones": non_approved_names,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update status to completed
        project.status = "completed"
        project.save()
        # HubSpot sync now handled automatically by Django signals

        # Create notification for the client
        if project.client:
            NotificationService.create_notification(
                project.client,
                f"Project '{project.name}' has been completed by {request.user.username}.",
            )

        # Create notification for the seller
        NotificationService.create_notification(
            request.user,
            f"You have successfully completed project '{project.name}'.",
        )

        return Response(
            {
                "detail": 'Project status updated successfully to "completed".',
                "new_status": "completed",
            },
            status=status.HTTP_200_OK,
        )


class MilestoneListAPIView(generics.ListAPIView):
    """
    List milestones for a specific project
    """

    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get("project_id")
        return Milestone.objects.filter(project_id=project_id).order_by("created_date")


class MilestoneDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a milestone
    """

    serializer_class = MilestoneUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Milestone.objects.all()

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return MilestoneUpdateSerializer
        return MilestoneSerializer

    def perform_update(self, serializer):
        """After a milestone is updated, sync is handled automatically by Django signals."""
        milestone = serializer.save()
        # HubSpot sync now handled automatically by Django signals
        # milestone.save() will trigger the milestone signal


class ProjectInviteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def check_buyer_permission(self, request):
        """Check if user has buyer role"""
        # Allow both individual buyer and professional-buyer roles
        if not (getattr(request.user, "role", None) in ["buyer", "professional-buyer"]):
            raise permissions.PermissionDenied(
                "Only users with buyer or professional-buyer role can approve/reject projects."
            )

    def get(self, request, token):
        try:
            project = Project.objects.get(invite_token=token)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired invite link."},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Check expiry
        if (
            not project.invite_token_expiry
            or project.invite_token_expiry < timezone.now()
        ):
            return Response(
                {"detail": "Invite link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check that the logged-in user's email matches the client_email
        if request.user.email.lower() != project.client_email.lower():
            return Response(
                {"detail": "You are not authorized to view this project."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Added: prevent seller self-accept/view via invite
        if getattr(project, "user_id", None) == getattr(request.user, "id", None):
            return Response({"detail": "You cannot accept your own project invite."}, status=status.HTTP_400_BAD_REQUEST)

        # Add the client to the project if not already added
        if not project.client:
            project.client = request.user
            project.invite_token_used = True
            project.save(update_fields=["client", "invite_token_used"])

            # Create chat contacts for both seller and buyer
            self._create_chat_contacts(project)

            # Create notification for the buyer
            NotificationService.create_notification(
                request.user,
                f"You have been added to the project '{project.name}' by {project.user.username}.",
            )

        # Return project details
        serializer = ProjectListSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, token):
        """
        Regenerate and resend an invite token for a project IF the previous one is expired.
        Only the project owner (seller) can request a resend.
        """
        try:
            project = Project.objects.get(invite_token=token)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Invalid invite token."}, status=status.HTTP_404_NOT_FOUND
            )

        # Only project owner can resend
        if project.user != request.user:
            return Response(
                {"detail": "You do not have permission to resend this invitation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Disallow resend if the invite has already been used
        if project.invite_token_used:
            return Response(
                {"detail": "Invitation already used by client. Cannot resend."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow resending for projects that are still pending
        if project.status != "pending":
            return Response(
                {
                    "detail": "Invitation can only be resent for projects with status 'pending'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow resend if previous token is expired
        if project.invite_token_expiry and project.invite_token_expiry > timezone.now():
            return Response(
                {"detail": "Invitation link has not expired yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate new token and expiry
        new_token = secrets.token_urlsafe(32)
        new_expiry = timezone.now() + timedelta(days=2)
        project.invite_token = new_token
        project.invite_token_expiry = new_expiry
        project.invite_token_used = False
        project.save(
            update_fields=["invite_token", "invite_token_expiry", "invite_token_used"]
        )

        # Send invite email to client asynchronously via Celery
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        invite_link = f"{frontend_url}/project-invite?token={new_token}"
        try:
            # Try to get preferred language from request header, default to 'en'
            preferred_lang = request.headers.get("X-User-Language") or request.META.get(
                "HTTP_ACCEPT_LANGUAGE", "en"
            )
            language = preferred_lang.split(",")[0][:2] if preferred_lang else "en"

            send_project_invitation_email_task.delay(
                client_email=project.client_email,
                project_name=project.name,
                invitation_url=invite_link,
                invitation_token=new_token,
                language=language,
            )
        except Exception:
            # Don't fail resend if email sending fails
            pass

        # Notify seller
        NotificationService.create_notification(
            request.user,
            f"A new invitation link has been generated for project '{project.name}'.",
        )

        return Response(
            {
                "detail": "New invitation link generated and sent.",
                "invite_token": new_token,
                "invite_token_expiry": new_expiry,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, token):
        """
        Handle client approval/rejection of the project invite
        """
        # Check buyer permissions
        self.check_buyer_permission(request)

        try:
            project = Project.objects.get(invite_token=token)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired invite link."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Ensure this is a real project, not a quote chat project
        if project.project_type != "real_project":
            return Response(
                {"detail": "This invitation is not for a real project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check expiry
        if (
            not project.invite_token_expiry
            or project.invite_token_expiry < timezone.now()
        ):
            return Response(
                {"detail": "Invite link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check that the logged-in user's email matches the client_email
        if request.user.email.lower() != project.client_email.lower():
            return Response(
                {"detail": "You are not authorized to accept this project."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Added: prevent seller from approving their own project invite
        if getattr(project, "user_id", None) == getattr(request.user, "id", None):
            return Response({"detail": "You cannot approve your own project invite."}, status=status.HTTP_400_BAD_REQUEST)

        # Get the action from request data
        action = request.data.get("action")
        if action not in ["approve", "reject", "view"]:
            return Response(
                {"detail": 'Invalid action. Must be "approve", "reject", or "view".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "view":
            # Just add the client to the project without approval
            # This allows the buyer to see pending projects on their dashboard
            if not project.client:
                project.client = request.user
                project.save()

                # Create chat contacts for both seller and buyer
                self._create_chat_contacts(project)

                # Create notification for the buyer
                Notification.objects.create(
                    user=request.user,
                    message=f"You have been added to the project '{project.name}' by {project.user.username}.",
                )

            return Response(
                {"detail": "Client added to project for viewing."},
                status=status.HTTP_200_OK,
            )
        elif action == "approve":
            # Approve the project
            project.status = "approved"
            project.client = request.user
            project.save()
            # HubSpot sync now handled automatically by Django signals
            # Project status update will trigger project sync signal automatically

            # Create chat contacts for both seller and buyer
            self._create_chat_contacts(project)

            # Create notification for the seller
            NotificationService.create_notification(
                project.user,
                f"Client {request.user.email} has approved the project '{project.name}'.",
            )

            # Create notification for the buyer
            NotificationService.create_notification(
                request.user,
                f"You have successfully approved the project '{project.name}' from {project.user.username}.",
            )

            return Response(
                {"detail": "Project approved successfully."}, status=status.HTTP_200_OK
            )
        else:
            # Reject the project
            project.status = "not_approved"
            # Remove client from project if they were added for viewing
            if project.client == request.user:
                project.client = None
            project.save()
            # HubSpot sync now handled automatically by Django signals

            # Create notification for the seller
            NotificationService.create_notification(
                project.user,
                f"Client {request.user.email} has rejected the project '{project.name}'.",
            )

            # Create notification for the buyer
            NotificationService.create_notification(
                request.user,
                f"You have rejected the project '{project.name}' from {project.user.username}.",
            )

            return Response(
                {"detail": "Project rejected successfully."}, status=status.HTTP_200_OK
            )

    def _create_chat_contacts(self, project):
        """
        Create chat contacts for both seller and buyer when a project is accepted
        """
        seller = project.user
        buyer = project.client

        if not seller or not buyer:
            return

        # Create or get conversation for this project
        conversation, created = Conversation.objects.get_or_create(
            project=project,
            defaults={
                "last_message_at": timezone.now(),
                "last_message_text": f"Project '{project.name}' started",
            },
        )

        # Add participants to conversation if not already added
        conversation.participants.add(seller, buyer)

        # Create chat contact for seller (seller sees buyer as contact)
        ChatContact.objects.get_or_create(
            user=seller,
            contact=buyer,
            project=project,
            defaults={
                "last_message_at": timezone.now(),
                "last_message_text": f"Project '{project.name}' started",
                "unread_count": 0,
            },
        )

        # Create chat contact for buyer (buyer sees seller as contact)
        ChatContact.objects.get_or_create(
            user=buyer,
            contact=seller,
            project=project,
            defaults={
                "last_message_at": timezone.now(),
                "last_message_text": f"Project '{project.name}' started",
                "unread_count": 0,
            },
        )


class MilestoneApprovalAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Approve, reject, or review a milestone.
        Expects a JSON body: {
            "action": "approve" | "not_approved" | "review_request" | "pending",
            "review_comment": "string" (optional, only for review_request)
        }
        """
        try:
            milestone = Milestone.objects.get(pk=pk)
        except Milestone.DoesNotExist:
            return Response({"detail": "Milestone not found."}, status=404)

        action_type = request.data.get("action")
        if action_type not in ["approve", "not_approved", "review_request", "pending"]:
            return Response({"detail": "Invalid action."}, status=400)

        if action_type == "approve":
            milestone.status = "approved"
            milestone.completion_date = timezone.now()

            # Get project reference
            project = milestone.project

            # Update balances when milestone is approved
            try:
                if project.user and project.client:
                    # Process milestone payment and create payout hold tied to the project
                    BalanceService.process_milestone_payment_with_project(
                        seller=project.user,
                        buyer=project.client,
                        project=project,
                        milestone_amount=milestone.relative_payment
                        + (milestone.relative_payment * project.vat_rate)
                        / Decimal("100"),
                    )
            except Exception as e:
                logger.error(
                    f"Error updating balances for milestone {milestone.id}: {e}"
                )

            # Track seller revenue when milestone is approved
            try:
                RevenueService.add_seller_revenue(
                    milestone_amount=milestone.relative_payment,
                    platform_fee_percentage=project.platform_fee_percentage,
                    vat_rate=project.vat_rate,
                )
            except Exception as e:
                logger.error(
                    f"Error tracking seller revenue for milestone {milestone.id}: {e}"
                )
                # Don't break the milestone approval flow if revenue tracking fails

        elif action_type == "not_approved":
            milestone.status = "not_approved"
            milestone.completion_date = None
        elif action_type == "review_request":
            milestone.status = "review_request"
            milestone.completion_date = None
            # Save review comment if provided
            review_comment = request.data.get("review_comment", "")
            milestone.review_comment = review_comment
        elif action_type == "pending":
            milestone.status = "pending"
            milestone.completion_date = None
            # Notify buyer of approval request
            try:
                project = milestone.project
                if project.client and project.client.email:
                    preferred_lang = self.request.headers.get(
                        "X-User-Language"
                    ) or self.request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
                    language = (
                        preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
                    )
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
            except Exception:
                # Do not fail the flow if email cannot be sent
                pass
        milestone.save()

        # If milestone was approved, check if all milestones are now approved
        if action_type == "approve":
            try:
                project = milestone.project
                # If no milestone is non-approved, mark project completed
                has_unapproved = (
                    Milestone.objects.filter(project=project)
                    .exclude(status="approved")
                    .exists()
                )
                if not has_unapproved and project.status != "completed":
                    project.status = "completed"
                    project.save(update_fields=["status"])
                    # Best-effort notifications; do not break flow on failure
                    try:
                        if project.user:
                            NotificationService.create_notification(
                                project.user,
                                f"Project '{project.name}' is now completed. Last Milestone: {milestone.name}, approved.",
                            )
                        if project.client:
                            NotificationService.create_notification(
                                project.client,
                                f"Project '{project.name}' is now completed.",
                            )
                    except Exception:
                        pass
            except Exception as e:
                logger.error(
                    (
                        "Error auto-completing project %s after milestone %s "
                        "approval: %s"
                    ),
                    getattr(milestone.project, "id", "?"),
                    getattr(milestone, "id", "?"),
                    e,
                )
        # HubSpot sync now handled automatically by Django signals
        # Milestone save() will trigger milestone signal for HubSpot sync
        # Revenue sync will be triggered automatically on project completion

        project = milestone.project
        status_msg = {
            "approve": "approved",
            "not_approved": "not approved",
            "review_request": "sent for review",
            "pending": "submitted for approval",
        }.get(action_type, milestone.status)

        # Notify seller
        if project.user:
            NotificationService.create_notification(
                project.user,
                f"Milestone '{milestone.name}' for project '{project.name}' was {status_msg}.",
            )
        # Notify buyer/client
        if project.client:
            NotificationService.create_notification(
                project.client,
                f"Milestone '{milestone.name}' for project '{project.name}' was {status_msg}.",
            )

        return Response(
            {"detail": f"Milestone status updated to {milestone.status}."}, status=200
        )


class ClientProjectsWithPendingMilestonesAPIView(generics.ListAPIView):
    """
    View for clients to list projects that have pending milestones
    """

    serializer_class = ClientProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Project.objects.filter(
                client=self.request.user, milestones__status="pending"
            )
            .distinct()
            .order_by("-id")
        )


class ClientProjectDetailAPIView(generics.RetrieveAPIView):
    """
    View for clients to get detailed project information
    """

    serializer_class = ClientProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_completed_projects(request):
    """
    Get all completed projects for the authenticated seller
    """
    user = request.user

    # Only sellers can access this endpoint
    if not (getattr(user, "role", None) == "seller"):
        return Response(
            {"detail": "Only sellers can access completed projects."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Get all completed projects for this seller
    completed_projects = Project.objects.filter(user=user, status="completed").order_by(
        "-created_at"
    )

    # Serialize the projects
    serializer = ProjectListSerializer(completed_projects, many=True)

    return Response({"projects": serializer.data, "count": completed_projects.count()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def seller_receipts(request):
    """
    Return completed projects for the authenticated seller with milestone details
    for receipts.
    """
    user = request.user
    # Allow for legacy role OR new flags/active_role
    if not (getattr(user, "role", None) == "seller"):
        return Response(
            {"detail": "Only sellers can access this endpoint."}, status=403
        )

    projects = (
        Project.objects.filter(user=user, status="completed")
        .prefetch_related("milestones", "installments", "quote")
        .order_by("-created_at")
    )
    serializer = SellerReceiptProjectSerializer(projects, many=True)
    return Response({"projects": serializer.data, "count": projects.count()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def buyer_receipts(request):
    """
    Return completed projects for the authenticated buyer with milestone details
    for receipts.
    """
    user = request.user
    # Allow both individual buyer and professional-buyer roles
    if not (getattr(user, "role", None) in ["buyer", "professional-buyer"]):
        return Response({"detail": "Only buyers can access this endpoint."}, status=403)

    projects = (
        Project.objects.filter(client=user, status="completed")
        .prefetch_related("milestones", "installments", "quote")
        .order_by("-created_at")
    )
    serializer = SellerReceiptProjectSerializer(projects, many=True)
    return Response({"projects": serializer.data, "count": projects.count()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_expired_project_invites(request):
    """
    List projects for the authenticated seller that have expired invite tokens.
    """
    user = request.user
    # Only sellers can access this endpoint
    if not (getattr(user, "role", None) == "seller"):
        return Response(
            {"detail": "Only sellers can access expired invitations."},
            status=status.HTTP_403_FORBIDDEN,
        )

    expired = Project.objects.filter(
        user=user,
        invite_token__isnull=False,
        invite_token_expiry__isnull=False,
        invite_token_expiry__lt=timezone.now(),
        invite_token_used=False,
        status="pending",
    ).order_by("-created_at")

    serializer = ProjectListSerializer(expired, many=True)
    return Response({"projects": serializer.data, "count": expired.count()})

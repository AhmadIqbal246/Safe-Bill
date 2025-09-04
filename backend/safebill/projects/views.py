from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from .models import Project, Quote, PaymentInstallment, Milestone
from .serializers import (
    ProjectCreateSerializer,
    ProjectListSerializer,
    ClientProjectSerializer,
    MilestoneSerializer,
    MilestoneUpdateSerializer,
)
from notifications.models import Notification
from notifications.services import NotificationService
from payments.services import BalanceService
from chat.models import ChatContact, Conversation
import logging

logger = logging.getLogger(__name__)


class ProjectCreateAPIView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Check if user has seller role
        if not hasattr(self.request.user, "role") or self.request.user.role not in [
            "seller"
        ]:
            raise permissions.PermissionDenied(
                "Only users with seller role can create projects."
            )

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

        # Create serializer with processed data
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


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
        if not hasattr(request.user, "role") or request.user.role not in ["seller"]:
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


class ProjectInviteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def check_buyer_permission(self, request):
        """Check if user has buyer role"""
        if not hasattr(request.user, "role") or request.user.role not in [
            "buyer",
            "professional-buyer",
        ]:
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

        # Add the client to the project if not already added
        if not project.client:
            project.client = request.user
            project.save()

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

            # Update balances when milestone is approved
            try:
                project = milestone.project
                if project.user and project.client:
                    # Process milestone payment: transfer from buyer's escrow to seller's balance
                    BalanceService.process_milestone_payment(
                        seller=project.user,
                        buyer=project.client,
                        milestone_amount=milestone.relative_payment,
                    )
            except Exception as e:

                logger.error(
                    f"Error updating balances for milestone {milestone.id}: {e}"
                )

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
        milestone.save()

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_completed_projects(request):
    """
    Get all completed projects for the authenticated seller
    """
    user = request.user
    
    # Only sellers can access this endpoint
    if user.role != 'seller':
        return Response(
            {'detail': 'Only sellers can access completed projects.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all completed projects for this seller
    completed_projects = Project.objects.filter(
        user=user,
        status='completed'
    ).order_by('-created_at')
    
    # Serialize the projects
    serializer = ProjectListSerializer(completed_projects, many=True)
    
    return Response({
        'projects': serializer.data,
        'count': completed_projects.count()
    })

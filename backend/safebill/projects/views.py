from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Project, Quote, PaymentInstallment, Milestone
from .serializers import (
    ProjectCreateSerializer, ProjectListSerializer, ClientProjectSerializer,
    MilestoneSerializer, MilestoneUpdateSerializer
)
from notifications.models import Notification


class ProjectCreateAPIView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Extract and process the form data
        data = {}
        
        # Handle regular fields
        data['name'] = request.data.get('name')[0] if isinstance(request.data.get('name'), list) else request.data.get('name')
        data['client_email'] = request.data.get('client_email')[0] if isinstance(request.data.get('client_email'), list) else request.data.get('client_email')
        
        # Handle installments JSON
        installments_raw = request.data.get('installments')
        if installments_raw:
            installments_str = installments_raw[0] if isinstance(installments_raw, list) else installments_raw
            try:
                import json
                data['installments'] = json.loads(installments_str)
            except (json.JSONDecodeError, ValueError):
                return Response({'installments': ['Invalid JSON format']}, status=400)
        
        # Handle quote file
        quote_file = request.data.get('quote.file')
        if quote_file:
            file_obj = quote_file[0] if isinstance(quote_file, list) else quote_file
            data['quote'] = {'file': file_obj}
        else:
            data['quote'] = {}
        
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
        return Project.objects.filter(user=self.request.user).order_by('-id')


class ClientProjectListAPIView(generics.ListAPIView):
    """
    View for clients to list their projects
    """
    serializer_class = ClientProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client=self.request.user).order_by('-id')


class ProjectDeleteAPIView(generics.DestroyAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class MilestoneListAPIView(generics.ListAPIView):
    """
    List milestones for a specific project
    """
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return Milestone.objects.filter(project_id=project_id).order_by('created_date')


class MilestoneDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a milestone
    """
    serializer_class = MilestoneUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Milestone.objects.all()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MilestoneUpdateSerializer
        return MilestoneSerializer


class ProjectInviteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, token):
        try:
            project = Project.objects.get(invite_token=token)
        except Project.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired invite link.'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Check expiry
        if (not project.invite_token_expiry or
                project.invite_token_expiry < timezone.now()):
            return Response(
                {'detail': 'Invite link has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check that the logged-in user's email matches the client_email
        if request.user.email.lower() != project.client_email.lower():
            return Response(
                {'detail': 'You are not authorized to view this project.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Add the client to the project if not already added
        if not project.client:
            project.client = request.user
            project.save()
            
            # Create notification for the buyer
            Notification.objects.create(
                user=request.user,
                message=f"You have been added to the project '{project.name}' by {project.user.username}."
            )
        
        # Return project details
        serializer = ProjectListSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, token):
        """
        Handle client acceptance of the project invite
        """
        try:
            project = Project.objects.get(invite_token=token)
        except Project.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired invite link.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check expiry
        if (not project.invite_token_expiry or
                project.invite_token_expiry < timezone.now()):
            return Response(
                {'detail': 'Invite link has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check that the logged-in user's email matches the client_email
        if request.user.email.lower() != project.client_email.lower():
            return Response(
                {'detail': 'You are not authorized to accept this project.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Add the client to the project
        if not project.client:
            project.client = request.user
            project.save()
            
            # Create notification for the seller
            Notification.objects.create(
                user=project.user,
                message=f"Client {request.user.email} has accepted the project '{project.name}'."
            )
            
            # Create notification for the buyer
            Notification.objects.create(
                user=request.user,
                message=f"You have successfully accepted the project '{project.name}' from {project.user.username}."
            )
        
        return Response(
            {'detail': 'Project accepted successfully.'},
            status=status.HTTP_200_OK
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

        action_type = request.data.get('action')
        if action_type not in ['approve', 'not_approved', 'review_request', 'pending']:
            return Response({"detail": "Invalid action."}, status=400)

        if action_type == 'approve':
            milestone.status = 'approved'
            milestone.completion_date = timezone.now()
        elif action_type == 'not_approved':
            milestone.status = 'not_approved'
            milestone.completion_date = None
        elif action_type == 'review_request':
            milestone.status = 'review_request'
            milestone.completion_date = None
            # Save review comment if provided
            review_comment = request.data.get('review_comment', '')
            milestone.review_comment = review_comment
        elif action_type == 'pending':
            milestone.status = 'pending'
            milestone.completion_date = None
        milestone.save()

        project = milestone.project
        status_msg = {
            'approve': 'approved',
            'not_approved': 'not approved',
            'review_request': 'sent for review',
            'pending': 'submitted for approval'
        }.get(action_type, milestone.status)

        # Notify seller
        if project.user:
            Notification.objects.create(
                user=project.user,
                message=f"Milestone '{milestone.name}' for project '{project.name}' was {status_msg}."
            )
        # Notify buyer/client
        if project.client:
            Notification.objects.create(
                user=project.client,
                message=f"Milestone '{milestone.name}' for project '{project.name}' was {status_msg}."
            )

        return Response({"detail": f"Milestone status updated to {milestone.status}."}, status=200)


class ClientProjectsWithPendingMilestonesAPIView(generics.ListAPIView):
    """
    View for clients to list projects that have pending milestones
    """
    serializer_class = ClientProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            client=self.request.user,
            milestones__status='pending'
        ).distinct().order_by('-id')


class ClientProjectDetailAPIView(generics.RetrieveAPIView):
    """
    View for clients to get detailed project information
    """
    serializer_class = ClientProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client=self.request.user)

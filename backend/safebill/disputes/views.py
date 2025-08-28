from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Dispute, DisputeDocument, DisputeEvent, DisputeComment
from .serializers import (
    DisputeListSerializer, DisputeDetailSerializer, DisputeCreateSerializer,
    DisputeUpdateSerializer, DisputeCommentCreateSerializer
)
from notifications.models import Notification
from projects.models import Project
from projects.serializers import ProjectListSerializer


class DisputeListAPIView(generics.ListAPIView):
    """
    List disputes for the authenticated user (as initiator or respondent)
    """
    serializer_class = DisputeListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Dispute.objects.filter(
            initiator=self.request.user
        ) | Dispute.objects.filter(
            respondent=self.request.user
        )


class DisputeDetailAPIView(generics.RetrieveAPIView):
    """Get detailed information about a specific dispute."""
    serializer_class = DisputeDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Super-admin can view all disputes
        if getattr(user, 'role', None) == 'super-admin':
            return Dispute.objects.all()
        # Admins/mediators can view disputes they are assigned to
        admin_qs = Dispute.objects.filter(assigned_mediator=user)
        # Regular access: involved as initiator or respondent
        party_qs = Dispute.objects.filter(Q(initiator=user) | Q(respondent=user))
        if getattr(user, 'is_admin', False):
            return admin_qs | party_qs
        return party_qs


class DisputeCreateAPIView(generics.CreateAPIView):
    """
    Create a new dispute
    """
    serializer_class = DisputeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Extract and process the form data
        data = {}
        
        # Handle regular fields
        data['project'] = request.data.get('project')
        data['dispute_type'] = request.data.get('dispute_type')
        data['title'] = request.data.get('title')
        data['description'] = request.data.get('description')
        
        # Handle documents
        documents = []
        for key in request.FILES:
            if key.startswith('documents'):
                documents.append(request.FILES[key])
        
        data['documents'] = documents
        
        # Create serializer with processed data
        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


class DisputeUpdateAPIView(generics.UpdateAPIView):
    """
    Update dispute status and details (admin/mediator only)
    """
    serializer_class = DisputeUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Dispute.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)


class DisputeCommentCreateAPIView(generics.CreateAPIView):
    """
    Add a comment to a dispute
    """
    serializer_class = DisputeCommentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        dispute_id = self.kwargs.get('dispute_id')
        try:
            dispute = Dispute.objects.get(id=dispute_id)
            # Check if user is involved in the dispute
            if request.user not in [dispute.initiator, dispute.respondent]:
                return Response(
                    {'detail': 'You are not authorized to comment on this dispute.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Dispute.DoesNotExist:
            return Response(
                {'detail': 'Dispute not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request, 'dispute_id': dispute_id}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)


class AvailableProjectsForDisputeAPIView(generics.ListAPIView):
    """
    Get projects available for dispute creation (projects where user is seller or buyer)
    """
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get projects where user is seller (project.user) or buyer (project.client)
        return Project.objects.filter(
            user=self.request.user
        ) | Project.objects.filter(
            client=self.request.user
        )


class DisputeAssignMediatorAPIView(APIView):
    """
    Assign a mediator to a dispute
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, dispute_id):
        try:
            dispute = Dispute.objects.get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response(
                {'detail': 'Dispute not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        mediator_id = request.data.get('mediator_id')
        if not mediator_id:
            return Response(
                {'detail': 'Mediator ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            mediator = User.objects.get(id=mediator_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Mediator not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update dispute
        dispute.assigned_mediator = mediator
        dispute.status = 'in_progress'
        dispute.save()
        
        # Create event
        DisputeEvent.objects.create(
            dispute=dispute,
            event_type='mediator_assigned',
            description=f'Mediator {mediator.username} assigned',
            created_by=request.user
        )
        
        # Send notifications to both parties
        message = f"Mediator {mediator.username} has been assigned to dispute {dispute.dispute_id}"
        
        # Notify initiator
        Notification.objects.create(
            user=dispute.initiator,
            message=message
        )
        
        # Notify respondent
        Notification.objects.create(
            user=dispute.respondent,
            message=message
        )
        
        return Response({'detail': 'Mediator assigned successfully.'})


class DisputeResolveAPIView(APIView):
    """
    Resolve a dispute
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, dispute_id):
        try:
            dispute = Dispute.objects.get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response(
                {'detail': 'Dispute not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        resolution_details = request.data.get('resolution_details')
        resolution_amount = request.data.get('resolution_amount')
        
        # Update dispute
        dispute.status = 'resolved'
        dispute.resolved_at = timezone.now()
        if resolution_details:
            dispute.resolution_details = resolution_details
        if resolution_amount:
            dispute.resolution_amount = resolution_amount
        dispute.save()
        
        # Create event
        DisputeEvent.objects.create(
            dispute=dispute,
            event_type='resolved',
            description=f'Dispute resolved by {request.user.username}',
            created_by=request.user
        )
        
        # Send notifications to both parties
        message = f"Dispute {dispute.dispute_id} has been resolved"
        
        # Notify initiator
        Notification.objects.create(
            user=dispute.initiator,
            message=message
        )
        
        # Notify respondent
        Notification.objects.create(
            user=dispute.respondent,
            message=message
        )
        
        return Response({'detail': 'Dispute resolved successfully.'})

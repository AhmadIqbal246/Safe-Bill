from rest_framework import generics, permissions
from .models import Project
from .serializers import (
    ProjectCreateSerializer,
    ProjectListSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone


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


class ProjectDeleteAPIView(generics.DestroyAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


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
        # Return project details
        serializer = ProjectListSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework import generics, permissions
from .models import Project
from .serializers import ProjectCreateSerializer, ProjectListSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response


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

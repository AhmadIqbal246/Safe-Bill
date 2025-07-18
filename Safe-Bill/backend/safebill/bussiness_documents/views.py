from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import MultiDocumentUploadSerializer
from .models import Document

# Create your views here.

class MultiDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MultiDocumentUploadSerializer(data=request.data, files=request.FILES)
        if serializer.is_valid():
            user = request.user
            for doc_type in ['kbis', 'pro_insurance', 'insurance', 'id', 'rib']:
                Document.objects.create(
                    user=user,
                    document_type=doc_type,
                    file=serializer.validated_data[doc_type]
                )
            return Response({'detail': 'Documents uploaded successfully.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

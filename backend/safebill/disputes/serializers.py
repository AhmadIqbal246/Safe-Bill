from rest_framework import serializers
from .models import Dispute, DisputeDocument, DisputeEvent, DisputeComment
from projects.serializers import ProjectListSerializer
from notifications.models import Notification
from utils.email_service import EmailService
from .tasks import send_dispute_created_email_task
from hubspot.tasks import sync_dispute_ticket_task


class DisputeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeDocument
        fields = ['id', 'file', 'filename', 'uploaded_by', 'uploaded_at']


class DisputeEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = DisputeEvent
        fields = [
            'id', 'event_type', 'description', 'created_by', 
            'created_by_name', 'created_at'
        ]


class DisputeCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = DisputeComment
        fields = [
            'id', 'content', 'author', 'author_name', 
            'created_at', 'updated_at'
        ]


class DisputeListSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    initiator_name = serializers.CharField(source='initiator.username', read_only=True)
    respondent_name = serializers.CharField(source='respondent.username', read_only=True)
    mediator_name = serializers.CharField(source='assigned_mediator.username', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'dispute_id', 'project', 'project_name', 'title',
            'dispute_type', 'status', 'initiator', 'initiator_name',
            'respondent', 'respondent_name', 'assigned_mediator',
            'mediator_name', 'created_at', 'updated_at'
        ]


class DisputeDetailSerializer(serializers.ModelSerializer):
    project = ProjectListSerializer(read_only=True)
    initiator_name = serializers.CharField(source='initiator.username', read_only=True)
    respondent_name = serializers.CharField(source='respondent.username', read_only=True)
    mediator_name = serializers.CharField(source='assigned_mediator.username', read_only=True)
    documents = DisputeDocumentSerializer(source='documents.all', many=True, read_only=True)
    events = DisputeEventSerializer(source='events.all', many=True, read_only=True)
    comments = DisputeCommentSerializer(source='comments.all', many=True, read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'dispute_id', 'project', 'title', 'dispute_type',
            'description', 'status', 'initiator', 'initiator_name',
            'respondent', 'respondent_name', 'assigned_mediator',
            'mediator_name', 'created_at', 'updated_at', 'resolved_at',
            'resolution_details', 'resolution_amount', 'documents',
            'events', 'comments'
        ]


class DisputeCreateSerializer(serializers.ModelSerializer):
    documents = serializers.ListField(
        child=serializers.FileField(),
        required=False
    )
    
    class Meta:
        model = Dispute
        fields = [
            'project', 'dispute_type', 'title', 'description', 'documents'
        ]
    
    def to_representation(self, instance):
        """Return a simple representation for create response"""
        return {
            'id': instance.id,
            'dispute_id': instance.dispute_id,
            'title': instance.title,
            'status': instance.status,
            'created_at': instance.created_at,
            'message': 'Dispute created successfully'
        }
    
    def create(self, validated_data):
        documents = validated_data.pop('documents', [])
        request = self.context.get('request')
        
        # Set initiator (current user)
        validated_data['initiator'] = request.user
        project = validated_data['project']
        
        # Determine respondent based on project roles
        if request.user == project.user:
            # Seller initiated dispute, respondent is buyer (client)
            validated_data['respondent'] = project.client
        elif request.user == project.client:
            # Buyer initiated dispute, respondent is seller
            validated_data['respondent'] = project.user
        else:
            # User is not part of the project
            raise serializers.ValidationError(
                "You can only create disputes for projects you are involved in."
            )
        
        # Create dispute
        dispute = Dispute.objects.create(**validated_data)
        
        # Create initial event
        DisputeEvent.objects.create(
            dispute=dispute,
            event_type='submitted',
            description=f'Dispute submitted by {request.user.username}',
            created_by=request.user
        )
        
        # Handle documents
        for doc_file in documents:
            DisputeDocument.objects.create(
                dispute=dispute,
                file=doc_file,
                filename=doc_file.name,
                uploaded_by=request.user
            )
        
        # Send notifications to both parties
        # Notification to respondent
        Notification.objects.create(
            user=validated_data['respondent'],
            message=f"A dispute has been filed for project '{project.name}' by {request.user.username}. Dispute ID: {dispute.dispute_id}"
        )
        
        # Notification to initiator (confirmation)
        Notification.objects.create(
            user=request.user,
            message=f"Your dispute for project '{project.name}' has been created successfully. Dispute ID: {dispute.dispute_id}"
        )

        # Email seller (project owner) with localization (asynchronously via Celery)
        try:
            preferred_lang = request.headers.get('X-User-Language') or request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
            language = preferred_lang.split(',')[0][:2] if preferred_lang else 'en'

            seller = project.user
            seller_name = (
                seller.get_full_name() or getattr(seller, 'username', None) or seller.email.split('@')[0]
            )

            # Send asynchronously
            send_dispute_created_email_task.delay(
                seller_email=seller.email,
                seller_name=seller_name,
                project_name=project.name,
                dispute_id=dispute.dispute_id,
                language=language,
            )
            # Also create a HubSpot ticket directly (signals disabled for disputes)
            try:
                sync_dispute_ticket_task.delay(dispute.id)
            except Exception:
                # Do not fail dispute creation if HubSpot enqueue fails
                pass
        except Exception:
            # Do not fail dispute creation if email sending fails
            pass
        
        return dispute


class DisputeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ['status', 'assigned_mediator', 'resolution_details', 'resolution_amount']
    
    def update(self, instance, validated_data):
        old_status = instance.status
        old_mediator = instance.assigned_mediator
        
        instance = super().update(instance, validated_data)
        
        # Create event for status change
        if 'status' in validated_data and validated_data['status'] != old_status:
            DisputeEvent.objects.create(
                dispute=instance,
                event_type='status_changed',
                description=f'Status changed from {old_status} to {validated_data["status"]}',
                created_by=self.context['request'].user
            )
            
            # Send notification for status change
            self._send_status_change_notification(instance, old_status, validated_data['status'])
            
            # Update HubSpot ticket explicitly (signals disabled for disputes)
            try:
                sync_dispute_ticket_task.delay(instance.id)
            except Exception:
                pass
        
        # Create event for mediator assignment
        if 'assigned_mediator' in validated_data and validated_data['assigned_mediator'] != old_mediator:
            new_mediator = validated_data['assigned_mediator']
            DisputeEvent.objects.create(
                dispute=instance,
                event_type='mediator_assigned',
                description=f'Mediator {new_mediator.username} assigned',
                created_by=self.context['request'].user
            )
            
            # Send notification for mediator assignment
            self._send_mediator_assignment_notification(instance, new_mediator)
            
            # Update HubSpot ticket explicitly (signals disabled for disputes)
            try:
                sync_dispute_ticket_task.delay(instance.id)
            except Exception:
                pass
        
        return instance
    
    def _send_status_change_notification(self, dispute, old_status, new_status):
        """Send notifications to both parties about status change"""
        message = f"Dispute {dispute.dispute_id} status changed from {old_status} to {new_status}"
        
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
    
    def _send_mediator_assignment_notification(self, dispute, mediator):
        """Send notifications about mediator assignment"""
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


class DisputeCommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeComment
        fields = ['content']
    
    def create(self, validated_data):
        validated_data['dispute_id'] = self.context['dispute_id']
        validated_data['author'] = self.context['request'].user
        
        comment = DisputeComment.objects.create(**validated_data)
        
        # Create event for comment
        DisputeEvent.objects.create(
            dispute=comment.dispute,
            event_type='comment_added',
            description=f'Comment added by {comment.author.username}',
            created_by=comment.author
        )
        
        # Send notification to the other party
        other_party = comment.dispute.respondent if comment.author == comment.dispute.initiator else comment.dispute.initiator
        
        Notification.objects.create(
            user=other_party,
            message=f"{comment.author.username} added a comment to dispute {comment.dispute.dispute_id}"
        )
        
        return comment 
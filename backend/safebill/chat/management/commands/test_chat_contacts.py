from django.core.management.base import BaseCommand
from django.db import transaction
from projects.models import Project
from chat.models import ChatContact, Conversation
from django.utils import timezone

class Command(BaseCommand):
    help = 'Test chat contact creation for existing projects'

    def handle(self, *args, **options):
        self.stdout.write('Testing chat contact creation...')
        
        with transaction.atomic():
            # Get projects that have both seller and buyer but no chat contacts
            projects = Project.objects.filter(
                client__isnull=False,
                user__isnull=False
            ).exclude(
                chat_contacts__isnull=False
            )
            
            created_count = 0
            for project in projects:
                seller = project.user
                buyer = project.client
                
                if not seller or not buyer:
                    continue
                
                # Create or get conversation
                conversation, created = Conversation.objects.get_or_create(
                    project=project,
                    defaults={
                        'last_message_at': timezone.now(),
                        'last_message_text': f"Project '{project.name}' started"
                    }
                )
                
                # Add participants
                conversation.participants.add(seller, buyer)
                
                # Create chat contacts
                seller_contact, created1 = ChatContact.objects.get_or_create(
                    user=seller,
                    contact=buyer,
                    project=project,
                    defaults={
                        'last_message_at': timezone.now(),
                        'last_message_text': f"Project '{project.name}' started",
                        'unread_count': 0
                    }
                )
                
                buyer_contact, created2 = ChatContact.objects.get_or_create(
                    user=buyer,
                    contact=seller,
                    project=project,
                    defaults={
                        'last_message_at': timezone.now(),
                        'last_message_text': f"Project '{project.name}' started",
                        'unread_count': 0
                    }
                )
                
                if created1 or created2:
                    created_count += 1
                    self.stdout.write(
                        f'Created chat contacts for project "{project.name}" '
                        f'({seller.username} <-> {buyer.username})'
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully processed {projects.count()} projects. '
                    f'Created {created_count} new chat contact pairs.'
                )
            )

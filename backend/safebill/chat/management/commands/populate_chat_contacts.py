from django.core.management.base import BaseCommand
from django.db import transaction
from chat.models import Conversation, ChatContact


class Command(BaseCommand):
    help = 'Populate chat contacts for existing conversations'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate chat contacts...')
        
        with transaction.atomic():
            conversations = Conversation.objects.all()
            created_count = 0
            
            for conv in conversations:
                project = conv.project
                participants = list(conv.participants.all())
                
                if len(participants) >= 2:
                    user1, user2 = participants[0], participants[1]
                    
                    # Create chat contact for user1 -> user2
                    contact1, created1 = ChatContact.objects.get_or_create(
                        user=user1,
                        contact=user2,
                        project=project,
                        defaults={
                            'last_message_at': conv.last_message_at,
                            'last_message_text': conv.last_message_text or '',
                            'unread_count': 0
                        }
                    )
                    
                    # Create chat contact for user2 -> user1
                    contact2, created2 = ChatContact.objects.get_or_create(
                        user=user2,
                        contact=user1,
                        project=project,
                        defaults={
                            'last_message_at': conv.last_message_at,
                            'last_message_text': conv.last_message_text or '',
                            'unread_count': 0
                        }
                    )
                    
                    if created1 or created2:
                        created_count += 1
                        self.stdout.write(
                            f'Created chat contacts for project {project.name} '
                            f'({user1.username} <-> {user2.username})'
                        )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully processed {conversations.count()} '
                    f'conversations. Created {created_count} new chat contacts.'
                )
            )

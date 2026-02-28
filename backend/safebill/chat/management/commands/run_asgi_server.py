from django.core.management.base import BaseCommand
import os
import sys
import django
from django.conf import settings

class Command(BaseCommand):
    help = 'Run the ASGI server with Django Channels support'

    def handle(self, *args, **options):
        # Ensure Django is set up
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')
        django.setup()
        
        # Import after Django setup
        from daphne.server import Server
        from safebill.asgi import application
        
        self.stdout.write(
            self.style.SUCCESS('Starting ASGI server with Django Channels support...')
        )
        self.stdout.write('Server will be available at http://127.0.0.1:8000')
        self.stdout.write('WebSocket connections will be available at ws://127.0.0.1:8000')
        
        try:
            # Run the ASGI server
            server = Server(application)
            server.run(host='127.0.0.1', port=8000)
        except KeyboardInterrupt:
            self.stdout.write(
                self.style.WARNING('\nServer stopped by user')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Server error: {e}')
            )

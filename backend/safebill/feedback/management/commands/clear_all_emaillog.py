"""
Management command to clear all EmailLog entries from the database.
Use with caution - this will delete all email logs.
"""
from django.core.management.base import BaseCommand
from feedback.models import EmailLog


class Command(BaseCommand):
    help = "Clear all EmailLog entries from the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all EmailLog entries',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL EmailLog entries from the database.\n'
                    'Use --confirm flag to proceed.'
                )
            )
            return

        # Get count before deletion
        total_count = EmailLog.objects.count()
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No EmailLog entries found. Database is already empty.'))
            return

        # Delete all EmailLog entries
        deleted_count = EmailLog.objects.all().delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} EmailLog entries from the database.'
            )
        )


from django.core.management.base import BaseCommand
from django.db import transaction
from projects.models import Project
from payments.models import Payment
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fix payment status inconsistencies for completed projects'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making actual changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Find completed projects with pending payments
        completed_projects = Project.objects.filter(status="completed")
        inconsistencies = []
        
        for project in completed_projects:
            payment = Payment.objects.filter(project=project).order_by("-created_at").first()
            
            if payment and payment.status == "pending":
                inconsistencies.append({
                    'project': project,
                    'payment': payment,
                    'issue': 'completed_project_with_pending_payment'
                })
            elif not payment:
                inconsistencies.append({
                    'project': project,
                    'payment': None,
                    'issue': 'completed_project_without_payment'
                })
        
        if not inconsistencies:
            self.stdout.write(self.style.SUCCESS('No payment inconsistencies found!'))
            return
        
        self.stdout.write(f'Found {len(inconsistencies)} payment inconsistencies:')
        
        for item in inconsistencies:
            project = item['project']
            payment = item['payment']
            issue = item['issue']
            
            if issue == 'completed_project_with_pending_payment':
                self.stdout.write(
                    f'  Project {project.id} ({project.name}) - Payment {payment.id} is pending but project is completed'
                )
                if not dry_run:
                    with transaction.atomic():
                        payment.status = "paid"
                        payment.save()
                        
                        # Sync payment to HubSpot
                        from hubspot.tasks import sync_payment_to_hubspot
                        sync_payment_to_hubspot.delay(payment_id=payment.id)
                        
                        self.stdout.write(f'    ✓ Updated payment {payment.id} status to "paid"')
            elif issue == 'completed_project_without_payment':
                self.stdout.write(
                    f'  Project {project.id} ({project.name}) - No payment record found but project is completed'
                )
                self.stdout.write(f'    ⚠ This requires manual investigation')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nThis was a dry run. Use without --dry-run to apply changes.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nFixed {len([i for i in inconsistencies if i["issue"] == "completed_project_with_pending_payment"])} payment inconsistencies.'))

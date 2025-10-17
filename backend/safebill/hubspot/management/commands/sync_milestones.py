from django.core.management.base import BaseCommand
from projects.models import Project
from hubspot.sync_utils import queue_milestone_sync


class Command(BaseCommand):
    help = 'Sync milestone updates to HubSpot for all projects or specific project'

    def add_arguments(self, parser):
        parser.add_argument(
            '--project-id',
            type=int,
            help='Sync milestones for specific project ID'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Sync milestones for all projects'
        )

    def handle(self, *args, **options):
        if options['project_id']:
            # Sync specific project
            try:
                project = Project.objects.get(id=options['project_id'])
                milestones = project.milestones.all()
                if milestones.exists():
                    # Use first milestone for context
                    milestone = milestones.first()
                    queue_item = queue_milestone_sync(milestone, priority='high')
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Queued milestone sync for project {project.id} (queue_id: {queue_item.id})'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'No milestones found for project {project.id}')
                    )
            except Project.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Project {options["project_id"]} not found')
                )
        elif options['all']:
            # Sync all projects
            projects = Project.objects.filter(milestones__isnull=False).distinct()
            synced_count = 0
            for project in projects:
                milestones = project.milestones.all()
                if milestones.exists():
                    milestone = milestones.first()
                    queue_item = queue_milestone_sync(milestone, priority='normal')
                    synced_count += 1
                    self.stdout.write(f'Queued project {project.id} (queue_id: {queue_item.id})')
            
            self.stdout.write(
                self.style.SUCCESS(f'Queued milestone sync for {synced_count} projects')
            )
        else:
            self.stdout.write(
                self.style.ERROR('Please specify --project-id or --all')
            )

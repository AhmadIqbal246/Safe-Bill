import os
import logging
from celery import Celery
from celery.signals import task_failure, task_retry, task_revoked, task_success
from django.conf import settings

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safebill.settings')

# Create Celery app
app = Celery('safebill')

# Configure Celery using Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover and register tasks from all registered Django apps
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

# Setup logging for terminal output
logger = logging.getLogger(__name__)

# Silent Task Failure Detection
@task_failure.connect
def log_task_failure(sender=None, task_id=None, exception=None, traceback=None, einfo=None, **kwargs):
    """Log when any Celery task fails (catches silent failures)"""
    task_name = getattr(sender, 'name', 'Unknown')
    print(f"\n ❌ TASK FAILED SILENTLY: {task_name}")
    print(f"   Task ID: {task_id}")
    print(f"   Error: {exception}")
    if 'hubspot' in task_name.lower():
        print(f"   [WARNING] HubSpot sync failure detected!")
    logger.error(f"Task {task_name} failed: {exception}", extra={'task_id': task_id})

@task_retry.connect
def log_task_retry(sender=None, task_id=None, reason=None, einfo=None, **kwargs):
    """Log when tasks are retrying"""
    task_name = getattr(sender, 'name', 'Unknown')
    print(f"\n[RETRY] TASK RETRY: {task_name}")
    print(f"   Task ID: {task_id}")
    print(f"   Reason: {reason}")
    if 'hubspot' in task_name.lower():
        print(f"   [WARNING] HubSpot task retrying...")

@task_revoked.connect
def log_task_revoked(sender=None, task_id=None, reason=None, **kwargs):
    """Log when tasks are cancelled/revoked"""
    task_name = getattr(sender, 'name', 'Unknown')
    print(f"\n[REVOKED] TASK REVOKED: {task_name}")
    print(f"   Task ID: {task_id}")
    print(f"   Reason: {reason}")
    if 'hubspot' in task_name.lower():
        print(f"   [WARNING] HubSpot task was cancelled!")

@task_success.connect
def log_task_success(sender=None, task_id=None, result=None, **kwargs):
    """Log when HubSpot tasks complete successfully"""
    task_name = getattr(sender, 'name', 'Unknown')
    if 'hubspot' in task_name.lower():
        print(f"\n ✅ HUBSPOT TASK SUCCESS: {task_name}")
        # print(f"   Task ID: {task_id}")
        print(f"   Result: {result}")

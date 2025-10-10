import threading
import logging
import functools
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.db import transaction
from django.conf import settings

from disputes.models import Dispute
from .tasks import update_dispute_ticket_task

# Import our production-safe sync utilities
from .sync_utils import (
    sync_project_to_hubspot,
    sync_milestone_to_hubspot,
    is_hubspot_sync_enabled,
    HUBSPOT_SYNC_ENABLED
)

logger = logging.getLogger(__name__)
_local = threading.local()

# Feature flags for gradual rollout (production safety)
PROJECT_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_PROJECT_SIGNALS_ENABLED', True)
MILESTONE_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_MILESTONE_SIGNALS_ENABLED', True)
SIGNALS_DEBUG_MODE = getattr(settings, 'HUBSPOT_SIGNALS_DEBUG', False)


@receiver(pre_save, sender=Dispute)
def _capture_dispute_previous_state(sender, instance: Dispute, **kwargs):
    if not instance.pk:
        _local.prev = {"status": None, "mediator_id": None}
        return
    try:
        prev = Dispute.objects.only("status", "assigned_mediator_id").get(pk=instance.pk)
        _local.prev = {
            "status": prev.status,
            "mediator_id": prev.assigned_mediator_id,
        }
    except Dispute.DoesNotExist:
        _local.prev = {"status": None, "mediator_id": None}


@receiver(post_save, sender=Dispute)
def _enqueue_ticket_update_on_change(sender, instance: Dispute, created: bool, **kwargs):
    # Fire only on updates when status or mediator changed
    prev = getattr(_local, "prev", {"status": None, "mediator_id": None})
    status_changed = prev.get("status") is not None and prev.get("status") != instance.status
    mediator_changed = prev.get("mediator_id") != instance.assigned_mediator_id

    if created or not (status_changed or mediator_changed):
        return

    def _enqueue():
        try:
            update_dispute_ticket_task.delay(instance.id)
        except Exception:
            pass

    # Ensure the job enqueues after commit to avoid race conditions
    try:
        transaction.on_commit(_enqueue)
    except Exception:
        _enqueue()


# ============================================================================
# PROJECT AND MILESTONE SIGNALS (PRODUCTION-SAFE)
# ============================================================================

def safe_signal_handler(signal_name: str, enabled_flag: bool):
    """
    Decorator for safe signal handling with error isolation.
    
    Args:
        signal_name: Name of the signal for logging
        enabled_flag: Feature flag to check
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Feature flag check
            if not enabled_flag:
                if SIGNALS_DEBUG_MODE:
                    logger.debug(f"🔕 {signal_name} signal disabled by feature flag")
                return
            
            # Global sync check
            if not is_hubspot_sync_enabled():
                if SIGNALS_DEBUG_MODE:
                    logger.debug(f"🔕 {signal_name} signal skipped - HubSpot sync disabled")
                return
            
            try:
                if SIGNALS_DEBUG_MODE:
                    logger.debug(f"📡 {signal_name} signal triggered")
                return func(*args, **kwargs)
            except Exception as e:
                # NEVER let signal handlers break the main application flow
                logger.error(
                    f"💥 {signal_name} signal handler failed: {e}",
                    exc_info=True,
                    extra={
                        'signal_name': signal_name,
                        'args': str(args),
                        'kwargs': str(kwargs)
                    }
                )
                # Signal failures should never propagate
        return wrapper
    return decorator


@receiver(post_save, sender='projects.Project')
@safe_signal_handler('Project Creation', PROJECT_SIGNALS_ENABLED)
def auto_sync_project_to_hubspot(sender, instance, created, **kwargs):
    """
    Automatically sync new projects to HubSpot when created.
    
    This provides a safety net that catches ALL project creations,
    regardless of the creation method (API, admin, bulk import, etc.)
    """
    if not created:
        return
    
    # Only sync real projects (not quote chat projects)
    if getattr(instance, 'project_type', None) != 'real_project':
        if SIGNALS_DEBUG_MODE:
            logger.debug(f"⏭️ Skipping HubSpot sync for project {instance.id} - not a real project")
        return
    
    project_id = getattr(instance, 'id', None)
    if not project_id:
        logger.warning("⚠️ Project instance has no ID - cannot sync to HubSpot")
        return
    
    logger.info(f"🔄 Auto-syncing project {project_id} to HubSpot via signal")
    
    # Use our production-safe sync function with specific reason
    result = sync_project_to_hubspot(
        project_id=project_id,
        reason="signal_project_created",
        use_transaction_commit=True  # Safe to use since we're already in a transaction
    )
    
    if SIGNALS_DEBUG_MODE:
        logger.debug(f"📊 Project signal sync result: {result}")


@receiver(post_save, sender='projects.Milestone')
@safe_signal_handler('Milestone Creation', MILESTONE_SIGNALS_ENABLED) 
def auto_sync_milestone_to_hubspot(sender, instance, created, **kwargs):
    """
    Automatically sync new milestones to HubSpot when created.
    
    This ensures milestone summaries are always up-to-date in HubSpot.
    """
    if not created:
        return
    
    milestone_id = getattr(instance, 'id', None)
    if not milestone_id:
        logger.warning("⚠️ Milestone instance has no ID - cannot sync to HubSpot")
        return
    
    # Check if milestone belongs to a real project
    project = getattr(instance, 'project', None)
    if not project or getattr(project, 'project_type', None) != 'real_project':
        if SIGNALS_DEBUG_MODE:
            logger.debug(f"⏭️ Skipping HubSpot sync for milestone {milestone_id} - not for real project")
        return
    
    logger.info(f"🔄 Auto-syncing milestone {milestone_id} to HubSpot via signal")
    
    # Use our production-safe sync function with specific reason
    result = sync_milestone_to_hubspot(
        milestone_id=milestone_id,
        reason="signal_milestone_created",
        use_transaction_commit=True  # Safe to use since we're already in a transaction
    )
    
    if SIGNALS_DEBUG_MODE:
        logger.debug(f"📊 Milestone signal sync result: {result}")


# Health check function for monitoring
def get_signals_status() -> dict:
    """
    Get status of HubSpot signal handlers for monitoring.
    
    Returns:
        dict: Signal handler status information
    """
    return {
        'project_signals_enabled': PROJECT_SIGNALS_ENABLED,
        'milestone_signals_enabled': MILESTONE_SIGNALS_ENABLED,
        'signals_debug_mode': SIGNALS_DEBUG_MODE,
        'hubspot_sync_enabled': HUBSPOT_SYNC_ENABLED,
        'total_signals_active': sum([
            PROJECT_SIGNALS_ENABLED,
            MILESTONE_SIGNALS_ENABLED
        ])
    }

import threading
import logging
import functools
import time
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.db import transaction
from django.conf import settings

from disputes.models import Dispute
from .tasks import update_dispute_ticket_task, create_dispute_ticket_task

# Import for revenue syncing
from payments.models import Payment
from projects.models import Milestone

# Import our production-safe sync utilities
from .sync_utils import (
    sync_project_to_hubspot,
    sync_milestone_to_hubspot,
    safe_contact_sync,
    safe_company_sync,
    is_hubspot_sync_enabled,
    HUBSPOT_SYNC_ENABLED
)

logger = logging.getLogger(__name__)
_local = threading.local()

# Global lock to prevent duplicate syncs within a short timeframe
_milestone_sync_locks = {}
_milestone_lock = threading.Lock()
_project_sync_locks = {}
_project_lock = threading.Lock()

# Feature flags for gradual rollout (production safety)
USER_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_USER_SIGNALS_ENABLED', True)
PROJECT_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_PROJECT_SIGNALS_ENABLED', True)
MILESTONE_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_MILESTONE_SIGNALS_ENABLED', True)
COMPANY_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_COMPANY_SIGNALS_ENABLED', True)
REVENUE_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_REVENUE_SIGNALS_ENABLED', True)
DISPUTE_SIGNALS_ENABLED = getattr(settings, 'HUBSPOT_DISPUTE_SIGNALS_ENABLED', True)
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
    """
    Dispute HubSpot syncing via signals is disabled to prevent duplication.
    Creation and updates are handled explicitly in serializers.
    """
    return


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


# ============================================================================
# USER SIGNALS (PRODUCTION-SAFE)
# ============================================================================

# Store previous state for change detection
@receiver(pre_save, sender='accounts.User')
def capture_user_changes(sender, instance, **kwargs):
    """Capture user state before save to detect important changes"""
    if instance.pk:  # Only for existing users
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_is_email_verified = old_instance.is_email_verified
            instance._old_onboarding_complete = old_instance.onboarding_complete
        except sender.DoesNotExist:
            instance._old_is_email_verified = False
            instance._old_onboarding_complete = False
    else:
        instance._old_is_email_verified = False
        instance._old_onboarding_complete = False


@receiver(post_save, sender='accounts.User')
@safe_signal_handler('User Sync', USER_SIGNALS_ENABLED)
def auto_sync_user_to_hubspot(sender, instance, created, **kwargs):
    """
    Automatically sync users to HubSpot as contacts.
    Syncs on creation and important updates (email verification, onboarding).
    """
    user_id = getattr(instance, 'id', None)
    if not user_id:
        logger.warning("User instance has no ID - cannot sync to HubSpot")
        return
    
    # Determine if we should sync
    should_sync = False
    reason = "signal_user_unknown"
    
    if created:
        # New user creation
        should_sync = True
        reason = "signal_user_created"
        sync_type = "User creation"
    else:
        # Check for important updates
        email_verified_changed = (
            getattr(instance, '_old_is_email_verified', False) != instance.is_email_verified
            and instance.is_email_verified  # Only when verified becomes True
        )
        
        onboarding_changed = (
            getattr(instance, '_old_onboarding_complete', False) != instance.onboarding_complete
            and instance.onboarding_complete  # Only when onboarding becomes True
        )
        
        if email_verified_changed:
            should_sync = True
            reason = "signal_user_email_verified"
            sync_type = "Email verification"
        elif onboarding_changed:
            should_sync = True
            reason = "signal_user_onboarding_complete"
            sync_type = "Onboarding completion"
    
    # Only sync if we detected an important change
    if not should_sync:
        return
    
    # Simple emoji indicator when signal fires
    print(f"🚀 Django signal fired - User sync ({sync_type})")
    
    logger.info(f"Auto-syncing user {user_id} to HubSpot via signal ({reason})")
    
    try:
        # Use immediate execution for maximum reliability
        result = safe_contact_sync(user_id, reason, use_transaction_commit=False)
        logger.info(f"User {user_id} sync result ({sync_type}): {result}")
    except Exception as e:
        # Never let signal failures break the main application
        logger.error(f"User {user_id} signal sync failed ({sync_type}): {e}", exc_info=True)


@receiver(post_save, sender='accounts.BusinessDetail')
@safe_signal_handler('Company Sync', COMPANY_SIGNALS_ENABLED)
def auto_sync_company_to_hubspot(sender, instance, created, **kwargs):
    """
    Automatically sync business details to HubSpot as companies.
    Only syncs for sellers and professional buyers.
    """
    business_id = getattr(instance, 'id', None)
    if not business_id:
        logger.warning("BusinessDetail instance has no ID - cannot sync to HubSpot")
        return
    
    # Check if this is for a seller or professional buyer
    user = getattr(instance, 'user', None)
    if not user or getattr(user, 'role', None) not in ['seller', 'professional-buyer']:
        if SIGNALS_DEBUG_MODE:
            logger.debug(f"Skipping company sync for business {business_id} - not seller/pro-buyer")
        return
    
    # Simple emoji indicator when signal fires
    print("🏢 Django signal fired - Company sync")
    
    reason = "signal_company_created" if created else "signal_company_updated"
    logger.info(f"Auto-syncing company {business_id} to HubSpot via signal ({reason})")
    
    try:
        # Use immediate execution for maximum reliability
        result = safe_company_sync(business_id, reason)
        logger.info(f"Company {business_id} sync result: {result}")
    except Exception as e:
        # Never let signal failures break the main application
        logger.error(f"Company {business_id} signal sync failed: {e}", exc_info=True)


@receiver(post_save, sender='projects.Project')
@safe_signal_handler('Project Sync', PROJECT_SIGNALS_ENABLED)
def auto_sync_project_to_hubspot(sender, instance, created, **kwargs):
    """
    Automatically sync projects to HubSpot as deals.
    Uses thread-safe global lock to prevent duplicate syncs from multiple webhook calls.
    """
    # Only sync real projects (not quote chat projects)
    if getattr(instance, 'project_type', None) != 'real_project':
        if SIGNALS_DEBUG_MODE:
            logger.debug(f"Skipping HubSpot sync for project {instance.id} - not a real project")
        return
    
    project_id = getattr(instance, 'id', None)
    if not project_id:
        logger.warning("Project instance has no ID - cannot sync to HubSpot")
        return
        
    # Always log signal entry for debugging
    logger.info(f"🔍 DEBUG: Project signal fired for project_id={project_id}")
    
    # CRITICAL: Use thread-safe global lock to prevent duplicate syncs
    # This prevents multiple webhook calls from triggering duplicate syncs
    lock_key = f"project_{project_id}_sync"
    current_time = time.time()
    
    with _project_lock:
        # Smart deduplication: prevent rapid duplicates but allow legitimate updates
        if lock_key in _project_sync_locks:
            last_sync_time, last_sync_status = _project_sync_locks[lock_key]
            time_diff = current_time - last_sync_time
            current_status = getattr(instance, 'status', None)
            
            # Skip if same status update within 10 seconds (likely duplicate)
            if time_diff < 10 and last_sync_status == current_status:
                logger.info(f"❌ DEBUG: Project {project_id} duplicate sync detected (same status '{current_status}', {time_diff:.1f}s ago) - SKIPPING")
                return
            # Skip rapid duplicate only if status did not change
            elif time_diff < 1 and last_sync_status == current_status:
                logger.info(f"❌ DEBUG: Project {project_id} rapid same-status sync ({time_diff:.1f}s ago) - SKIPPING")
                return
        
        # Claim this project for syncing
        current_status = getattr(instance, 'status', None)
        _project_sync_locks[lock_key] = (current_time, current_status)
        logger.info(f"✅ DEBUG: Acquired sync lock for project {project_id} (status: {current_status})")
        
        # Clean up old locks (older than 5 minutes)
        expired_keys = [k for k, v in _project_sync_locks.items() if current_time - v[0] > 300]
        for k in expired_keys:
            del _project_sync_locks[k]
    
    # Simple emoji indicator when signal fires
    print("💼 Django signal fired - Project sync")
    
    reason = "signal_project_created" if created else "signal_project_updated"
    logger.info(f"Auto-syncing project {project_id} to HubSpot via signal ({reason})")
    
    try:
        # Use immediate execution for maximum reliability (no transaction dependency)
        result = sync_project_to_hubspot(
            project_id=project_id,
            reason=reason,
            use_transaction_commit=True
        )
        logger.info(f"Project {project_id} sync result: {result}")
    except Exception as e:
        # Never let signal failures break the main application
        logger.error(f"Project {project_id} signal sync failed: {e}", exc_info=True)
        
        # Clean up the sync lock if sync failed
        with _project_lock:
            if lock_key in _project_sync_locks:
                del _project_sync_locks[lock_key]
                logger.info(f"🧹 DEBUG: Cleaned up failed project sync lock for project {project_id}")


@receiver(post_save, sender='projects.Milestone')
@safe_signal_handler('Milestone Sync', MILESTONE_SIGNALS_ENABLED) 
def auto_sync_milestone_to_hubspot(sender, instance, created, **kwargs):
    """
    Automatically sync milestone summary to HubSpot.
    Syncs on creation and status updates to keep HubSpot milestone statuses current.
    """
    # Sync on both creation and updates (status changes need to be reflected in HubSpot)
        
    milestone_id = getattr(instance, 'id', None)
    if not milestone_id:
        logger.warning("Milestone instance has no ID - cannot sync to HubSpot")
        return
    
    # Check if milestone belongs to a real project
    project = getattr(instance, 'project', None)
    if not project or getattr(project, 'project_type', None) != 'real_project':
        if SIGNALS_DEBUG_MODE:
            logger.debug(f"Skipping HubSpot sync for milestone {milestone_id} - not for real project")
        return
    
    project_id = getattr(project, 'id', None)
    if not project_id:
        return
        
    # Always log signal entry for debugging
    logger.info(f"🔍 DEBUG: Milestone signal fired for milestone_id={milestone_id}, project_id={project_id}")
        
    # CRITICAL: Use thread-safe global lock to prevent duplicate syncs
    # This prevents multiple signals for the same project from running simultaneously
    lock_key = f"project_{project_id}_milestone_sync"
    current_time = time.time()
    
    with _milestone_lock:
        # Smart deduplication based on creation vs update
        if lock_key in _milestone_sync_locks:
            last_sync_time = _milestone_sync_locks[lock_key]
            time_diff = current_time - last_sync_time
            
            # For creation: be very strict - skip if ANY sync happened recently
            if created and time_diff < 30:  # 30 second window for milestone creation
                logger.info(f"❌ DEBUG: Project {project_id} milestone creation sync already happened ({time_diff:.1f}s ago) - SKIPPING")
                return
            # For rapid updates, apply stricter deduplication
            elif not created and time_diff < 10:  # 10 second window for milestone updates
                logger.info(f"❌ DEBUG: Project {project_id} milestone sync already in progress ({time_diff:.1f}s ago) - SKIPPING")
                return
        
        # For creation: check if milestone links already exist (don't create duplicates)
        # For updates: allow sync to update existing milestone summary
        from hubspot.models import HubSpotMilestoneLink
        existing_links = HubSpotMilestoneLink.objects.filter(
            milestone__project_id=project_id
        ).exists()
        
        if created and existing_links:
            logger.info(f"❌ DEBUG: Found existing milestone links for project {project_id} - SKIPPING creation sync")
            return
        
        # Claim this project for syncing
        _milestone_sync_locks[lock_key] = current_time
        logger.info(f"✅ DEBUG: Acquired sync lock for project {project_id} ({'creation' if created else 'update'})")
        
        # Clean up old locks (older than 5 minutes)
        expired_keys = [k for k, v in _milestone_sync_locks.items() if current_time - v > 300]
        for k in expired_keys:
            del _milestone_sync_locks[k]
    
    # Simple emoji indicator when signal fires
    sync_type = "creation" if created else "update"
    print(f"🎯 Django signal fired - Milestone {sync_type} sync (Project {project_id})")
    
    reason = f"signal_milestone_{sync_type}"
    logger.info(f"Auto-syncing milestone {sync_type} for project {project_id} via signal ({reason})")
    
    try:
        if created:
            # Use milestone creation sync (creates milestone summary for project)
            result = sync_milestone_to_hubspot(
                milestone_id=milestone_id,
                reason=reason,
                use_transaction_commit=True
            )
            logger.info(f"Milestone creation sync result for project {project_id}: {result}")
        else:
            # Use milestone update sync (updates existing milestone summary with new statuses)
            from hubspot.sync_utils import update_milestone_in_hubspot
            result = update_milestone_in_hubspot(
                milestone_id=milestone_id,
                reason=reason,
                use_transaction_commit=True
            )
            logger.info(f"Milestone update sync result for milestone {milestone_id}: {result}")
            
            # ADDED: Trigger revenue sync when milestone is approved (status update)
            if not created:  # Only for milestone updates, not creation
                try:
                    milestone = Milestone.objects.get(id=milestone_id)
                    if milestone.status == "approved":
                        # Trigger revenue sync for the month when milestone was approved
                        from django.utils import timezone
                        from hubspot.sync_utils import sync_revenue_to_hubspot
                        
                        completion_date = milestone.completion_date or timezone.now()
                        
                        print(f"💰 Django signal - Revenue sync triggered by milestone approval (Milestone {milestone_id})")
                        logger.info(f"Triggering revenue sync due to milestone {milestone_id} approval")
                        
                        # Sync revenue for the completion month
                        sync_result = sync_revenue_to_hubspot(
                            year=completion_date.year,
                            month=completion_date.month,
                            reason=f"milestone_approved_{milestone_id}",
                            use_transaction_commit=False
                        )
                        logger.info(f"Milestone approval revenue sync result: {sync_result}")
                except Exception as revenue_sync_error:
                    # Don't break milestone sync if revenue sync fails
                    logger.error(f"Revenue sync failed after milestone approval {milestone_id}: {revenue_sync_error}")
    except Exception as e:
        # Never let signal failures break the main application
        logger.error(f"Milestone summary sync failed for project {project_id}: {e}", exc_info=True)
        
        # Clean up the sync lock if sync failed
        with _milestone_lock:
            if lock_key in _milestone_sync_locks:
                del _milestone_sync_locks[lock_key]
                logger.info(f"🧹 DEBUG: Cleaned up failed sync lock for project {project_id}")


@receiver(post_save, sender=Payment)
@safe_signal_handler('Revenue Sync', REVENUE_SIGNALS_ENABLED)
def auto_sync_revenue_on_payment(sender, instance, created, **kwargs):
    """
    Automatically sync revenue to HubSpot when payments are marked as paid.
    Provides backup/redundancy to webhook-based revenue sync.
    """
    # Only sync when payment status becomes 'paid'
    if instance.status != 'paid':
        return
        
    payment_id = getattr(instance, 'id', None)
    if not payment_id:
        return
        
    # Simple emoji indicator when signal fires
    print("💰 Django signal fired - Revenue sync (Payment)")
    
    # Use transaction.on_commit for safety
    from django.db import transaction
    from django.utils import timezone
    from hubspot.sync_utils import sync_revenue_to_hubspot
    
    now = timezone.now()
    reason = "signal_payment_paid"
    
    logger.info(f"Auto-syncing revenue for payment {payment_id} via signal ({reason})")
    
    def _sync_revenue():
        try:
            result = sync_revenue_to_hubspot(
                year=now.year,
                month=now.month,
                reason=reason,
                use_transaction_commit=False  # Already in transaction.on_commit
            )
            logger.info(f"Payment {payment_id} revenue sync result: {result}")
        except Exception as e:
            # Never let signal failures break the main application
            logger.error(f"Payment {payment_id} revenue sync failed: {e}", exc_info=True)
    
    # Queue after transaction commit
    transaction.on_commit(_sync_revenue)


# Health check function for monitoring
def get_signals_status() -> dict:
    """
    Get status of HubSpot signal handlers for monitoring.
    
    Returns:
        dict: Signal handler status information
    """
    return {
        'user_signals_enabled': USER_SIGNALS_ENABLED,
        'project_signals_enabled': PROJECT_SIGNALS_ENABLED,
        'milestone_signals_enabled': MILESTONE_SIGNALS_ENABLED,
        'company_signals_enabled': COMPANY_SIGNALS_ENABLED,
        'revenue_signals_enabled': REVENUE_SIGNALS_ENABLED,
        'dispute_signals_enabled': DISPUTE_SIGNALS_ENABLED,
        'signals_debug_mode': SIGNALS_DEBUG_MODE,
        'hubspot_sync_enabled': HUBSPOT_SYNC_ENABLED,
        'total_signals_active': sum([
            USER_SIGNALS_ENABLED,
            PROJECT_SIGNALS_ENABLED,
            MILESTONE_SIGNALS_ENABLED,
            COMPANY_SIGNALS_ENABLED,
            REVENUE_SIGNALS_ENABLED,
            DISPUTE_SIGNALS_ENABLED
        ])
    }

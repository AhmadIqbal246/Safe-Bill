"""
Production-Ready HubSpot Sync Utilities

This module provides enterprise-grade wrapper functions for HubSpot task queueing
with comprehensive error handling, rate limiting, monitoring, and safety mechanisms.

Features:
- Robust error handling with retry logic
- Rate limiting protection  
- Comprehensive logging with structured data
- Feature flags for safe deployment
- Performance monitoring
- Graceful degradation
- Circuit breaker pattern
"""
import logging
import time
import functools
from typing import Optional, Any, Callable, Dict, List
from django.db import transaction
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
import json

# Use structured logging for better production monitoring
logger = logging.getLogger(__name__)

# Production settings with sensible defaults
HUBSPOT_SYNC_ENABLED = getattr(settings, 'HUBSPOT_SYNC_ENABLED', True)
HUBSPOT_SYNC_DEBUG = getattr(settings, 'HUBSPOT_SYNC_DEBUG', False)
HUBSPOT_SYNC_TIMEOUT = getattr(settings, 'HUBSPOT_SYNC_TIMEOUT', 30)
HUBSPOT_RATE_LIMIT_CACHE_KEY = 'hubspot_rate_limit'
HUBSPOT_RATE_LIMIT_WINDOW = getattr(settings, 'HUBSPOT_RATE_LIMIT_WINDOW', 60)  # seconds
HUBSPOT_RATE_LIMIT_MAX = getattr(settings, 'HUBSPOT_RATE_LIMIT_MAX', 100)  # requests per window

# Circuit breaker settings
CIRCUIT_BREAKER_FAILURE_THRESHOLD = getattr(settings, 'HUBSPOT_CIRCUIT_BREAKER_THRESHOLD', 5)
CIRCUIT_BREAKER_TIMEOUT = getattr(settings, 'HUBSPOT_CIRCUIT_BREAKER_TIMEOUT', 300)  # 5 minutes


class HubSpotSyncError(Exception):
    """Custom exception for HubSpot sync issues."""
    pass


class CircuitBreakerOpen(HubSpotSyncError):
    """Exception raised when circuit breaker is open."""
    pass


def circuit_breaker(func):
    """
    Circuit breaker decorator to prevent cascading failures.
    
    Opens circuit after consecutive failures, preventing further calls
    until timeout expires.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        cache_key = f"circuit_breaker_{func.__name__}"
        failure_count = cache.get(f"{cache_key}_failures", 0)
        last_failure = cache.get(f"{cache_key}_last_failure")
        
        # Check if circuit is open
        if failure_count >= CIRCUIT_BREAKER_FAILURE_THRESHOLD:
            if last_failure and (time.time() - last_failure) < CIRCUIT_BREAKER_TIMEOUT:
                logger.warning(f"🚫 Circuit breaker OPEN for {func.__name__}, failures: {failure_count}")
                raise CircuitBreakerOpen(f"Circuit breaker open for {func.__name__}")
            else:
                # Reset circuit breaker after timeout
                cache.delete(f"{cache_key}_failures")
                cache.delete(f"{cache_key}_last_failure")
                logger.info(f"🔄 Circuit breaker RESET for {func.__name__}")
        
        try:
            result = func(*args, **kwargs)
            # Reset failure count on success
            cache.delete(f"{cache_key}_failures")
            return result
        except Exception as e:
            # Increment failure count
            cache.set(f"{cache_key}_failures", failure_count + 1, CIRCUIT_BREAKER_TIMEOUT)
            cache.set(f"{cache_key}_last_failure", time.time(), CIRCUIT_BREAKER_TIMEOUT)
            logger.error(f"⚡ Circuit breaker recorded failure for {func.__name__}: {e}")
            raise
    
    return wrapper


def rate_limit_check() -> bool:
    """
    Check if we're within rate limits for HubSpot API calls.
    
    Returns:
        bool: True if within limits, False if rate limited
    """
    current_count = cache.get(HUBSPOT_RATE_LIMIT_CACHE_KEY, 0)
    if current_count >= HUBSPOT_RATE_LIMIT_MAX:
        logger.warning(f"🚦 HubSpot rate limit reached: {current_count}/{HUBSPOT_RATE_LIMIT_MAX}")
        return False
    
    # Increment counter
    cache.set(HUBSPOT_RATE_LIMIT_CACHE_KEY, current_count + 1, HUBSPOT_RATE_LIMIT_WINDOW)
    return True


def log_sync_attempt(task_name: str, args: tuple, kwargs: dict, success: bool, 
                    error: Optional[Exception] = None, duration: Optional[float] = None):
    """
    Log sync attempt with structured data for monitoring.
    
    Args:
        task_name: Name of the sync task
        args: Task arguments
        kwargs: Task keyword arguments  
        success: Whether the sync succeeded
        error: Exception if sync failed
        duration: Time taken for the operation
    """
    log_data = {
        'event': 'hubspot_sync_attempt',
        'task_name': task_name,
        'args': str(args),
        'success': success,
        'timestamp': timezone.now().isoformat(),
    }
    
    if duration:
        log_data['duration_seconds'] = round(duration, 3)
    
    if error:
        log_data['error_type'] = type(error).__name__
        log_data['error_message'] = str(error)
    
    if HUBSPOT_SYNC_DEBUG:
        log_data['kwargs'] = str(kwargs)
    
    if success:
        logger.info(f"✅ HubSpot sync success: {json.dumps(log_data)}")
    else:
        logger.error(f"❌ HubSpot sync failed: {json.dumps(log_data)}")


@circuit_breaker
def safe_hubspot_sync(
    task_func: Callable,
    task_name: str,
    *args,
    use_transaction_commit: bool = True,
    retry_on_failure: bool = True,
    **kwargs
) -> Dict[str, Any]:
    """
    Safely queue a HubSpot sync task with enterprise-grade error handling.
    
    Args:
        task_func: The Celery task function to call
        task_name: Human-readable name for logging
        *args: Arguments to pass to the task
        use_transaction_commit: Whether to use transaction.on_commit()
        retry_on_failure: Whether to retry failed operations
        **kwargs: Keyword arguments to pass to the task
        
    Returns:
        dict: Operation result with status and metadata
    """
    start_time = time.time()
    
    def _queue_task():
        """Inner function to actually queue the task."""
        if not HUBSPOT_SYNC_ENABLED:
            logger.info(f"🔕 HubSpot sync disabled, skipping {task_name}")
            return {'status': 'disabled', 'message': 'HubSpot sync disabled'}
        
        if not rate_limit_check():
            return {'status': 'rate_limited', 'message': 'Rate limit exceeded'}
        
        try:
            result = task_func.delay(*args, **kwargs)
            duration = time.time() - start_time
            log_sync_attempt(task_name, args, kwargs, True, duration=duration)
            
            return {
                'status': 'success',
                'task_id': result.id,
                'message': f'HubSpot {task_name} queued successfully'
            }
        except Exception as e:
            duration = time.time() - start_time
            log_sync_attempt(task_name, args, kwargs, False, error=e, duration=duration)
            
            if retry_on_failure and not isinstance(e, CircuitBreakerOpen):
                logger.warning(f"🔄 Retrying {task_name} after failure: {e}")
                try:
                    result = task_func.delay(*args, **kwargs)
                    log_sync_attempt(f"{task_name}_retry", args, kwargs, True)
                    return {
                        'status': 'success_retry',
                        'task_id': result.id,
                        'message': f'HubSpot {task_name} succeeded on retry'
                    }
                except Exception as retry_error:
                    log_sync_attempt(f"{task_name}_retry", args, kwargs, False, error=retry_error)
            
            return {
                'status': 'failed',
                'error': str(e),
                'error_type': type(e).__name__,
                'message': f'HubSpot {task_name} failed'
            }

    def _commit_callback():
        """Callback function for transaction.on_commit()."""
        try:
            result = _queue_task()
            if result['status'] in ['failed', 'rate_limited']:
                logger.warning(f"🔄 {task_name} commit callback issues, trying immediate fallback")
                # Try immediate fallback for certain failures
                if result['status'] == 'rate_limited':
                    # For rate limiting, we might want to delay the retry
                    logger.info(f"⏰ Delaying {task_name} due to rate limiting")
                else:
                    _queue_task()  # Immediate retry for other failures
        except Exception as e:
            logger.error(f"💥 {task_name} commit callback crashed: {e}", exc_info=True)

    if use_transaction_commit:
        try:
            transaction.on_commit(_commit_callback)
            logger.debug(f"📝 HubSpot {task_name} registered for transaction commit")
            return {'status': 'registered', 'message': f'{task_name} registered for commit'}
        except Exception as e:
            logger.error(f"⚠️ Failed to register {task_name} for commit: {e}", exc_info=True)
            # Fallback to immediate execution
            logger.info(f"🔄 Falling back to immediate {task_name} execution")
            return _queue_task()
    else:
        return _queue_task()


def safe_hubspot_sync_with_backup(task_func, task_name, *args, **kwargs):
    """Enhanced sync with immediate backup execution to prevent silent failures"""
    try:
        # Try the original method first
        result = safe_hubspot_sync(task_func, task_name, *args, **kwargs)
        
        # Only run backup if registration actually failed, not if it succeeded
        if result['status'] == 'failed':
            logger.info(f"🔄 {task_name} registration failed, trying immediate backup execution")
            try:
                backup_result = task_func.delay(*args, **kwargs)
                logger.info(f"✅ {task_name} backup queued: {backup_result.id}")
                return {'status': 'backup_success', 'task_id': backup_result.id}
            except Exception as backup_error:
                logger.error(f"❌ {task_name} backup failed: {backup_error}")
                return {'status': 'backup_failed', 'error': str(backup_error)}
        
        # If registered successfully, return the original result
        return result
    except Exception as e:
        logger.error(f"💥 {task_name} sync failed completely: {e}")
        # Last resort: try immediate execution
        try:
            result = task_func.delay(*args, **kwargs)
            logger.info(f"🚨 Emergency {task_name} execution: {result.id}")
            return {'status': 'emergency_success', 'task_id': result.id}
        except Exception as emergency_error:
            logger.error(f"💀 Complete failure for {task_name}: {emergency_error}")
            return {'status': 'complete_failure', 'error': str(emergency_error)}


def sync_project_to_hubspot(project_id: int, reason: str = "unknown", **kwargs) -> Dict[str, Any]:
    """
    Safely sync a project to HubSpot as a Deal.
    
    Args:
        project_id: The project ID to sync
        reason: Reason for syncing (for monitoring)
        **kwargs: Additional options for sync behavior
        
    Returns:
        dict: Operation result
    """
    from .tasks import sync_deal_task
    
    return safe_hubspot_sync_with_backup(
        sync_deal_task,
        f"Deal Sync (reason: {reason})",
        project_id,
        **kwargs
    )


def sync_milestone_to_hubspot(milestone_id: int, reason: str = "unknown", **kwargs) -> Dict[str, Any]:
    """
    Safely sync a milestone to HubSpot.
    
    Args:
        milestone_id: The milestone ID to sync
        reason: Reason for syncing (for monitoring)
        **kwargs: Additional options for sync behavior
        
    Returns:
        dict: Operation result
    """
    from .tasks import sync_milestone_task
    
    return safe_hubspot_sync_with_backup(
        sync_milestone_task,
        f"Milestone Sync (reason: {reason})",
        milestone_id,
        **kwargs
    )


def update_milestone_in_hubspot(milestone_id: int, reason: str = "unknown", **kwargs) -> Dict[str, Any]:
    """
    Safely update a milestone in HubSpot.
    
    Args:
        milestone_id: The milestone ID to update
        reason: Reason for updating (for monitoring)
        **kwargs: Additional options for sync behavior
        
    Returns:
        dict: Operation result
    """
    from .tasks import update_milestone_task
    
    return safe_hubspot_sync_with_backup(
        update_milestone_task,
        f"Milestone Update (reason: {reason})",
        milestone_id,
        **kwargs
    )


def sync_revenue_to_hubspot(year: int, month: int, reason: str = "unknown", **kwargs) -> Dict[str, Any]:
    """
    Safely sync revenue data to HubSpot.
    
    Args:
        year: Year for revenue sync
        month: Month for revenue sync  
        reason: Reason for syncing (for monitoring)
        **kwargs: Additional options for sync behavior
        
    Returns:
        dict: Operation result
    """
    from .tasks import sync_revenue_month_task
    
    return safe_hubspot_sync_with_backup(
        sync_revenue_month_task,
        f"Revenue Sync (reason: {reason})",
        year,
        month,
        **kwargs
    )


class HubSpotHealthCheck:
    """Production health monitoring for HubSpot integration."""
    
    @staticmethod
    def get_system_status() -> Dict[str, Any]:
        """
        Get comprehensive status of HubSpot integration.
        
        Returns:
            dict: System status information
        """
        status = {
            'timestamp': timezone.now().isoformat(),
            'hubspot_sync_enabled': HUBSPOT_SYNC_ENABLED,
            'rate_limit_status': {
                'current_count': cache.get(HUBSPOT_RATE_LIMIT_CACHE_KEY, 0),
                'limit': HUBSPOT_RATE_LIMIT_MAX,
                'window_seconds': HUBSPOT_RATE_LIMIT_WINDOW
            },
            'circuit_breaker_status': {},
            'recent_sync_attempts': []
        }
        
        # Check circuit breaker status for key functions
        for func_name in ['sync_deal_task', 'sync_milestone_task']:
            cache_key = f"circuit_breaker_{func_name}"
            failures = cache.get(f"{cache_key}_failures", 0)
            last_failure = cache.get(f"{cache_key}_last_failure")
            
            status['circuit_breaker_status'][func_name] = {
                'failure_count': failures,
                'is_open': failures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD,
                'last_failure': last_failure
            }
        
        return status
    
    @staticmethod
    def check_project_sync_status(project_id: int) -> Dict[str, Any]:
        """
        Check if a project is properly synced to HubSpot.
        
        Args:
            project_id: Project ID to check
            
        Returns:
            dict: Sync status information
        """
        try:
            from projects.models import Project
            from .services.DealsService import HubSpotClient
            
            project = Project.objects.get(id=project_id)
            client = HubSpotClient()
            
            # Check if deal exists in HubSpot  
            hubspot_deal = client.search_deal_by_project_id(str(project_id))
            
            return {
                'project_id': project_id,
                'project_name': project.name,
                'project_status': project.status,
                'project_type': project.project_type,
                'hubspot_synced': hubspot_deal is not None,
                'hubspot_deal_id': hubspot_deal.get('id') if hubspot_deal else None,
                'created_at': str(project.created_at) if hasattr(project, 'created_at') else None,
                'check_timestamp': timezone.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error checking sync status for project {project_id}: {e}")
            return {
                'project_id': project_id,
                'error': str(e),
                'error_type': type(e).__name__,
                'hubspot_synced': False,
                'check_timestamp': timezone.now().isoformat()
            }
    
    @staticmethod
    def find_recent_unsynced_projects(hours: int = 24, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Find recent projects that might not be synced to HubSpot.
        
        Args:
            hours: How many hours back to check
            limit: Maximum number of projects to check
            
        Returns:
            list: Projects that need syncing
        """
        from projects.models import Project
        from .services.DealsService import HubSpotClient
        from datetime import timedelta
        
        unsynced = []
        client = HubSpotClient()
        
        # Get recent real projects
        cutoff_time = timezone.now() - timedelta(hours=hours)
        projects = Project.objects.filter(
            project_type="real_project",
            created_at__gte=cutoff_time
        ).order_by("-created_at")[:limit]
        
        logger.info(f"🔍 Checking {projects.count()} recent projects for HubSpot sync status")
        
        for project in projects:
            try:
                hubspot_deal = client.search_deal_by_project_id(str(project.id))
                if not hubspot_deal:
                    unsynced.append({
                        'id': project.id,
                        'name': project.name,
                        'status': project.status,
                        'created_at': str(project.created_at),
                        'hours_ago': round((timezone.now() - project.created_at).total_seconds() / 3600, 1)
                    })
            except Exception as e:
                logger.error(f"Error checking project {project.id}: {e}")
                unsynced.append({
                    'id': project.id,
                    'name': getattr(project, 'name', 'Unknown'),
                    'error': str(e),
                    'created_at': str(getattr(project, 'created_at', 'Unknown'))
                })
                
        return unsynced


# Convenience functions for backward compatibility
def is_hubspot_sync_enabled() -> bool:
    """Check if HubSpot syncing is enabled."""
    return HUBSPOT_SYNC_ENABLED


def get_hubspot_sync_stats() -> Dict[str, Any]:
    """Get current sync statistics."""
    return HubSpotHealthCheck.get_system_status()


def safe_contact_sync(user_id: int, reason: str = "unknown") -> Dict[str, Any]:
    """
    Safely sync a contact to HubSpot with fallback.
    
    Args:
        user_id: The user ID to sync
        reason: Reason for syncing (for monitoring)
        
    Returns:
        dict: Operation result
    """
    from .tasks import sync_contact_task
    
    return safe_hubspot_sync_with_backup(
        sync_contact_task,
        f"Contact Sync (reason: {reason})",
        user_id
    )


def safe_company_sync(business_detail_id: int, reason: str = "unknown") -> Dict[str, Any]:
    """
    Safely sync a company to HubSpot with fallback.
    
    Args:
        business_detail_id: The business detail ID to sync
        reason: Reason for syncing (for monitoring)
        
    Returns:
        dict: Operation result
    """
    from .tasks import sync_company_task
    
    return safe_hubspot_sync_with_backup(
        sync_company_task,
        f"Company Sync (reason: {reason})",
        business_detail_id
    )
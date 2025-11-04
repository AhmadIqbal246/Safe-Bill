import logging
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import os
from django.db.models import Q
from utils.email_service import EmailService
from feedback.models import EmailLog

# Configure logging
logger = logging.getLogger(__name__)
# Rely on Celery's logging to output to terminal; do not add handlers here to avoid duplicates
logger.propagate = True

User = get_user_model()

@shared_task(bind=True, max_retries=3)
def send_verification_email_task(self, user_id, verification_url, user_type, language='fr'):
	"""
	Celery task to send verification email asynchronously
	"""
	try:
		# Retrieve user
		user = User.objects.get(pk=user_id)
		
		# Prepare user name
		user_name = user.get_full_name() or user.username or user.email.split('@')[0]
		
		# Send verification email
		result = EmailService.send_verification_email(
			user_email=user.email,
			user_name=user_name,
			verification_url=verification_url,
			user_type=user_type,
			language=language
		)
		
		# Log success
		logger.info(f"Verification email sent successfully to {user.email}")
		logger.info("email is sent using celery")
		return result
	
	except ObjectDoesNotExist:
		# Log user not found error
		logger.error(f"User with ID {user_id} not found")
		raise
	
	except Exception as exc:
		# Log any other errors and retry
		logger.error(f"Error sending verification email: {str(exc)}")
		
		# Retry with exponential backoff
		self.retry(exc=exc, countdown=2 ** self.request.retries)

@shared_task(bind=True, max_retries=3)
def send_welcome_email_task(self, user_id, user_type, language='fr'):
	"""
	Celery task to send welcome email asynchronously
	"""
	try:
		# Retrieve user
		user = User.objects.get(pk=user_id)
		
		# Prepare user name
		user_name = user.get_full_name() or user.username or user.email.split('@')[0]
		
		# Send welcome email
		result = EmailService.send_welcome_email(
			user_email=user.email,
			user_name=user_name,
			user_type=user_type,
			language=language
		)
		
		# Log success
		logger.info(f"Welcome email sent successfully to {user.email}")
		logger.info("email is sent using celery")
		return result
	
	except ObjectDoesNotExist:
		# Log user not found error
		logger.error(f"User with ID {user_id} not found")
		raise
	
	except Exception as exc:
		# Log any other errors and retry
		logger.error(f"Error sending welcome email: {str(exc)}")
		
		# Retry with exponential backoff
		self.retry(exc=exc, countdown=2 ** self.request.retries)

@shared_task(bind=True, max_retries=3)
def send_password_reset_email_task(self, user_id, reset_url, language='fr'):
	"""
	Celery task to send password reset email asynchronously
	"""
	try:
		# Retrieve user
		user = User.objects.get(pk=user_id)
		
		# Prepare user name
		user_name = user.get_full_name() or user.username or user.email.split('@')[0]
		
		# Send password reset email
		result = EmailService.send_password_reset_email(
			user_email=user.email,
			user_name=user_name,
			reset_url=reset_url,
			reset_code=None,  # You can pass reset code if needed
			language=language
		)
		
		# Log success
		logger.info(f"Password reset email sent successfully to {user.email}")
		logger.info("email is sent using celery")
		return result
	
	except ObjectDoesNotExist:
		# Log user not found error
		logger.error(f"User with ID {user_id} not found")
		raise
	
	except Exception as exc:
		# Log any other errors and retry
		logger.error(f"Error sending password reset email: {str(exc)}")
		
		# Retry with exponential backoff
		self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_relogin_reminder_email_task(self, user_id, language='fr'):
	"""
	Send the one-time re-login reminder email to a user.
	"""
	try:
		user = User.objects.get(pk=user_id)
		first_name = user.get_full_name() or user.username or (user.email.split('@')[0] if user.email else '')
		result = EmailService.send_reengage_login_email(
			user_email=user.email,
			first_name=first_name,
			language=language,
		)
		if result:
			EmailLog.objects.get_or_create(user=user, campaign_key='relogin_day10', defaults={'status': 'sent'})
		return result
	except Exception as exc:
		logger.error(f"Error sending re-login reminder email: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def orchestrate_relogin_reminder_task(self):
	"""
	Periodic orchestrator: finds eligible users (inactive for 10 days) and enqueues a
	ONE-TIME re-login reminder email.
	Eligibility:
	- is_active = True
	- is_email_verified = True
	- (last_login <= now - 10 days) OR (last_login is NULL and date_joined <= now - 10 days)
	- NOT already sent campaign 'relogin_day10'
	"""
	try:
		now = timezone.now()
		# Inactivity window controlled by env, defaults to 10 days
		inactivity_days = int(os.environ.get('RELOGIN_INACTIVITY_DAYS', '10'))
		threshold = now - timedelta(days=inactivity_days)
		users = (
			User.objects.filter(
				is_active=True,
				is_email_verified=True,
			).filter(
				Q(last_login__lte=threshold) | (Q(last_login__isnull=True) & Q(date_joined__lte=threshold))
			).exclude(
				email_logs__campaign_key='relogin_day10'
			).values('id', 'first_name', 'username')[:1000]
		)

		for u in users:
			language = 'fr'
			send_relogin_reminder_email_task.delay(u['id'], language)

		logger.info("Relogin reminder orchestrator enqueued emails.")
		return True
	except Exception as exc:
		logger.error(f"Error in relogin orchestrator: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_success_story_email_task(self, user_id, language='fr'):
	"""Send the success story email (one-time) in user's selected language."""
	try:
		user = User.objects.get(pk=user_id)
		first_name = user.get_full_name() or user.username or (user.email.split('@')[0] if user.email else '')
		
		# Use single campaign key since we're sending only one email per user
		campaign_key = 'success_story_day20'
		
		# Check if email has already been sent to this user
		if EmailLog.objects.filter(user=user, campaign_key=campaign_key).exists():
			logger.info(f"Success story email already sent to {user.email}")
			return True
		
		result = EmailService.send_success_story_email(
			user_email=user.email,
			first_name=first_name,
			language=language,
		)
		if result:
			EmailLog.objects.get_or_create(user=user, campaign_key=campaign_key, defaults={'status': 'sent'})
		return result
	except Exception as exc:
		logger.error(f"Error sending success story email: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def orchestrate_success_story_emails_task(self):
	"""Send success story email to all users after scheduled delay."""
	try:
		now = timezone.now()
		# Get delay from .env - required, no fallback
		delay_minutes = int(os.environ['SUCCESS_STORY_DELAY_MINUTES'])
		threshold = now - timedelta(minutes=delay_minutes)
		
		# Get ALL users who joined at least X minutes ago and haven't received the email
		# Removed filters: is_active, is_email_verified - sending to ALL users
		users = (
			User.objects.filter(date_joined__lte=threshold)
			.exclude(email_logs__campaign_key='success_story_day20')
			.values('id')[:1000]
		)
		
		for u in users:
			# Get full user object to determine language preference
			# Since User model doesn't have preferred_language field,
			# we need to check if language is stored elsewhere
			# For now, defaulting to French - TODO: Add logic to get user's selected language
			# Possible locations: Django sessions, user profile, or other storage
			user_obj = User.objects.filter(id=u['id']).first()
			
			# Default to French - replace this with actual language detection logic
			# Example: language = get_user_language_preference(user_obj) or 'fr'
			language = 'fr'  # Default to French until language preference storage is added
			
			send_success_story_email_task.delay(u['id'], language)
		logger.info(f"Success story orchestrator enqueued emails for {len(users)} users.")
		return True
	except Exception as exc:
		logger.error(f"Error in success story orchestrator: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)

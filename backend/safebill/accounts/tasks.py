import logging
import time
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import get_connection
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
def send_batch_relogin_emails_task(self, user_ids, batch_number=0):
	"""
	Send relogin reminder emails to multiple users using a single SMTP connection.
	Reuses one SMTP connection per batch and prevents duplicates via EmailLog.
	"""
	campaign_key = 'relogin_day10'
	connection = None
	successful = 0
	failed = 0
	skipped = 0

	try:
		connection = get_connection()
		connection.open()
		logger.info(f"Relogin email batch {batch_number}: Opened SMTP connection for batch of {len(user_ids)} users")

		for user_id in user_ids:
			try:
				user = User.objects.get(pk=user_id)
				first_name = user.get_full_name() or user.username or (user.email.split('@')[0] if user.email else '')

				# Skip if already sent
				if EmailLog.objects.filter(user=user, campaign_key=campaign_key).exists():
					skipped += 1
					continue

				language = 'fr'
				result = EmailService.send_reengage_login_email(
					user_email=user.email,
					first_name=first_name,
					language=language,
					connection=connection,
				)

				if result:
					EmailLog.objects.get_or_create(user=user, campaign_key=campaign_key, defaults={'status': 'sent'})
					successful += 1
				else:
					failed += 1

				# Throttle between emails (reuse success story delay env for now or set specific)
				delay_seconds = float(os.environ.get('RELOGIN_BATCH_DELAY_SECONDS', os.environ.get('EMAIL_BATCH_DELAY_SECONDS', '0.3')))
				time.sleep(delay_seconds)

			except User.DoesNotExist:
				logger.warning(f"Relogin email batch {batch_number}: User {user_id} not found")
				failed += 1
			except Exception as e:
				logger.error(f"Relogin email batch {batch_number}: Error sending to user {user_id}: {e}")
				failed += 1

		logger.info(
			f"Relogin email batch {batch_number}: Completed sending to {len(user_ids)} users "
			f"(successful: {successful}, failed: {failed}, skipped: {skipped})"
		)
		return {'successful': successful, 'failed': failed, 'skipped': skipped, 'total': len(user_ids)}

	except Exception as exc:
		logger.error(f"Relogin email batch {batch_number}: Error in batch processing: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)
	finally:
		if connection:
			try:
				connection.close()
				logger.info(f"Relogin email batch {batch_number}: Closed SMTP connection")
			except Exception as e:
				logger.error(f"Relogin email batch {batch_number}: Error closing connection: {e}")


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
		# Inactivity window (REQUIRED) from env in MINUTES; no fallback
		inactivity_minutes = int(os.environ['RELOGIN_INACTIVITY_MINUTES'])
		threshold = now - timedelta(minutes=inactivity_minutes)
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

		# Batch size for relogin emails (default 50, configurable via env)
		batch_size = int(os.environ.get('RELOGIN_BATCH_SIZE', '50'))
		users_list = list(users)
		total_users = len(users_list)

		if total_users == 0:
			logger.info("Relogin orchestrator: No eligible users found")
			return True

		batch_number = 0
		for i in range(0, total_users, batch_size):
			batch = users_list[i:i+batch_size]
			user_ids = [u['id'] for u in batch]
			batch_number += 1
			send_batch_relogin_emails_task.delay(user_ids, batch_number)
			logger.info(f"Relogin orchestrator: Queued batch {batch_number} with {len(user_ids)} users")

		logger.info(f"Relogin orchestrator: Queued {batch_number} batches for {total_users} eligible users (batch size: {batch_size})")
		return True
	except Exception as exc:
		logger.error(f"Error in relogin orchestrator: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_batch_success_story_emails_task(self, user_ids, batch_number=0):
	"""
	Send success story emails to multiple users using a single SMTP connection.
	This reduces authentication attempts and prevents rate limiting.
	
	Args:
		user_ids: List of user IDs to send emails to
		batch_number: Batch number for logging purposes
	"""
	campaign_key = 'success_story_day20'
	connection = None
	successful = 0
	failed = 0
	skipped = 0
	
	try:
		# Get SMTP connection (Django caches it)
		connection = get_connection()
		
		# Open connection once (authenticates once for entire batch)
		connection.open()
		logger.info(f"Success story email batch {batch_number}: Opened SMTP connection for batch of {len(user_ids)} users")
		
		# Send emails to all users in batch using the same connection
		for user_id in user_ids:
			try:
				user = User.objects.get(pk=user_id)
				first_name = user.get_full_name() or user.username or (user.email.split('@')[0] if user.email else '')
				
				# Check if email has already been sent to this user (duplicate prevention)
				if EmailLog.objects.filter(user=user, campaign_key=campaign_key).exists():
					skipped += 1
					continue
				
				# Default to French - replace this with actual language detection logic
				language = 'fr'
				
				# Send email using shared connection
				result = EmailService.send_success_story_email(
					user_email=user.email,
					first_name=first_name,
					language=language,
					connection=connection,  # Reuse connection
				)
				
				if result:
					# Log email send immediately
					EmailLog.objects.get_or_create(
						user=user,
						campaign_key=campaign_key,
						defaults={'status': 'sent'}
					)
					successful += 1
				else:
					failed += 1
				
				# Delay between emails to prevent rate limiting (configurable via .env)
				# Default: 0.3 seconds (300ms) - safer than 0.1s for SMTP servers
				delay_seconds = float(os.environ.get('EMAIL_BATCH_DELAY_SECONDS', '0.3'))
				time.sleep(delay_seconds)
				
			except User.DoesNotExist:
				logger.warning(f"Success story email batch {batch_number}: User {user_id} not found")
				failed += 1
			except Exception as e:
				logger.error(f"Success story email batch {batch_number}: Error sending to user {user_id}: {e}")
				failed += 1
		
		logger.info(
			f"Success story email batch {batch_number}: Completed sending to {len(user_ids)} users "
			f"(successful: {successful}, failed: {failed}, skipped: {skipped})"
		)
		
		return {
			'successful': successful,
			'failed': failed,
			'skipped': skipped,
			'total': len(user_ids)
		}
		
	except Exception as exc:
		logger.error(f"Success story email batch {batch_number}: Error in batch processing: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)
	finally:
		# Always close connection
		if connection:
			try:
				connection.close()
				logger.info(f"Success story email batch {batch_number}: Closed SMTP connection")
			except Exception as e:
				logger.error(f"Success story email batch {batch_number}: Error closing connection: {e}")


@shared_task(bind=True, max_retries=3, queue='emails')
def orchestrate_success_story_emails_task(self):
	"""
	Orchestrates sending success story emails to all eligible users.
	Groups users into batches and queues batch tasks for processing.
	"""
	try:
		now = timezone.now()
		# Get delay from .env - required, no fallback
		delay_minutes = int(os.environ['SUCCESS_STORY_DELAY_MINUTES'])
		threshold = now - timedelta(minutes=delay_minutes)
		
		# Get batch size from .env, default to 50
		batch_size = int(os.environ.get('SUCCESS_STORY_BATCH_SIZE', '50'))
		
		# Get ALL users who joined at least X minutes ago and haven't received the email
		# Removed filters: is_active, is_email_verified - sending to ALL users
		users = (
			User.objects.filter(date_joined__lte=threshold)
			.exclude(email_logs__campaign_key='success_story_day20')
			.values('id')[:1000]
		)
		
		users_list = list(users)
		total_users = len(users_list)
		
		if total_users == 0:
			logger.info("Success story orchestrator: No eligible users found")
			return True
		
		# Create batches
		batch_number = 0
		for i in range(0, total_users, batch_size):
			batch = users_list[i:i+batch_size]
			user_ids = [u['id'] for u in batch]
			batch_number += 1
			
			# Queue batch task
			send_batch_success_story_emails_task.delay(user_ids, batch_number)
			logger.info(f"Success story orchestrator: Queued batch {batch_number} with {len(user_ids)} users")
		
		logger.info(
			f"Success story orchestrator: Queued {batch_number} batches "
			f"for {total_users} eligible users (batch size: {batch_size})"
		)
		return True
		
	except Exception as exc:
		logger.error(f"Error in success story orchestrator: {exc}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)


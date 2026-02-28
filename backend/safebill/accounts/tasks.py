import logging
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from utils.email_service import EmailService

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

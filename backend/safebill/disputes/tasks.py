import logging
from celery import shared_task
from utils.email_service import EmailService

logger = logging.getLogger(__name__)
logger.propagate = True

@shared_task(bind=True, max_retries=3)
def send_dispute_created_email_task(self, seller_email, seller_name, project_name, dispute_id, language='en'):
	"""
	Send dispute-created email to seller asynchronously via Celery
	"""
	try:
		result = EmailService.send_dispute_created_email(
			seller_email=seller_email,
			seller_name=seller_name,
			project_name=project_name,
			dispute_id=dispute_id,
			language=language,
		)
		logger.info(f"Dispute-created email sent to {seller_email}")
		logger.info("email is sent using celery")
		return result
	except Exception as exc:
		logger.error(f"Error sending dispute-created email: {str(exc)}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)

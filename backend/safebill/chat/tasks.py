import logging
from celery import shared_task
from utils.email_service import EmailService

logger = logging.getLogger(__name__)
logger.propagate = True

@shared_task(bind=True, max_retries=3)
def send_quote_chat_notification_task(self, seller_email, seller_name, buyer_name, buyer_email, project_name, message_preview, language='en'):
	"""
	Celery task to send quote chat notification email asynchronously
	"""
	try:
		result = EmailService.send_quote_chat_notification(
			seller_email=seller_email,
			seller_name=seller_name,
			buyer_name=buyer_name,
			buyer_email=buyer_email,
			project_name=project_name,
			message_preview=message_preview,
			language=language,
		)
		logger.info(f"Quote chat notification email sent successfully to {seller_email}")
		logger.info("email is sent using celery")
		return result
	except Exception as exc:
		logger.error(f"Error sending quote chat notification email: {str(exc)}")
		self.retry(exc=exc, countdown=2 ** self.request.retries)





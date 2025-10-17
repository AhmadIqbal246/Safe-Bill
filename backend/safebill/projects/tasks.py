import logging
from celery import shared_task
from utils.email_service import EmailService

# Configure logging
logger = logging.getLogger(__name__)
# Rely on Celery's logging to output to terminal; do not add handlers here to avoid duplicates
logger.propagate = True

@shared_task(bind=True, max_retries=3, queue='emails')
def send_project_invitation_email_task(self, client_email, project_name, invitation_url, invitation_token, language='en'):
    """
    Celery task to send project invitation email asynchronously
    """
    try:
        # Send project invitation email
        result = EmailService.send_project_invitation_email(
            client_email=client_email,
            project_name=project_name,
            invitation_url=invitation_url,
            invitation_token=invitation_token,
            language=language
        )
        
        # Log success
        logger.info(f"Project invitation email sent successfully to {client_email}")
        logger.info("email is sent using celery")
        return result
    
    except Exception as exc:
        # Log any other errors and retry
        logger.error(f"Error sending project invitation email: {str(exc)}")
        
        # Retry with exponential backoff
        self.retry(exc=exc, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3, queue='emails')
def send_milestone_approval_request_email_task(
    self,
    user_email,
    user_name,
    project_name,
    milestone_name,
    amount,
    language='fr',
):
    """Send milestone approval request email to buyer asynchronously."""
    try:
        return EmailService.send_milestone_approval_request_email(
            user_email=user_email,
            user_name=user_name,
            project_name=project_name,
            milestone_name=milestone_name,
            amount=str(amount),
            language=language,
        )
    except Exception as exc:
        logger.error(f"Error sending milestone approval request email: {str(exc)}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)
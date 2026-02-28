from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


def send_payment_websocket_update(
    project_id,
    payment_status,
    payment_amount=None,
    project_status=None,
    updated_at=None,
):
    """
    Utility method to send WebSocket updates for payment and project status changes

    Args:
        project_id (int): The project ID
        payment_status (str): The payment status (e.g., 'paid', 'failed', 'pending')
        payment_amount (float, optional): The payment amount
        project_status (str, optional): The project status (e.g., 'approved', 'pending')
        updated_at (datetime, optional): The update timestamp
    """
    try:
        channel_layer = get_channel_layer()
        group_name = f"payment_status_{project_id}"

        # Send payment status update
        payment_data = {
            "status": payment_status,
        }

        if payment_amount is not None:
            # Convert Decimal to float for JSON serialization
            payment_data["amount"] = float(payment_amount)

        if updated_at is not None:
            payment_data["updated_at"] = updated_at.isoformat() if updated_at else None

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "payment_status_update",
                "data": payment_data,
            },
        )

        # Send project status update if provided
        if project_status is not None:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "project_status_update",
                    "data": {
                        "status": project_status,
                        "project_id": project_id,
                    },
                },
            )

        logger.info(
            f"Sent WebSocket update for project {project_id}: payment={payment_status}, project={project_status}"
        )

    except Exception as e:
        logger.error(f"Error sending WebSocket update for project {project_id}: {e}")


def send_payment_status_update(
    project_id, payment_status, payment_amount=None, updated_at=None
):
    """
    Utility method to send only payment status WebSocket updates

    Args:
        project_id (int): The project ID
        payment_status (str): The payment status
        payment_amount (float, optional): The payment amount
        updated_at (datetime, optional): The update timestamp
    """
    send_payment_websocket_update(
        project_id=project_id,
        payment_status=payment_status,
        payment_amount=payment_amount,
        updated_at=updated_at,
    )


def send_project_status_update(project_id, project_status):
    """
    Utility method to send only project status WebSocket updates

    Args:
        project_id (int): The project ID
        project_status (str): The project status
    """
    send_payment_websocket_update(
        project_id=project_id, payment_status=None, project_status=project_status
    )

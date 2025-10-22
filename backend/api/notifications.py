"""
MediMate Notifications API

RESTful API endpoints for managing notifications:
- Send email notifications
- Send SMS notifications  
- Schedule future notifications
- Get notification history
- Manage notification preferences
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Body
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

from models.notifications import (
    EmailNotificationRequest,
    SMSNotificationRequest,
    NotificationResponse,
    ScheduledNotificationRequest,
    NotificationHistoryResponse,
    NotificationPreferences
)
from services.notification_service import notification_service
from utils.auth import get_current_user
from utils.validators import validate_email, validate_phone_number

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.post("/email", response_model=NotificationResponse)
async def send_email_notification(
    request: EmailNotificationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """
    Send an email notification.
    
    Supports various templates and custom content.
    """
    try:
        # Validate email address
        if not validate_email(request.recipient_email):
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        # Check user permissions (users can only send to themselves unless admin)
        if current_user['role'] != 'admin' and request.recipient_email != current_user['email']:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Send email in background
        background_tasks.add_task(
            notification_service.send_email_notification,
            recipient_email=request.recipient_email,
            template_name=request.template_name,
            template_data=request.template_data,
            subject_override=request.subject_override,
            attachments=request.attachments
        )
        
        logger.info(f"Email notification queued for {request.recipient_email}")
        return NotificationResponse(
            success=True,
            message="Email notification queued successfully",
            notification_id=f"email_{datetime.utcnow().timestamp()}"
        )
        
    except Exception as e:
        logger.error(f"Failed to queue email notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sms", response_model=NotificationResponse)
async def send_sms_notification(
    request: SMSNotificationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """
    Send an SMS notification.
    
    Supports templates and custom messages.
    """
    try:
        # Validate phone number
        if not validate_phone_number(request.phone_number):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        
        # Check user permissions
        if current_user['role'] != 'admin' and request.phone_number != current_user.get('phone'):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Send SMS in background
        background_tasks.add_task(
            notification_service.send_sms_notification,
            phone_number=request.phone_number,
            template_name=request.template_name,
            template_data=request.template_data,
            message_override=request.message_override
        )
        
        logger.info(f"SMS notification queued for {request.phone_number}")
        return NotificationResponse(
            success=True,
            message="SMS notification queued successfully",
            notification_id=f"sms_{datetime.utcnow().timestamp()}"
        )
        
    except Exception as e:
        logger.error(f"Failed to queue SMS notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/appointment/confirmation", response_model=NotificationResponse)
async def send_appointment_confirmation(
    appointment_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """
    Send appointment confirmation notifications.
    
    Sends both email and SMS (if phone provided).
    """
    try:
        # Validate required fields
        required_fields = ['patient_email', 'doctor_name', 'date', 'time', 'appointment_id']
        for field in required_fields:
            if field not in appointment_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Check permissions
        if current_user['role'] != 'admin' and appointment_data['patient_email'] != current_user['email']:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Send confirmation in background
        background_tasks.add_task(
            notification_service.send_appointment_confirmation,
            patient_email=appointment_data['patient_email'],
            patient_phone=appointment_data.get('patient_phone'),
            appointment_data=appointment_data
        )
        
        logger.info(f"Appointment confirmation queued for {appointment_data['patient_email']}")
        return NotificationResponse(
            success=True,
            message="Appointment confirmation notifications queued",
            notification_id=f"appointment_{appointment_data['appointment_id']}"
        )
        
    except Exception as e:
        logger.error(f"Failed to queue appointment confirmation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/appointment/reminder", response_model=NotificationResponse)
async def send_appointment_reminder(
    appointment_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    reminder_hours: int = 24,
    current_user: Dict = Depends(get_current_user)
):
    """
    Send appointment reminder notifications.
    
    Default reminder is 24 hours before appointment.
    """
    try:
        # Validate required fields
        required_fields = ['patient_email', 'doctor_name', 'date', 'time']
        for field in required_fields:
            if field not in appointment_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Check permissions
        if current_user['role'] != 'admin' and appointment_data['patient_email'] != current_user['email']:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Send reminder in background
        background_tasks.add_task(
            notification_service.send_appointment_reminder,
            patient_email=appointment_data['patient_email'],
            patient_phone=appointment_data.get('patient_phone'),
            appointment_data=appointment_data,
            reminder_hours=reminder_hours
        )
        
        logger.info(f"Appointment reminder queued for {appointment_data['patient_email']}")
        return NotificationResponse(
            success=True,
            message=f"Appointment reminder queued for {reminder_hours} hours before",
            notification_id=f"reminder_{datetime.utcnow().timestamp()}"
        )
        
    except Exception as e:
        logger.error(f"Failed to queue appointment reminder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/health-alert", response_model=NotificationResponse)
async def send_health_alert(
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    alert_data: Dict[str, Any] = Body(...),
    reminder_hours: int = 24
):
    """
    Send health alert notifications.
    
    Urgency levels: low, medium, high
    High urgency alerts also send SMS.
    """
    try:
        # Validate urgency level
        if urgency not in ['low', 'medium', 'high']:
            raise HTTPException(status_code=400, detail="Invalid urgency level")
        
        # Validate required fields
        required_fields = ['patient_email', 'alert_title', 'alert_message']
        for field in required_fields:
            if field not in alert_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Check permissions (doctors and admins can send alerts)
        if current_user['role'] not in ['doctor', 'admin']:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Send alert in background
        background_tasks.add_task(
            notification_service.send_health_alert,
            patient_email=alert_data['patient_email'],
            patient_phone=alert_data.get('patient_phone'),
            alert_data=alert_data,
            urgency=urgency
        )
        
        logger.info(f"Health alert ({urgency}) queued for {alert_data['patient_email']}")
        return NotificationResponse(
            success=True,
            message=f"Health alert ({urgency} urgency) queued successfully",
            notification_id=f"alert_{datetime.utcnow().timestamp()}"
        )
        
    except Exception as e:
        logger.error(f"Failed to queue health alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule", response_model=NotificationResponse)
async def schedule_notification(
    request: ScheduledNotificationRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Schedule a future notification.
    
    Uses DynamoDB TTL for automatic delivery.
    """
    try:
        # Validate send time is in the future
        if request.send_time <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Send time must be in the future")
        
        # Check permissions
        if current_user['role'] not in ['doctor', 'admin']:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Schedule notification
        result = await notification_service.schedule_reminder(
            notification_data=request.notification_data,
            send_time=request.send_time
        )
        
        if result['success']:
            logger.info(f"Notification scheduled for {request.send_time}")
            return NotificationResponse(
                success=True,
                message=f"Notification scheduled for {request.send_time}",
                notification_id=result['notification_id']
            )
        else:
            raise HTTPException(status_code=500, detail=result['error'])
        
    except Exception as e:
        logger.error(f"Failed to schedule notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[NotificationHistoryResponse])
async def get_notification_history(
    limit: int = 50,
    offset: int = 0,
    notification_type: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get notification history for the current user.
    
    Supports filtering by type and pagination.
    """
    try:
        # For now, return mock data since we need DynamoDB integration
        # In production, this would query the notifications log table
        
        mock_history = [
            {
                'notification_id': 'email_1234567890',
                'type': 'email',
                'recipient': current_user['email'],
                'template': 'appointment_confirmation',
                'status': 'sent',
                'sent_at': datetime.utcnow().isoformat(),
                'subject': 'Appointment Confirmed'
            },
            {
                'notification_id': 'sms_1234567891',
                'type': 'sms',
                'recipient': current_user.get('phone', '+1234567890'),
                'template': 'appointment_reminder',
                'status': 'sent',
                'sent_at': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                'subject': 'Appointment Reminder'
            }
        ]
        
        # Filter by type if specified
        if notification_type:
            mock_history = [n for n in mock_history if n['type'] == notification_type]
        
        # Apply pagination
        paginated_history = mock_history[offset:offset + limit]
        
        logger.info(f"Retrieved {len(paginated_history)} notification history records")
        return [NotificationHistoryResponse(**item) for item in paginated_history]
        
    except Exception as e:
        logger.error(f"Failed to get notification history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: Dict = Depends(get_current_user)
):
    """Get user's notification preferences."""
    try:
        # For now, return default preferences
        # In production, this would query user preferences from database
        
        preferences = NotificationPreferences(
            email_enabled=True,
            sms_enabled=current_user.get('phone') is not None,
            appointment_reminders=True,
            health_alerts=True,
            marketing_emails=False,
            reminder_hours_before=24
        )
        
        logger.info(f"Retrieved notification preferences for user {current_user['user_id']}")
        return preferences
        
    except Exception as e:
        logger.error(f"Failed to get notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: Dict = Depends(get_current_user)
):
    """Update user's notification preferences."""
    try:
        # For now, just return the updated preferences
        # In production, this would update the database
        
        logger.info(f"Updated notification preferences for user {current_user['user_id']}")
        return preferences
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/email", response_model=NotificationResponse)
async def test_email_notification(
    recipient_email: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Send a test email notification.
    
    For testing purposes only - admin access required.
    """
    try:
        # Admin only
        if current_user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Send test email
        result = await notification_service.send_email_notification(
            recipient_email=recipient_email,
            template_name='welcome',
            template_data={
                'patient_name': 'Test User',
                'dashboard_link': 'https://medimate.com/dashboard'
            }
        )
        
        if result['success']:
            return NotificationResponse(
                success=True,
                message="Test email sent successfully",
                notification_id=result['message_id']
            )
        else:
            raise HTTPException(status_code=500, detail=result['error'])
        
    except Exception as e:
        logger.error(f"Failed to send test email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/sms", response_model=NotificationResponse)
async def test_sms_notification(
    phone_number: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Send a test SMS notification.
    
    For testing purposes only - admin access required.
    """
    try:
        # Admin only
        if current_user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate phone number
        if not validate_phone_number(phone_number):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        
        # Send test SMS
        result = await notification_service.send_sms_notification(
            phone_number=phone_number,
            template_name='verification_code',
            template_data={'code': '123456'}
        )
        
        if result['success']:
            return NotificationResponse(
                success=True,
                message="Test SMS sent successfully",
                notification_id=result['message_id']
            )
        else:
            raise HTTPException(status_code=500, detail=result['error'])
        
    except Exception as e:
        logger.error(f"Failed to send test SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
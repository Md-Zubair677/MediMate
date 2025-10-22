"""
MediMate Notification Models

Pydantic models for notification system:
- Email and SMS notification requests
- Notification responses and history
- User notification preferences
- Scheduled notification models
"""

from pydantic import BaseModel, validator
from typing import Dict, List, Optional, Any
from datetime import datetime
import re

class EmailNotificationRequest(BaseModel):
    """Request model for sending email notifications."""
    recipient_email: str
    template_name: str
    template_data: Dict[str, Any]
    subject_override: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    
    @validator('template_name')
    def validate_template_name(cls, v):
        valid_templates = [
            'appointment_confirmation',
            'appointment_reminder', 
            'health_alert',
            'welcome',
            'password_reset',
            'medical_report_ready'
        ]
        if v not in valid_templates:
            raise ValueError(f'Invalid template name. Must be one of: {valid_templates}')
        return v

class SMSNotificationRequest(BaseModel):
    """Request model for sending SMS notifications."""
    phone_number: str
    template_name: str
    template_data: Dict[str, Any]
    message_override: Optional[str] = None
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        # E.164 format validation
        pattern = r'^\+[1-9]\d{1,14}$'
        if not re.match(pattern, v):
            raise ValueError('Phone number must be in E.164 format (e.g., +1234567890)')
        return v
    
    @validator('template_name')
    def validate_template_name(cls, v):
        valid_templates = [
            'appointment_reminder',
            'urgent_alert',
            'verification_code'
        ]
        if v not in valid_templates:
            raise ValueError(f'Invalid template name. Must be one of: {valid_templates}')
        return v

class NotificationResponse(BaseModel):
    """Response model for notification operations."""
    success: bool
    message: str
    notification_id: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None

class ScheduledNotificationRequest(BaseModel):
    """Request model for scheduling future notifications."""
    notification_data: Dict[str, Any]
    send_time: datetime
    notification_type: str  # 'email' or 'sms'
    
    @validator('send_time')
    def validate_send_time(cls, v):
        if v <= datetime.utcnow():
            raise ValueError('Send time must be in the future')
        return v
    
    @validator('notification_type')
    def validate_notification_type(cls, v):
        if v not in ['email', 'sms']:
            raise ValueError('Notification type must be either "email" or "sms"')
        return v

class NotificationHistoryResponse(BaseModel):
    """Response model for notification history."""
    notification_id: str
    type: str  # 'email' or 'sms'
    recipient: str
    template: str
    status: str  # 'sent', 'failed', 'pending'
    sent_at: str
    subject: Optional[str] = None
    error_message: Optional[str] = None

class NotificationPreferences(BaseModel):
    """Model for user notification preferences."""
    email_enabled: bool = True
    sms_enabled: bool = False
    appointment_reminders: bool = True
    health_alerts: bool = True
    marketing_emails: bool = False
    reminder_hours_before: int = 24
    
    @validator('reminder_hours_before')
    def validate_reminder_hours(cls, v):
        if v < 1 or v > 168:  # 1 hour to 1 week
            raise ValueError('Reminder hours must be between 1 and 168 (1 week)')
        return v

class AppointmentNotificationData(BaseModel):
    """Model for appointment notification data."""
    patient_name: str
    patient_email: str
    patient_phone: Optional[str] = None
    doctor_name: str
    specialty: str
    date: str
    time: str
    duration: int = 30
    location: str
    appointment_id: str
    calendar_link: Optional[str] = None
    directions_link: Optional[str] = None
    reschedule_link: Optional[str] = None

class HealthAlertData(BaseModel):
    """Model for health alert notification data."""
    patient_name: str
    patient_email: str
    patient_phone: Optional[str] = None
    alert_title: str
    alert_message: str
    recommendations: str
    urgency: str = 'medium'
    action_link: Optional[str] = None
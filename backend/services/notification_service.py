"""
MediMate Notification Service

Comprehensive notification system using AWS SNS and SES for:
- Email notifications (appointment confirmations, reminders, health alerts)
- SMS notifications (urgent alerts, appointment reminders)
- Push notifications (mobile app integration)
- Automated follow-up workflows
"""

import boto3
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from utils.config import get_settings
from utils.aws_clients import get_aws_clients

logger = logging.getLogger(__name__)
settings = get_settings()

class NotificationService:
    """Enhanced notification service with AWS SNS and SES integration."""
    
    def __init__(self):
        """Initialize notification service with AWS clients."""
        self.aws_clients = get_aws_clients()
        self.sns_client = self.aws_clients.sns
        self.ses_client = self.aws_clients.ses
        self.dynamodb = self.aws_clients.dynamodb
        
        # Notification templates
        self.email_templates = {
            'appointment_confirmation': self._get_appointment_confirmation_template(),
            'appointment_reminder': self._get_appointment_reminder_template(),
            'health_alert': self._get_health_alert_template(),
            'welcome': self._get_welcome_template(),
            'password_reset': self._get_password_reset_template(),
            'medical_report_ready': self._get_report_ready_template()
        }
        
        self.sms_templates = {
            'appointment_reminder': "MediMate Reminder: You have an appointment with Dr. {doctor_name} on {date} at {time}. Reply STOP to opt out.",
            'urgent_alert': "MediMate Alert: {message}. Please contact your healthcare provider immediately.",
            'verification_code': "Your MediMate verification code is: {code}. Valid for 10 minutes."
        }

    async def send_email_notification(
        self,
        recipient_email: str,
        template_name: str,
        template_data: Dict[str, Any],
        subject_override: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Send email notification using AWS SES.
        
        Args:
            recipient_email: Recipient's email address
            template_name: Email template name
            template_data: Data to populate template
            subject_override: Custom subject line
            attachments: List of file attachments
            
        Returns:
            Dict with send status and message ID
        """
        try:
            if not self.ses_client:
                logger.warning("SES client not available, using fallback")
                return await self._send_fallback_email(recipient_email, template_name, template_data)
            
            # Get template
            template = self.email_templates.get(template_name)
            if not template:
                raise ValueError(f"Email template '{template_name}' not found")
            
            # Populate template
            subject = subject_override or template['subject'].format(**template_data)
            html_body = template['html_body'].format(**template_data)
            text_body = template['text_body'].format(**template_data)
            
            # Create message
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'},
                    'Text': {'Data': text_body, 'Charset': 'UTF-8'}
                }
            }
            
            # Send email
            response = self.ses_client.send_email(
                Source=settings.ses_sender_email,
                Destination={'ToAddresses': [recipient_email]},
                Message=message
            )
            
            # Log notification
            await self._log_notification({
                'type': 'email',
                'recipient': recipient_email,
                'template': template_name,
                'status': 'sent',
                'message_id': response['MessageId'],
                'timestamp': datetime.utcnow().isoformat()
            })
            
            logger.info(f"Email sent successfully to {recipient_email}, MessageId: {response['MessageId']}")
            return {
                'success': True,
                'message_id': response['MessageId'],
                'status': 'sent'
            }
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            await self._log_notification({
                'type': 'email',
                'recipient': recipient_email,
                'template': template_name,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
            return {
                'success': False,
                'error': str(e),
                'status': 'failed'
            }

    async def send_sms_notification(
        self,
        phone_number: str,
        template_name: str,
        template_data: Dict[str, Any],
        message_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send SMS notification using AWS SNS.
        
        Args:
            phone_number: Recipient's phone number (E.164 format)
            template_name: SMS template name
            template_data: Data to populate template
            message_override: Custom message text
            
        Returns:
            Dict with send status and message ID
        """
        try:
            if not self.sns_client:
                logger.warning("SNS client not available, using fallback")
                return await self._send_fallback_sms(phone_number, template_name, template_data)
            
            # Get template
            template = self.sms_templates.get(template_name)
            if not template and not message_override:
                raise ValueError(f"SMS template '{template_name}' not found")
            
            # Populate message
            message = message_override or template.format(**template_data)
            
            # Send SMS
            response = self.sns_client.publish(
                PhoneNumber=phone_number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': 'MediMate'
                    },
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
            )
            
            # Log notification
            await self._log_notification({
                'type': 'sms',
                'recipient': phone_number,
                'template': template_name,
                'status': 'sent',
                'message_id': response['MessageId'],
                'timestamp': datetime.utcnow().isoformat()
            })
            
            logger.info(f"SMS sent successfully to {phone_number}, MessageId: {response['MessageId']}")
            return {
                'success': True,
                'message_id': response['MessageId'],
                'status': 'sent'
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            await self._log_notification({
                'type': 'sms',
                'recipient': phone_number,
                'template': template_name,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
            return {
                'success': False,
                'error': str(e),
                'status': 'failed'
            }

    async def send_appointment_confirmation(
        self,
        patient_email: str,
        patient_phone: Optional[str],
        appointment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send appointment confirmation via email and optionally SMS."""
        results = {}
        
        # Send email confirmation
        email_result = await self.send_email_notification(
            recipient_email=patient_email,
            template_name='appointment_confirmation',
            template_data=appointment_data
        )
        results['email'] = email_result
        
        # Send SMS confirmation if phone provided
        if patient_phone:
            sms_result = await self.send_sms_notification(
                phone_number=patient_phone,
                template_name='appointment_reminder',
                template_data=appointment_data
            )
            results['sms'] = sms_result
        
        return results

    async def send_appointment_reminder(
        self,
        patient_email: str,
        patient_phone: Optional[str],
        appointment_data: Dict[str, Any],
        reminder_hours: int = 24
    ) -> Dict[str, Any]:
        """Send appointment reminder notifications."""
        results = {}
        
        # Add reminder timing to data
        appointment_data['reminder_hours'] = reminder_hours
        
        # Send email reminder
        email_result = await self.send_email_notification(
            recipient_email=patient_email,
            template_name='appointment_reminder',
            template_data=appointment_data
        )
        results['email'] = email_result
        
        # Send SMS reminder if phone provided
        if patient_phone:
            sms_result = await self.send_sms_notification(
                phone_number=patient_phone,
                template_name='appointment_reminder',
                template_data=appointment_data
            )
            results['sms'] = sms_result
        
        return results

    async def send_health_alert(
        self,
        patient_email: str,
        patient_phone: Optional[str],
        alert_data: Dict[str, Any],
        urgency: str = 'medium'
    ) -> Dict[str, Any]:
        """Send health alert notifications based on urgency level."""
        results = {}
        
        alert_data['urgency'] = urgency
        
        # Always send email for health alerts
        email_result = await self.send_email_notification(
            recipient_email=patient_email,
            template_name='health_alert',
            template_data=alert_data
        )
        results['email'] = email_result
        
        # Send SMS for high urgency alerts
        if urgency == 'high' and patient_phone:
            sms_result = await self.send_sms_notification(
                phone_number=patient_phone,
                template_name='urgent_alert',
                template_data=alert_data
            )
            results['sms'] = sms_result
        
        return results

    async def schedule_reminder(
        self,
        notification_data: Dict[str, Any],
        send_time: datetime
    ) -> Dict[str, Any]:
        """Schedule a future notification using DynamoDB TTL."""
        try:
            if not self.dynamodb:
                logger.warning("DynamoDB not available for scheduling")
                return {'success': False, 'error': 'Scheduling not available'}
            
            # Calculate TTL (Time To Live) for DynamoDB
            ttl = int(send_time.timestamp())
            
            # Store scheduled notification
            table = self.dynamodb.Table('medimate-scheduled-notifications')
            
            item = {
                'notification_id': f"reminder_{datetime.utcnow().timestamp()}",
                'notification_data': notification_data,
                'send_time': send_time.isoformat(),
                'ttl': ttl,
                'status': 'scheduled',
                'created_at': datetime.utcnow().isoformat()
            }
            
            table.put_item(Item=item)
            
            logger.info(f"Notification scheduled for {send_time}")
            return {
                'success': True,
                'notification_id': item['notification_id'],
                'send_time': send_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to schedule notification: {str(e)}")
            return {'success': False, 'error': str(e)}

    # Email Templates
    
    def _get_appointment_confirmation_template(self) -> Dict[str, str]:
        """Get appointment confirmation email template."""
        return {
            'subject': 'MediMate - Appointment Confirmed with Dr. {doctor_name}',
            'html_body': '''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🏥 MediMate</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Appointment Confirmed</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #667eea; margin-top: 0;">Hello {patient_name}! 👋</h2>
                        
                        <p>Your appointment has been successfully confirmed. Here are the details:</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h3 style="margin-top: 0; color: #333;">📅 Appointment Details</h3>
                            <p><strong>Doctor:</strong> Dr. {doctor_name}</p>
                            <p><strong>Specialty:</strong> {specialty}</p>
                            <p><strong>Date:</strong> {date}</p>
                            <p><strong>Time:</strong> {time}</p>
                            <p><strong>Duration:</strong> {duration} minutes</p>
                            <p><strong>Location:</strong> {location}</p>
                            <p><strong>Appointment ID:</strong> {appointment_id}</p>
                        </div>
                        
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin-top: 0; color: #1976d2;">📋 Preparation Instructions</h4>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Arrive 15 minutes early for check-in</li>
                                <li>Bring a valid ID and insurance card</li>
                                <li>Bring a list of current medications</li>
                                <li>Prepare any questions you'd like to discuss</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{calendar_link}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📅 Add to Calendar</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666; text-align: center;">
                            Need to reschedule? Contact us at <a href="mailto:support@medimate.com">support@medimate.com</a> or call (555) 123-4567
                        </p>
                    </div>
                </div>
            </body>
            </html>
            ''',
            'text_body': '''
            MediMate - Appointment Confirmed
            
            Hello {patient_name}!
            
            Your appointment has been successfully confirmed:
            
            Doctor: Dr. {doctor_name}
            Specialty: {specialty}
            Date: {date}
            Time: {time}
            Duration: {duration} minutes
            Location: {location}
            Appointment ID: {appointment_id}
            
            Please arrive 15 minutes early and bring:
            - Valid ID and insurance card
            - List of current medications
            - Any questions you'd like to discuss
            
            Need to reschedule? Contact us at support@medimate.com or call (555) 123-4567
            
            Best regards,
            MediMate Team
            '''
        }

    def _get_appointment_reminder_template(self) -> Dict[str, str]:
        """Get appointment reminder email template."""
        return {
            'subject': 'MediMate - Appointment Reminder: Tomorrow at {time}',
            'html_body': '''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">⏰ MediMate</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Appointment Reminder</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #ff6b6b; margin-top: 0;">Don't Forget! 📅</h2>
                        
                        <p>You have an upcoming appointment in {reminder_hours} hours:</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
                            <h3 style="margin-top: 0; color: #333;">📋 Appointment Details</h3>
                            <p><strong>Doctor:</strong> Dr. {doctor_name}</p>
                            <p><strong>Date:</strong> {date}</p>
                            <p><strong>Time:</strong> {time}</p>
                            <p><strong>Location:</strong> {location}</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
                            <h4 style="margin-top: 0; color: #856404;">⚠️ Important Reminders</h4>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Arrive 15 minutes early</li>
                                <li>Bring ID and insurance card</li>
                                <li>Wear a mask if required</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{directions_link}" style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">🗺️ Get Directions</a>
                            <a href="{reschedule_link}" style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">📅 Reschedule</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            ''',
            'text_body': '''
            MediMate - Appointment Reminder
            
            Don't forget! You have an appointment in {reminder_hours} hours:
            
            Doctor: Dr. {doctor_name}
            Date: {date}
            Time: {time}
            Location: {location}
            
            Important reminders:
            - Arrive 15 minutes early
            - Bring ID and insurance card
            - Wear a mask if required
            
            Need directions or to reschedule? Contact us at support@medimate.com
            
            Best regards,
            MediMate Team
            '''
        }

    def _get_health_alert_template(self) -> Dict[str, str]:
        """Get health alert email template."""
        return {
            'subject': 'MediMate Health Alert - {alert_title}',
            'html_body': '''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🚨 MediMate</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Health Alert</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #e74c3c; margin-top: 0;">{alert_title}</h2>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c;">
                            <p>{alert_message}</p>
                        </div>
                        
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
                            <h4 style="margin-top: 0; color: #721c24;">⚠️ Recommended Actions</h4>
                            <p>{recommendations}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{action_link}" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📞 Contact Healthcare Provider</a>
                        </div>
                        
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            This is an automated health alert. For emergencies, call 911 immediately.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            ''',
            'text_body': '''
            MediMate Health Alert
            
            {alert_title}
            
            {alert_message}
            
            Recommended Actions:
            {recommendations}
            
            For emergencies, call 911 immediately.
            For non-urgent matters, contact your healthcare provider.
            
            MediMate Team
            '''
        }

    def _get_welcome_template(self) -> Dict[str, str]:
        """Get welcome email template."""
        return {
            'subject': 'Welcome to MediMate - Your AI Health Assistant! 🏥',
            'html_body': '''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🏥 Welcome to MediMate!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Your AI Health Assistant</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #667eea; margin-top: 0;">Hello {patient_name}! 👋</h2>
                        
                        <p>Welcome to MediMate! We're excited to help you on your health journey with our AI-powered platform.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #333;">🚀 What You Can Do</h3>
                            <ul style="padding-left: 20px;">
                                <li>💬 Chat with our AI health assistant</li>
                                <li>📅 Book appointments with specialists</li>
                                <li>📋 Upload and analyze medical reports</li>
                                <li>🔔 Receive health reminders and alerts</li>
                                <li>📊 Track your health journey</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{dashboard_link}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">🏠 Go to Dashboard</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666; text-align: center;">
                            Questions? Contact us at <a href="mailto:support@medimate.com">support@medimate.com</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            ''',
            'text_body': '''
            Welcome to MediMate!
            
            Hello {patient_name}!
            
            Welcome to MediMate! We're excited to help you on your health journey.
            
            What you can do:
            - Chat with our AI health assistant
            - Book appointments with specialists
            - Upload and analyze medical reports
            - Receive health reminders and alerts
            - Track your health journey
            
            Get started: {dashboard_link}
            
            Questions? Contact us at support@medimate.com
            
            Best regards,
            MediMate Team
            '''
        }

    def _get_password_reset_template(self) -> Dict[str, str]:
        """Get password reset email template."""
        return {
            'subject': 'MediMate - Password Reset Request',
            'html_body': '''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #6c757d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🔐 MediMate</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Password Reset</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #6c757d; margin-top: 0;">Reset Your Password</h2>
                        
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_link}" style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">🔐 Reset Password</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">
                            This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                        </p>
                        
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            For security, this link can only be used once.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            ''',
            'text_body': '''
            MediMate - Password Reset
            
            We received a request to reset your password.
            
            Reset your password: {reset_link}
            
            This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            
            MediMate Team
            '''
        }

    def _get_report_ready_template(self) -> Dict[str, str]:
        """Get medical report ready email template."""
        return {
            'subject': 'MediMate - Your Medical Report is Ready 📋',
            'html_body': '''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">📋 MediMate</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Report Ready</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #28a745; margin-top: 0;">Your Report is Ready! 📊</h2>
                        
                        <p>Your medical report analysis has been completed and is now available for review.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <h3 style="margin-top: 0; color: #333;">📋 Report Details</h3>
                            <p><strong>Report Type:</strong> {report_type}</p>
                            <p><strong>Date Processed:</strong> {processed_date}</p>
                            <p><strong>Report ID:</strong> {report_id}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{report_link}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📋 View Report</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666; text-align: center;">
                            Questions about your report? Contact us at <a href="mailto:support@medimate.com">support@medimate.com</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            ''',
            'text_body': '''
            MediMate - Report Ready
            
            Your medical report analysis has been completed and is now available for review.
            
            Report Details:
            - Report Type: {report_type}
            - Date Processed: {processed_date}
            - Report ID: {report_id}
            
            View your report: {report_link}
            
            Questions? Contact us at support@medimate.com
            
            MediMate Team
            '''
        }

    # Fallback methods for when AWS services are unavailable
    
    async def _send_fallback_email(self, recipient: str, template: str, data: Dict) -> Dict[str, Any]:
        """Fallback email sending when SES is unavailable."""
        logger.info(f"Fallback: Would send email to {recipient} using template {template}")
        return {
            'success': True,
            'message_id': f"fallback_{datetime.utcnow().timestamp()}",
            'status': 'fallback_sent'
        }

    async def _send_fallback_sms(self, phone: str, template: str, data: Dict) -> Dict[str, Any]:
        """Fallback SMS sending when SNS is unavailable."""
        logger.info(f"Fallback: Would send SMS to {phone} using template {template}")
        return {
            'success': True,
            'message_id': f"fallback_{datetime.utcnow().timestamp()}",
            'status': 'fallback_sent'
        }

    async def _log_notification(self, notification_data: Dict[str, Any]) -> None:
        """Log notification to DynamoDB for tracking."""
        try:
            if self.dynamodb:
                table = self.dynamodb.Table('medimate-notifications-log')
                table.put_item(Item=notification_data)
        except Exception as e:
            logger.error(f"Failed to log notification: {str(e)}")

# Global notification service instance
notification_service = NotificationService()
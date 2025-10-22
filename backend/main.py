"""
MediMate Healthcare Platform - Main FastAPI Application

A comprehensive healthcare AI assistant platform that provides:
- AI-powered health consultations using AWS Bedrock (Claude 3.5 Sonnet)
- Appointment booking and management across 22+ medical specialties
- Medical document analysis using AWS Textract and Comprehend Medical
- Secure user authentication and data protection
- Email notifications via Amazon SNS

This is the refactored main application that uses modular API routers and service layers.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any
import logging
import boto3
from pydantic import BaseModel

# Import configuration and AWS clients
from utils.config import get_settings, initialize_configuration
from utils.aws_clients import get_aws_clients

# Import enhanced error handling and middleware
from utils.error_handlers import setup_error_handlers
from utils.logger import setup_logging
from utils.middleware import setup_middleware

# Import Pydantic models
from models.base import HealthStatus

# Import API routers
from api.auth import router as auth_router
from api.chat import router as chat_router
from api.appointments import router as appointments_router
from api.reports import router as reports_router
from api.voice import router as voice_router
from api.ml_recommendations import router as ml_router
from api.workflows import router as workflows_router
from routes.blood_donation import router as blood_donation_router
from routes.appointments import router as appointments_new_router
from routes.health_reports import router as health_reports_router

# Initialize configuration with validation
config_status = initialize_configuration()
settings = get_settings()

# Initialize AWS clients
aws_clients = get_aws_clients()

# Setup enhanced logging with CloudWatch integration
loggers = setup_logging(
    app_name="medimate",
    log_level=settings.log_level.upper(),
    enable_cloudwatch=settings.environment == "production",
    log_file="logs/medimate.log" if settings.environment != "production" else None
)
logger = loggers['main']
performance_logger = loggers['performance']
security_logger = loggers['security']

# Initialize FastAPI application with settings
app = FastAPI(
    title=settings.app_name,
    description="AI-powered healthcare assistant with appointment booking and document analysis",
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    debug=settings.debug
)

# Setup enhanced error handling
setup_error_handlers(app)

# Setup enhanced middleware (includes CORS, logging, security)
setup_middleware(app, settings)

# Include API routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(appointments_router)
app.include_router(reports_router)
app.include_router(voice_router)
app.include_router(ml_router)
app.include_router(workflows_router)
app.include_router(blood_donation_router)
app.include_router(appointments_new_router)
app.include_router(health_reports_router)

# Core application endpoints

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint - API welcome message."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "environment": settings.environment,
        "demo_mode": settings.demo_mode,
        "documentation": "/docs" if settings.debug else "Documentation disabled in production",
        "health_check": "/health",
        "api_endpoints": {
            "auth": "/api/auth",
            "chat": "/api/chat",
            "doctors": "/api/doctors", 
            "appointments": "/api/appointments",
            "reports": "/api/reports",
            "voice": "/api/voice",
            "ml_recommendations": "/api/ml",
            "workflows": "/api/workflows"
        }
    }

@app.get("/health", response_model=HealthStatus)
async def health_check():
    """
    Health check endpoint for monitoring application status.
    Returns application health, version, and service status.
    """
    try:
        # Check AWS services health
        aws_health = aws_clients.health_check()
        aws_services_status = aws_health['summary']['overall_status']
        
        # Get enabled services count
        enabled_services = aws_health['summary']['enabled_services']
        healthy_services = aws_health['summary']['healthy_services']
        
        health_data = HealthStatus(
            status="healthy",
            version=settings.app_version,
            services={
                "api": "healthy",
                "database": aws_services_status,
                "ai_services": aws_services_status,
                "authentication": aws_health.get('cognito', {}).get('status', 'disabled'),
                "email_notifications": aws_health.get('ses', {}).get('status', 'disabled'),
                "sms_notifications": aws_health.get('sns', {}).get('status', 'disabled'),
                "ml_inference": aws_health.get('sagemaker', {}).get('status', 'disabled'),
                "medical_analysis": aws_health.get('comprehend_medical', {}).get('status', 'disabled'),
                "encryption": aws_health.get('kms', {}).get('status', 'disabled'),
                "demo_mode": settings.demo_mode,
                "environment": settings.environment,
                "aws_region": settings.aws_region,
                "enabled_aws_services": f"{healthy_services}/{enabled_services}",
                "aws_services_detail": {
                    service: status.get('status', 'unknown') 
                    for service, status in aws_health.items() 
                    if service != 'summary'
                }
            }
        )
        
        logger.info("Health check performed successfully")
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")

# Error Handlers

# Error handlers are now configured via setup_error_handlers()

# Application startup and shutdown events

@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} starting up...")
    logger.info(f"🌍 Environment: {settings.environment}")
    logger.info(f"🔧 Demo Mode: {settings.demo_mode}")
    logger.info(f"☁️ AWS Region: {settings.aws_region}")
    logger.info("✅ FastAPI application initialized")
    logger.info("✅ Enhanced error handling configured")
    logger.info("✅ Enhanced middleware configured (CORS, logging, security)")
    logger.info("✅ Modular API routers registered:")
    logger.info("   - Authentication API: /api/auth")
    logger.info("   - Chat API: /api/chat")
    logger.info("   - Appointments API: /api/appointments, /api/doctors")
    logger.info("   - Reports API: /api/reports")
    logger.info("   - Voice API: /api/voice")
    logger.info("   - ML Recommendations API: /api/ml")
    logger.info("   - Workflows API: /api/workflows")
    logger.info("✅ Service layer dependencies configured")
    logger.info("✅ Pydantic models loaded")
    logger.info("✅ Environment configuration loaded")
    logger.info("✅ Enhanced logging with CloudWatch integration configured")
    
    if settings.debug:
        logger.info("📋 API Documentation available at /docs")
        logger.info("📋 ReDoc Documentation available at /redoc")
    
    # Log configuration warnings if any
    if not config_status['valid']:
        logger.warning("⚠️ Configuration validation failed - check startup logs")
    elif config_status['warnings']:
        logger.warning(f"⚠️ Configuration has {len(config_status['warnings'])} warnings - check startup logs")

@app.on_event("shutdown")
# Email notification models
class EmailRequest(BaseModel):
    to: str
    subject: str
    content: str
    appointmentId: str
    patientName: str

# Amazon SNS email endpoint
@app.post("/api/send-email")
async def send_email_notification(email_request: EmailRequest):
    """Send email notification via Amazon SNS"""
    try:
        logger.info(f"📧 Sending email via Amazon SNS to: {email_request.to}")
        
        # Initialize SNS client
        sns_client = boto3.client(
            'sns',
            region_name='ap-south-1',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        
        # SNS topic ARN
        topic_arn = 'arn:aws:sns:ap-south-1:676206948283:medimate-notifications'
        
        # Publish message to SNS
        response = sns_client.publish(
            TopicArn=topic_arn,
            Subject=email_request.subject,
            Message=email_request.content,
            MessageAttributes={
                'email': {
                    'DataType': 'String',
                    'StringValue': email_request.to
                },
                'appointmentId': {
                    'DataType': 'String',
                    'StringValue': email_request.appointmentId
                },
                'patientName': {
                    'DataType': 'String',
                    'StringValue': email_request.patientName
                }
            }
        )
        
        logger.info(f"📧 ✅ Email sent via Amazon SNS! MessageId: {response['MessageId']}")
        
        return {
            "success": True,
            "messageId": response['MessageId'],
            "message": "Email sent via Amazon SNS",
            "recipient": email_request.to
        }
        
    except Exception as e:
        logger.error(f"❌ SNS email sending failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("🛑 MediMate Healthcare Platform API shutting down...")
    logger.info("✅ Cleanup completed")

# Development server
if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting {settings.app_name} in development mode...")
    logger.info(f"Server will run on {settings.host}:{settings.port}")
    logger.info(f"Debug mode: {settings.debug}")
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
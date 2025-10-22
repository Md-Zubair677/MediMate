"""
MediMate Healthcare Platform - Data Models

This module contains all Pydantic models for request/response validation
and data structure definitions used throughout the MediMate platform.
"""

from .base import *
from .chat import *
from .appointment import *
from .medical import *
from .user import *
from .doctor import *

__all__ = [
    # Base models
    "BaseResponse",
    "HealthStatus",
    "ErrorResponse",
    
    # Chat models
    "ChatMessage",
    "ChatResponse",
    "HealthConsultation",
    
    # Appointment models
    "Appointment",
    "AppointmentResponse",
    "AppointmentStatus",
    
    # Doctor models
    "Doctor",
    "MedicalSpecialty",
    "DoctorAvailability",
    "DoctorSchedule",
    
    # Medical models
    "DocumentAnalysisRequest",
    "DocumentAnalysisResponse",
    "MedicalEntity",
    "RiskAssessment",
    
    # User models
    "User",
    "UserProfile",
    "MedicalHistory"
]
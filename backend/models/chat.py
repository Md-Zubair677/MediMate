"""
Chat and AI consultation models for MediMate Healthcare Platform.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UrgencyLevel(str, Enum):
    """Urgency levels for health consultations."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    EMERGENCY = "emergency"

class ChatMessage(BaseModel):
    """Chat message model for AI health consultations."""
    message: str = Field(
        ..., 
        min_length=1, 
        max_length=2000, 
        description="User's health question or symptom description"
    )
    patient_id: str = Field(..., description="Unique patient identifier")
    session_id: Optional[str] = Field(None, description="Chat session identifier")
    timestamp: datetime = Field(default_factory=lambda: datetime.now())

class ChatResponse(BaseModel):
    """AI chat response model."""
    response: str = Field(..., description="AI assistant's health guidance response")
    session_id: str = Field(..., description="Chat session identifier")
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI confidence score")
    disclaimer: str = Field(
        default="This is preliminary health guidance. Please consult a healthcare professional for proper medical diagnosis.",
        description="Medical disclaimer"
    )
    suggested_actions: Optional[List[str]] = Field(None, description="Suggested next steps")

class HealthConsultation(BaseModel):
    """Health consultation request model."""
    patient_id: str = Field(..., description="Patient's unique identifier")
    symptoms: str = Field(
        ..., 
        min_length=1, 
        max_length=1000, 
        description="Patient's symptoms description"
    )
    medical_history: Optional[str] = Field(
        "", 
        max_length=2000, 
        description="Patient's medical history"
    )
    urgency_level: UrgencyLevel = Field(
        UrgencyLevel.NORMAL, 
        description="Urgency level of the consultation"
    )
    current_medications: Optional[List[str]] = Field(
        None, 
        description="List of current medications"
    )
    allergies: Optional[List[str]] = Field(
        None, 
        description="Known allergies"
    )
    age: Optional[int] = Field(None, ge=0, le=150, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")

class ChatSession(BaseModel):
    """Chat session model for conversation management."""
    session_id: str = Field(..., description="Unique session identifier")
    patient_id: str = Field(..., description="Patient identifier")
    messages: List[Dict[str, Any]] = Field(default_factory=list, description="Chat messages")
    context: Dict[str, Any] = Field(default_factory=dict, description="Session context")
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    last_activity: datetime = Field(default_factory=lambda: datetime.now())
    is_active: bool = Field(True, description="Whether session is active")

class MedicalAdvice(BaseModel):
    """Structured medical advice response."""
    primary_advice: str = Field(..., description="Main medical advice")
    recommendations: List[str] = Field(default_factory=list, description="Specific recommendations")
    warning_signs: List[str] = Field(default_factory=list, description="Warning signs to watch for")
    when_to_seek_care: List[str] = Field(default_factory=list, description="When to seek medical care")
    follow_up_needed: bool = Field(False, description="Whether follow-up is recommended")
    urgency_assessment: UrgencyLevel = Field(UrgencyLevel.NORMAL, description="Assessed urgency level")
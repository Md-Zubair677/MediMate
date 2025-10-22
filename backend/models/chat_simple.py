"""
Simplified chat models to avoid Pydantic recursion errors.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UrgencyLevel(str, Enum):
    """Urgency levels for health consultations."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    EMERGENCY = "emergency"

class HealthConsultation(BaseModel):
    """Health consultation request model."""
    patient_id: str = Field(..., description="Patient's unique identifier")
    symptoms: str = Field(..., min_length=1, max_length=1000, description="Patient's symptoms description")
    medical_history: Optional[str] = Field("", max_length=2000, description="Patient's medical history")
    urgency_level: UrgencyLevel = Field(UrgencyLevel.NORMAL, description="Urgency level of the consultation")
    current_medications: Optional[List[str]] = Field(None, description="List of current medications")
    allergies: Optional[List[str]] = Field(None, description="Known allergies")
    age: Optional[int] = Field(None, ge=0, le=150, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")

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
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum

class ConsultationType(str, Enum):
    IN_PERSON = "in_person"
    TELEMEDICINE = "telemedicine"
    HYBRID = "hybrid"

class DoctorStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ON_CALL = "on_call"

class EnhancedDoctor(BaseModel):
    id: str
    name: str
    specialty: str
    
    # AI Integration Features
    ai_consultation_enabled: bool = Field(default=True, description="Can provide AI-assisted consultations")
    bedrock_model_preference: str = Field(default="claude-3-5-sonnet", description="Preferred AI model")
    consultation_style: str = Field(default="collaborative", description="AI collaboration approach")
    
    # Real-time Features
    current_status: DoctorStatus = Field(default=DoctorStatus.AVAILABLE)
    next_available_slot: Optional[str] = Field(None, description="Next available appointment time")
    average_consultation_time: int = Field(default=30, description="Minutes per consultation")
    
    # Telemedicine Capabilities
    consultation_types: List[ConsultationType] = Field(default=[ConsultationType.IN_PERSON])
    video_platform: Optional[str] = Field(default="AWS Chime", description="Video consultation platform")
    
    # Enhanced Profile
    profile_image_url: Optional[str] = None
    consultation_fee: float = Field(default=150.0, description="Consultation fee in USD")
    insurance_accepted: List[str] = Field(default=["Medicare", "Medicaid", "Private"])
    
    # Performance Metrics
    patient_satisfaction: float = Field(default=4.5, description="Patient satisfaction score")
    response_time_minutes: int = Field(default=15, description="Average response time")
    success_rate: float = Field(default=0.95, description="Treatment success rate")
    
    # AI-Enhanced Features
    diagnostic_accuracy: float = Field(default=0.92, description="AI-assisted diagnostic accuracy")
    specialization_keywords: List[str] = Field(default=[], description="AI matching keywords")
    treatment_protocols: List[str] = Field(default=[], description="Preferred treatment approaches")

class DoctorAnalytics(BaseModel):
    doctor_id: str
    total_consultations: int = 0
    ai_assisted_consultations: int = 0
    patient_outcomes: Dict[str, int] = Field(default_factory=dict)
    average_diagnosis_time: float = 15.5
    cost_per_consultation: float = 150.0
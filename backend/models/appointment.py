"""
Appointment model for MediMate platform with comprehensive booking and management features.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from enum import Enum


class AppointmentStatus(str, Enum):
    """Appointment status enumeration."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class AppointmentType(str, Enum):
    """Appointment type enumeration."""
    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"
    ROUTINE_CHECKUP = "routine_checkup"
    SPECIALIST_VISIT = "specialist_visit"
    TELEMEDICINE = "telemedicine"
    PROCEDURE = "procedure"
    VACCINATION = "vaccination"


class MedicalSpecialty(str, Enum):
    """Medical specialty enumeration."""
    CARDIOLOGY = "Cardiology"
    DERMATOLOGY = "Dermatology"
    ENDOCRINOLOGY = "Endocrinology"
    GASTROENTEROLOGY = "Gastroenterology"
    HEMATOLOGY = "Hematology"
    INFECTIOUS_DISEASE = "Infectious Disease"
    NEPHROLOGY = "Nephrology"
    NEUROLOGY = "Neurology"
    ONCOLOGY = "Oncology"
    OPHTHALMOLOGY = "Ophthalmology"
    ORTHOPEDICS = "Orthopedics"
    OTOLARYNGOLOGY = "Otolaryngology"
    PEDIATRICS = "Pediatrics"
    PSYCHIATRY = "Psychiatry"
    PULMONOLOGY = "Pulmonology"
    RADIOLOGY = "Radiology"
    RHEUMATOLOGY = "Rheumatology"
    SURGERY = "Surgery"
    UROLOGY = "Urology"
    EMERGENCY_MEDICINE = "Emergency Medicine"
    FAMILY_MEDICINE = "Family Medicine"
    INTERNAL_MEDICINE = "Internal Medicine"


class Priority(str, Enum):
    """Appointment priority enumeration."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class Doctor(BaseModel):
    """Doctor information for appointments."""
    doctor_id: str = Field(..., description="Unique doctor identifier")
    name: str = Field(..., description="Doctor's full name")
    specialty: MedicalSpecialty = Field(..., description="Medical specialty")
    title: str = Field(default="MD", description="Professional title")
    years_experience: Optional[int] = Field(None, ge=0, description="Years of experience")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Average rating")
    location: Optional[str] = Field(None, description="Practice location")
    phone_number: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[str] = Field(None, description="Contact email")
    consultation_fee: Optional[float] = Field(None, ge=0, description="Consultation fee")
    languages: List[str] = Field(default_factory=list, description="Languages spoken")
    
    class Config:
        use_enum_values = True


class AppointmentSlot(BaseModel):
    """Available appointment time slot."""
    slot_id: str = Field(..., description="Unique slot identifier")
    doctor_id: str = Field(..., description="Doctor identifier")
    appointment_date: date = Field(..., description="Appointment date")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    duration_minutes: int = Field(..., ge=15, le=480, description="Duration in minutes")
    is_available: bool = Field(default=True, description="Whether slot is available")
    appointment_type: Optional[AppointmentType] = Field(None, description="Type of appointment")
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        """Validate end time is after start time."""
        start_time = values.get('start_time')
        if start_time and v <= start_time:
            raise ValueError('End time must be after start time')
        return v


class Appointment(BaseModel):
    """Main appointment model for MediMate platform."""
    
    # Core identification
    appointment_id: str = Field(..., description="Unique appointment identifier")
    patient_id: str = Field(..., description="Patient user ID")
    doctor_id: str = Field(..., description="Doctor user ID")
    
    # Scheduling information
    appointment_date: date = Field(..., description="Date of appointment")
    appointment_time: time = Field(..., description="Time of appointment")
    duration_minutes: int = Field(default=30, ge=15, le=480, description="Duration in minutes")
    
    # Appointment details
    appointment_type: AppointmentType = Field(default=AppointmentType.CONSULTATION)
    specialty: MedicalSpecialty = Field(..., description="Medical specialty")
    status: AppointmentStatus = Field(default=AppointmentStatus.SCHEDULED)
    priority: Priority = Field(default=Priority.NORMAL)
    
    # Clinical information
    reason: str = Field(..., min_length=1, max_length=500, description="Reason for appointment")
    symptoms: Optional[str] = Field(None, max_length=1000, description="Patient symptoms")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes")
    
    # Virtual appointment settings
    is_virtual: bool = Field(default=False, description="Whether appointment is virtual")
    virtual_meeting_url: Optional[str] = Field(None, description="Virtual meeting URL")
    virtual_meeting_id: Optional[str] = Field(None, description="Virtual meeting ID")
    
    # Location information
    location: Optional[str] = Field(None, description="Appointment location")
    room_number: Optional[str] = Field(None, description="Room number")
    
    # Billing and insurance
    estimated_cost: Optional[float] = Field(None, ge=0, description="Estimated cost")
    insurance_covered: bool = Field(default=True, description="Whether covered by insurance")
    copay_amount: Optional[float] = Field(None, ge=0, description="Patient copay amount")
    
    # Reminders and notifications
    reminder_sent: bool = Field(default=False, description="Whether reminder was sent")
    confirmation_required: bool = Field(default=True, description="Whether confirmation is required")
    confirmed_at: Optional[datetime] = Field(None, description="When appointment was confirmed")
    
    # System metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(), description="Creation timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(), description="Last update timestamp")
    created_by: Optional[str] = Field(None, description="User who created the appointment")
    
    # Follow-up information
    follow_up_required: bool = Field(default=False, description="Whether follow-up is needed")
    follow_up_date: Optional[date] = Field(None, description="Suggested follow-up date")
    follow_up_notes: Optional[str] = Field(None, description="Follow-up instructions")
    
    # Cancellation information
    cancelled_at: Optional[datetime] = Field(None, description="When appointment was cancelled")
    cancelled_by: Optional[str] = Field(None, description="Who cancelled the appointment")
    cancellation_reason: Optional[str] = Field(None, description="Reason for cancellation")
    
    # Additional metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('appointment_date')
    def validate_appointment_date(cls, v):
        """Validate appointment date is not in the past."""
        if v < date.today():
            raise ValueError('Appointment date cannot be in the past')
        return v
    
    @validator('virtual_meeting_url')
    def validate_virtual_meeting_url(cls, v, values):
        """Validate virtual meeting URL is provided for virtual appointments."""
        is_virtual = values.get('is_virtual', False)
        if is_virtual and not v:
            raise ValueError('Virtual meeting URL is required for virtual appointments')
        return v
    
    @validator('follow_up_date')
    def validate_follow_up_date(cls, v, values):
        """Validate follow-up date is after appointment date."""
        appointment_date = values.get('appointment_date')
        if v and appointment_date and v <= appointment_date:
            raise ValueError('Follow-up date must be after appointment date')
        return v
    
    @property
    def appointment_datetime(self) -> datetime:
        """Get appointment as datetime object."""
        return datetime.combine(self.appointment_date, self.appointment_time)
    
    @property
    def end_time(self) -> time:
        """Calculate appointment end time."""
        start_datetime = self.appointment_datetime
        end_datetime = start_datetime + timedelta(minutes=self.duration_minutes)
        return end_datetime.time()
    
    @property
    def is_past(self) -> bool:
        """Check if appointment is in the past."""
        return self.appointment_datetime < datetime.now()
    
    @property
    def is_today(self) -> bool:
        """Check if appointment is today."""
        return self.appointment_date == date.today()
    
    @property
    def is_upcoming(self) -> bool:
        """Check if appointment is upcoming (within next 7 days)."""
        days_until = (self.appointment_date - date.today()).days
        return 0 <= days_until <= 7
    
    def update_timestamp(self):
        """Update the last modified timestamp."""
        self.updated_at = datetime.now()
    
    def cancel(self, cancelled_by: str, reason: str):
        """Cancel the appointment."""
        self.status = AppointmentStatus.CANCELLED
        self.cancelled_at = datetime.now()
        self.cancelled_by = cancelled_by
        self.cancellation_reason = reason
        self.update_timestamp()
    
    def confirm(self):
        """Confirm the appointment."""
        self.status = AppointmentStatus.CONFIRMED
        self.confirmed_at = datetime.now()
        self.update_timestamp()
    
    def complete(self, notes: Optional[str] = None):
        """Mark appointment as completed."""
        self.status = AppointmentStatus.COMPLETED
        if notes:
            self.notes = notes
        self.update_timestamp()
    
    def reschedule(self, new_date: date, new_time: time):
        """Reschedule the appointment."""
        self.appointment_date = new_date
        self.appointment_time = new_time
        self.status = AppointmentStatus.RESCHEDULED
        self.update_timestamp()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert appointment model to dictionary for DynamoDB storage."""
        return self.dict(exclude_none=True, by_alias=True)
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True
        validate_assignment = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat()
        }


class AppointmentCreate(BaseModel):
    """Model for creating new appointments."""
    patient_id: str
    doctor_id: str
    appointment_date: date
    appointment_time: time
    duration_minutes: int = Field(default=30, ge=15, le=480)
    appointment_type: AppointmentType = Field(default=AppointmentType.CONSULTATION)
    specialty: MedicalSpecialty
    reason: str = Field(..., min_length=1, max_length=500)
    symptoms: Optional[str] = Field(None, max_length=1000)
    notes: Optional[str] = Field(None, max_length=2000)
    is_virtual: bool = Field(default=False)
    priority: Priority = Field(default=Priority.NORMAL)


class AppointmentUpdate(BaseModel):
    """Model for updating appointment information."""
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    reason: Optional[str] = Field(None, min_length=1, max_length=500)
    symptoms: Optional[str] = Field(None, max_length=1000)
    notes: Optional[str] = Field(None, max_length=2000)
    status: Optional[AppointmentStatus] = None
    priority: Optional[Priority] = None
    is_virtual: Optional[bool] = None


class AppointmentResponse(BaseModel):
    """Response model for appointment operations."""
    message: str
    appointment_id: str
    appointment_details: Dict[str, Any]
    success: bool = Field(default=True)


from datetime import timedelta  # Add this import at the top
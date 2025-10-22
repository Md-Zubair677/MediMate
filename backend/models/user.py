"""
User model for MediMate platform with medical history and profile information.
"""

from pydantic import BaseModel, Field, ConfigDict
try:
    from pydantic import field_validator
except ImportError:
    from pydantic import validator as field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    PATIENT = "patient"
    DOCTOR = "doctor"
    NURSE = "nurse"
    ADMIN = "admin"


class Gender(str, Enum):
    """Gender enumeration."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class BloodType(str, Enum):
    """Blood type enumeration."""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "unknown"


class MedicalCondition(BaseModel):
    """Medical condition with diagnosis details."""
    condition_name: str = Field(..., description="Name of the medical condition")
    diagnosis_date: Optional[date] = Field(None, description="Date of diagnosis")
    severity: Optional[str] = Field(None, description="Severity level")
    status: str = Field(default="active", description="Current status")
    notes: Optional[str] = Field(None, description="Additional notes")


class Medication(BaseModel):
    """Current or past medication information."""
    medication_name: str = Field(..., description="Name of the medication")
    dosage: Optional[str] = Field(None, description="Dosage information")
    frequency: Optional[str] = Field(None, description="How often taken")
    start_date: Optional[date] = Field(None, description="When medication was started")
    prescribed_by: Optional[str] = Field(None, description="Prescribing physician")


class Allergy(BaseModel):
    """Allergy information with severity and reaction details."""
    allergen: str = Field(..., description="Name of the allergen")
    reaction: Optional[str] = Field(None, description="Type of allergic reaction")
    severity: str = Field(default="mild", description="Severity level")
    discovered_date: Optional[date] = Field(None, description="When allergy was discovered")


class MedicalHistory(BaseModel):
    """Comprehensive medical history for a patient."""
    conditions: List[MedicalCondition] = Field(default_factory=list)
    medications: List[Medication] = Field(default_factory=list)
    allergies: List[Allergy] = Field(default_factory=list)
    surgeries: List[Dict[str, Any]] = Field(default_factory=list)
    family_history: List[Dict[str, Any]] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=lambda: datetime.now())


class User(BaseModel):
    """Main user model for MediMate platform."""
    
    # Core identification
    user_id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User email address")
    role: UserRole = Field(..., description="User role in the system")
    
    # Personal information
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: Optional[date] = Field(None)
    gender: Optional[Gender] = Field(None)
    phone_number: Optional[str] = Field(None)
    
    # Address information
    address_line1: Optional[str] = Field(None)
    city: Optional[str] = Field(None)
    state: Optional[str] = Field(None)
    postal_code: Optional[str] = Field(None)
    country: str = Field(default="US")
    
    # Medical information
    blood_type: Optional[BloodType] = Field(None)
    height_cm: Optional[float] = Field(None, ge=0, le=300)
    weight_kg: Optional[float] = Field(None, ge=0, le=500)
    medical_history: Optional[MedicalHistory] = Field(None)
    
    # System metadata
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
    last_login: Optional[datetime] = Field(None)
    
    # Privacy settings
    privacy_settings: Dict[str, bool] = Field(
        default_factory=lambda: {
            "share_medical_history": False,
            "receive_notifications": True
        }
    )
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format."""
        return v.lower()
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v):
        """Validate date of birth is not in the future."""
        if v and v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        return v
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self) -> Optional[int]:
        """Calculate user's age from date of birth."""
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def update_timestamp(self):
        """Update the last modified timestamp."""
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user model to dictionary for DynamoDB storage."""
        return self.dict(exclude_none=True, by_alias=True)
    
    model_config = ConfigDict(
        use_enum_values=True,
        validate_assignment=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
    )


class UserCreate(BaseModel):
    """Model for creating new users."""
    email: str
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: UserRole
    password: str = Field(..., min_length=8)
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None


class UserUpdate(BaseModel):
    """Model for updating user information."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone_number: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    blood_type: Optional[BloodType] = None
    height_cm: Optional[float] = Field(None, ge=0, le=300)
    weight_kg: Optional[float] = Field(None, ge=0, le=500)
    privacy_settings: Optional[Dict[str, bool]] = None
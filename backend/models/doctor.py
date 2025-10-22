"""
Doctor and Medical Specialty models for MediMate Healthcare Platform.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class MedicalSpecialty(str, Enum):
    """Medical specialties available in the platform."""
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

class Doctor(BaseModel):
    """Doctor model for healthcare providers."""
    id: str = Field(..., description="Unique doctor identifier")
    name: str = Field(..., description="Doctor's full name")
    specialty: MedicalSpecialty = Field(..., description="Medical specialty")
    title: str = Field(default="MD", description="Professional title")
    years_experience: int = Field(..., description="Years of experience")
    rating: float = Field(default=4.0, description="Average rating")
    location: str = Field(..., description="Practice location")
    available: bool = Field(default=True, description="Availability status")
    bio: Optional[str] = Field(None, description="Doctor's biography")
    education: Optional[List[str]] = Field(None, description="Educational background")
    certifications: Optional[List[str]] = Field(None, description="Professional certifications")
    languages: Optional[List[str]] = Field(default=["English"], description="Languages spoken")
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True
        schema_extra = {
            "example": {
                "id": "doc_1",
                "name": "Dr. Sarah Johnson",
                "specialty": "Cardiology",
                "title": "MD",
                "years_experience": 15,
                "rating": 4.8,
                "location": "MediMate Medical Center",
                "available": True,
                "bio": "Experienced cardiologist specializing in preventive care",
                "education": ["Harvard Medical School", "Johns Hopkins Residency"],
                "certifications": ["Board Certified Cardiologist"],
                "languages": ["English", "Spanish"]
            }
        }

class DoctorAvailability(BaseModel):
    """Doctor availability model."""
    doctor_id: str = Field(..., description="Doctor identifier")
    date: str = Field(..., description="Available date (YYYY-MM-DD)")
    time_slots: List[str] = Field(..., description="Available time slots")
    
class DoctorSchedule(BaseModel):
    """Doctor schedule model."""
    doctor_id: str = Field(..., description="Doctor identifier")
    schedule: List[DoctorAvailability] = Field(..., description="Weekly schedule")
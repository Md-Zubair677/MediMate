from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class HospitalType(str, Enum):
    GENERAL = "General Hospital"
    SPECIALTY = "Specialty Hospital"
    TEACHING = "Teaching Hospital"
    EMERGENCY = "Emergency Hospital"
    REHABILITATION = "Rehabilitation Center"

class Hospital(BaseModel):
    id: str = Field(..., description="Unique hospital identifier")
    name: str = Field(..., description="Hospital name")
    type: HospitalType = Field(..., description="Hospital type")
    address: str = Field(..., description="Full address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip_code: str = Field(..., description="ZIP code")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    phone: str = Field(..., description="Contact phone")
    rating: float = Field(default=4.0, description="Hospital rating")
    emergency_services: bool = Field(default=True, description="Has emergency services")
    specialties: List[str] = Field(..., description="Available medical specialties")
    doctor_ids: List[str] = Field(..., description="Doctors working at this hospital")
    
class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    max_distance_km: Optional[float] = 50.0

class HospitalWithDistance(BaseModel):
    hospital: Hospital
    distance_km: float
    available_doctors: List[str]
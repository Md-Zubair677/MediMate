from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.hospital import Hospital, LocationRequest, HospitalWithDistance
from ..services.hospital_service import hospital_service

router = APIRouter()

@router.get("/api/hospitals", response_model=List[Hospital])
async def get_all_hospitals():
    """Get all available hospitals"""
    return hospital_service.hospitals

@router.post("/api/hospitals/nearby", response_model=List[HospitalWithDistance])
async def find_nearby_hospitals(location: LocationRequest):
    """Find hospitals near patient location"""
    try:
        nearby_hospitals = await hospital_service.find_nearest_hospitals(location)
        return nearby_hospitals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find nearby hospitals: {str(e)}")

@router.get("/api/hospitals/search")
async def search_hospitals(
    city: Optional[str] = Query(None, description="Filter by city"),
    specialty: Optional[str] = Query(None, description="Filter by specialty"),
    hospital_type: Optional[str] = Query(None, description="Filter by hospital type")
):
    """Search hospitals by various criteria"""
    hospitals = hospital_service.hospitals
    
    if city:
        hospitals = [h for h in hospitals if h.city.lower() == city.lower()]
    
    if specialty:
        hospitals = [h for h in hospitals if specialty in h.specialties]
    
    if hospital_type:
        hospitals = [h for h in hospitals if h.type.value == hospital_type]
    
    return hospitals

@router.get("/api/hospitals/{hospital_id}")
async def get_hospital_details(hospital_id: str):
    """Get detailed information about a specific hospital"""
    hospital = next((h for h in hospital_service.hospitals if h.id == hospital_id), None)
    
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Get doctors working at this hospital
    doctors = await hospital_service.get_doctors_by_hospital(hospital_id)
    
    return {
        "hospital": hospital,
        "doctors_count": len(doctors),
        "available_doctors": doctors
    }

@router.get("/api/doctors/{doctor_id}/hospital")
async def get_doctor_hospital(doctor_id: str):
    """Get hospital where a specific doctor works"""
    hospital = await hospital_service.get_hospital_by_doctor(doctor_id)
    
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found for this doctor")
    
    return {
        "doctor_id": doctor_id,
        "hospital": hospital,
        "hospital_address": f"{hospital.address}, {hospital.city}, {hospital.state} {hospital.zip_code}"
    }

@router.post("/api/appointments/location-based")
async def book_location_based_appointment(
    patient_latitude: float,
    patient_longitude: float,
    specialty_needed: str,
    max_distance_km: float = 25.0
):
    """Book appointment at nearest hospital with required specialty"""
    
    # Find nearby hospitals
    location_request = LocationRequest(
        latitude=patient_latitude,
        longitude=patient_longitude,
        max_distance_km=max_distance_km
    )
    
    nearby_hospitals = await hospital_service.find_nearest_hospitals(location_request)
    
    # Filter hospitals with required specialty
    suitable_hospitals = [
        h for h in nearby_hospitals 
        if specialty_needed in h.hospital.specialties
    ]
    
    if not suitable_hospitals:
        raise HTTPException(
            status_code=404, 
            detail=f"No hospitals with {specialty_needed} specialty found within {max_distance_km}km"
        )
    
    # Get the nearest suitable hospital
    nearest_hospital = suitable_hospitals[0]
    
    return {
        "recommended_hospital": nearest_hospital.hospital,
        "distance_km": nearest_hospital.distance_km,
        "available_doctors": nearest_hospital.available_doctors,
        "specialty": specialty_needed,
        "message": f"Nearest {specialty_needed} specialist found at {nearest_hospital.hospital.name}"
    }
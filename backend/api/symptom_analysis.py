"""
Symptom Analysis API endpoints for MediMate platform.
Handles symptom checking, triage, and doctor suggestions.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.symptom_service import analyze_symptoms_and_suggest_doctors, needs_clarification
from services.dynamodb_service import get_dynamodb_service
from utils.error_handlers import handle_api_error

router = APIRouter(prefix="/api/symptoms", tags=["Symptom Analysis"])

class SymptomAnalysisRequest(BaseModel):
    patient_id: str
    symptoms_text: str
    location: Optional[Dict[str, Any]] = None
    additional_info: Optional[Dict[str, Any]] = None

class ClarificationRequest(BaseModel):
    patient_id: str
    original_text: str
    clarification_answer: str

class DoctorBookingRequest(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: str
    appointment_time: str
    reason: str
    symptoms: List[str]

@router.post("/analyze")
async def analyze_symptoms(request: SymptomAnalysisRequest):
    """
    Analyze patient symptoms and suggest appropriate doctors
    """
    try:
        # Check if clarification is needed first
        clarifying_questions = needs_clarification(request.symptoms_text)
        
        if clarifying_questions:
            return {
                "status": "needs_clarification",
                "questions": clarifying_questions,
                "patient_id": request.patient_id,
                "original_text": request.symptoms_text
            }
        
        # Perform full symptom analysis
        result = analyze_symptoms_and_suggest_doctors(
            patient_id=request.patient_id,
            input_text=request.symptoms_text,
            location=request.location
        )
        
        return {
            "status": "analysis_complete",
            "analysis": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return handle_api_error(e, "symptom analysis")

@router.post("/clarify")
async def provide_clarification(request: ClarificationRequest):
    """
    Process clarification answer and complete symptom analysis
    """
    try:
        # Combine original text with clarification
        combined_text = f"{request.original_text}. Additional info: {request.clarification_answer}"
        
        # Perform symptom analysis with clarified information
        result = analyze_symptoms_and_suggest_doctors(
            patient_id=request.patient_id,
            input_text=combined_text
        )
        
        return {
            "status": "analysis_complete",
            "analysis": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return handle_api_error(e, "symptom clarification")

@router.post("/book-appointment")
async def book_recommended_appointment(request: DoctorBookingRequest):
    """
    Book appointment with recommended doctor
    """
    try:
        db_service = get_dynamodb_service()
        
        # Create appointment
        from models.appointment import AppointmentCreate
        
        appointment_data = AppointmentCreate(
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            appointment_date=request.appointment_date,
            appointment_time=request.appointment_time,
            reason=request.reason,
            symptoms=request.symptoms,
            appointment_type="consultation",
            priority="routine"
        )
        
        appointment = await db_service.create_appointment(appointment_data)
        
        if appointment:
            return {
                "status": "appointment_booked",
                "appointment_id": appointment.appointment_id,
                "message": "Appointment booked successfully",
                "appointment_details": {
                    "doctor_id": request.doctor_id,
                    "date": request.appointment_date,
                    "time": request.appointment_time
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to book appointment")
            
    except Exception as e:
        return handle_api_error(e, "appointment booking")

@router.get("/emergency-resources")
async def get_emergency_resources():
    """
    Get emergency resources and contact information
    """
    return {
        "emergency_contacts": [
            {"service": "Emergency Services", "number": "911", "description": "Life-threatening emergencies"},
            {"service": "Medical Emergency", "number": "108", "description": "Medical emergencies in India"},
            {"service": "Poison Control", "number": "1-800-222-1222", "description": "Poisoning emergencies"}
        ],
        "nearest_hospitals": [
            {
                "name": "Apollo Hospital",
                "address": "123 Health Street, Mumbai",
                "phone": "+91-22-1234-5678",
                "emergency_room": True,
                "distance": "2.3 km"
            },
            {
                "name": "Fortis Healthcare", 
                "address": "456 Medical Avenue, Mumbai",
                "phone": "+91-22-8765-4321",
                "emergency_room": True,
                "distance": "3.1 km"
            }
        ],
        "urgent_care_centers": [
            {
                "name": "QuickCare Clinic",
                "address": "789 Care Lane, Mumbai", 
                "phone": "+91-22-5555-0123",
                "hours": "24/7",
                "distance": "1.5 km"
            }
        ]
    }

@router.get("/specialties")
async def get_medical_specialties():
    """
    Get list of available medical specialties
    """
    return {
        "specialties": [
            {"code": "cardiology", "name": "Cardiology", "description": "Heart and cardiovascular system"},
            {"code": "neurology", "name": "Neurology", "description": "Brain and nervous system"},
            {"code": "dermatology", "name": "Dermatology", "description": "Skin conditions"},
            {"code": "gastroenterology", "name": "Gastroenterology", "description": "Digestive system"},
            {"code": "pulmonology", "name": "Pulmonology", "description": "Lungs and respiratory system"},
            {"code": "orthopedics", "name": "Orthopedics", "description": "Bones and joints"},
            {"code": "general_practitioner", "name": "General Practice", "description": "Primary care medicine"},
            {"code": "internal_medicine", "name": "Internal Medicine", "description": "Adult internal medicine"},
            {"code": "emergency_medicine", "name": "Emergency Medicine", "description": "Emergency and urgent care"}
        ]
    }
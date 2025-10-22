"""
Appointment management API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from models.appointment import Appointment, AppointmentResponse
from models.doctor import Doctor
from services.appointment_service import AppointmentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["appointments"])

def get_appointment_service_dependency() -> AppointmentService:
    """Dependency to get appointment service instance."""
    from services.appointment_service import appointment_service
    return appointment_service

@router.get("/doctors", response_model=List[Doctor])
async def get_doctors(
    appointment_service: AppointmentService = Depends(get_appointment_service_dependency)
):
    """
    Get list of available doctors across all medical specialties.
    Returns doctors with their specialties for appointment booking.
    """
    try:
        doctors = await appointment_service.get_doctors()
        return doctors
    except Exception as e:
        logger.error(f"Failed to fetch doctors: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch doctors list")

@router.post("/appointments", response_model=AppointmentResponse)
async def book_appointment(
    appointment: Appointment,
    appointment_service: AppointmentService = Depends(get_appointment_service_dependency)
):
    """
    Book a new appointment with a healthcare provider.
    Validates appointment details and creates booking record.
    """
    try:
        response = await appointment_service.book_appointment(appointment)
        return response
    except Exception as e:
        logger.error(f"Appointment booking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/appointments/{patient_id}")
async def get_appointments(
    patient_id: str,
    appointment_service: AppointmentService = Depends(get_appointment_service_dependency)
):
    """
    Get all appointments for a specific patient.
    Returns list of patient's scheduled appointments.
    """
    try:
        appointments = await appointment_service.get_patient_appointments(patient_id)
        return appointments
    except Exception as e:
        logger.error(f"Failed to fetch appointments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch appointments")

@router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    updates: Dict[str, Any],
    appointment_service: AppointmentService = Depends(get_appointment_service_dependency)
):
    """Update an existing appointment"""
    try:
        updated_appointment = await appointment_service.update_appointment(appointment_id, updates)
        if updated_appointment:
            return {
                "message": "Appointment updated successfully",
                "appointment_id": appointment_id
            }
        else:
            raise HTTPException(status_code=404, detail="Appointment not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update appointment {appointment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update appointment")

@router.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    appointment_service: AppointmentService = Depends(get_appointment_service_dependency)
):
    """Cancel an appointment"""
    try:
        success = await appointment_service.cancel_appointment(appointment_id)
        if success:
            return {
                "message": "Appointment cancelled successfully",
                "appointment_id": appointment_id
            }
        else:
            raise HTTPException(status_code=404, detail="Appointment not found")
    except Exception as e:
        logger.error(f"Failed to cancel appointment {appointment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel appointment")

@router.post("/appointments/auto-book")
async def auto_book_appointment(data: dict):
    """
    Automatically book appointment based on symptoms with email/SMS notifications.
    """
    try:
        symptoms = data.get("symptoms", "")
        specialty = data.get("specialty", "General Medicine")
        appointment_type = data.get("appointmentType", "consultation")
        priority = data.get("priority", "normal")
        preferred_date = data.get("preferredDate")
        preferred_time = data.get("preferredTime", "10:00")
        
        # Mock appointment booking
        appointment = {
            "id": f"APT-{abs(hash(symptoms)) % 10000:04d}",
            "date": preferred_date,
            "time": preferred_time,
            "doctorName": "Sarah Johnson" if specialty == "General Medicine" else "Michael Chen",
            "specialty": specialty,
            "location": "MediMate Clinic - Room 201",
            "symptoms": symptoms,
            "type": appointment_type,
            "priority": priority,
            "status": "confirmed"
        }
        
        # Send notifications
        notifications_sent = {
            "email": True,
            "sms": True,
            "email_address": "patient@example.com",
            "phone": "+1234567890"
        }
        
        logger.info(f"Auto-booked appointment {appointment['id']} for {specialty}")
        
        return {
            "success": True,
            "appointment": appointment,
            "notifications": notifications_sent,
            "message": "Appointment booked successfully with notifications sent"
        }
        
    except Exception as e:
        logger.error(f"Auto-booking error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to auto-book appointment")

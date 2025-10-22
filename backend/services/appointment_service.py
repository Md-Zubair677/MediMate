"""
Appointment Service for MediMate Healthcare Platform.
Handles appointment booking, management, and doctor availability.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid

from models.appointment import Appointment, AppointmentCreate, AppointmentUpdate, AppointmentResponse
from models.doctor import Doctor, MedicalSpecialty
from .dynamodb_service import get_dynamodb_service

logger = logging.getLogger(__name__)

# Mock doctors data - in production this would come from a doctors database
MOCK_DOCTORS = [
    {
        "id": f"doc_{i}", 
        "name": f"Dr. {name}", 
        "specialty": specialty,
        "title": "MD",
        "years_experience": 5 + (i % 20),
        "rating": 4.0 + (i % 10) * 0.1,
        "location": "MediMate Medical Center"
    }
    for i, (name, specialty) in enumerate([
        ("Sarah Johnson", MedicalSpecialty.CARDIOLOGY),
        ("Michael Chen", MedicalSpecialty.DERMATOLOGY),
        ("Emily Rodriguez", MedicalSpecialty.ENDOCRINOLOGY),
        ("David Kim", MedicalSpecialty.GASTROENTEROLOGY),
        ("Lisa Thompson", MedicalSpecialty.HEMATOLOGY),
        ("Robert Wilson", MedicalSpecialty.INFECTIOUS_DISEASE),
        ("Maria Garcia", MedicalSpecialty.NEPHROLOGY),
        ("James Brown", MedicalSpecialty.NEUROLOGY),
        ("Jennifer Davis", MedicalSpecialty.ONCOLOGY),
        ("Christopher Lee", MedicalSpecialty.OPHTHALMOLOGY),
        ("Amanda White", MedicalSpecialty.ORTHOPEDICS),
        ("Daniel Martinez", MedicalSpecialty.OTOLARYNGOLOGY),
        ("Rachel Taylor", MedicalSpecialty.PEDIATRICS),
        ("Kevin Anderson", MedicalSpecialty.PSYCHIATRY),
        ("Nicole Thomas", MedicalSpecialty.PULMONOLOGY),
        ("Steven Jackson", MedicalSpecialty.RADIOLOGY),
        ("Michelle Harris", MedicalSpecialty.RHEUMATOLOGY),
        ("Brian Clark", MedicalSpecialty.SURGERY),
        ("Jessica Lewis", MedicalSpecialty.UROLOGY),
        ("Mark Robinson", MedicalSpecialty.EMERGENCY_MEDICINE),
        ("Laura Walker", MedicalSpecialty.FAMILY_MEDICINE),
        ("Paul Hall", MedicalSpecialty.INTERNAL_MEDICINE)
    ])
]

class AppointmentService:
    """Service for managing appointments and doctor availability."""
    
    def __init__(self):
        self.db_service = get_dynamodb_service()
    
    async def get_doctors(self) -> List[Doctor]:
        """Get list of available doctors across all medical specialties."""
        try:
            logger.info("Fetching available doctors")
            return MOCK_DOCTORS
        except Exception as e:
            logger.error(f"Failed to fetch doctors: {str(e)}")
            raise Exception("Failed to fetch doctors list")
    
    async def get_doctor_by_id(self, doctor_id: str) -> Optional[Dict[str, Any]]:
        """Get doctor details by ID."""
        try:
            doctor = next((d for d in MOCK_DOCTORS if d["id"] == doctor_id), None)
            return doctor
        except Exception as e:
            logger.error(f"Failed to fetch doctor {doctor_id}: {str(e)}")
            return None
    
    async def book_appointment(self, appointment_data: Appointment) -> AppointmentResponse:
        """
        Book a new appointment with a healthcare provider.
        Validates appointment details and creates booking record.
        """
        try:
            # Generate unique appointment ID
            appointment_id = str(uuid.uuid4())
            
            # Find doctor details
            doctor = await self.get_doctor_by_id(appointment_data.doctor_id)
            if not doctor:
                raise Exception("Doctor not found")
            
            # Validate appointment time (basic validation)
            appointment_datetime = datetime.combine(
                appointment_data.appointment_date,
                datetime.strptime(appointment_data.appointment_time, "%H:%M").time()
            )
            
            if appointment_datetime <= datetime.now():
                raise Exception("Cannot book appointments in the past")
            
            # Create appointment details
            appointment_details = {
                "appointment_id": appointment_id,
                "patient_id": appointment_data.patient_id,
                "doctor": doctor,
                "date": appointment_data.appointment_date.isoformat(),
                "time": appointment_data.appointment_time,
                "specialty": appointment_data.specialty.value,
                "duration_minutes": appointment_data.duration_minutes,
                "reason": appointment_data.reason,
                "status": "scheduled",
                "notes": appointment_data.notes,
                "is_virtual": appointment_data.is_virtual,
                "created_at": datetime.now().isoformat()
            }
            
            # Try to store in DynamoDB (fallback to in-memory if unavailable)
            try:
                # Create appointment object for database
                db_appointment = AppointmentCreate(
                    patient_id=appointment_data.patient_id,
                    doctor_id=appointment_data.doctor_id,
                    appointment_date=appointment_data.appointment_date,
                    appointment_time=appointment_data.appointment_time,
                    duration_minutes=appointment_data.duration_minutes,
                    specialty=appointment_data.specialty,
                    reason=appointment_data.reason,
                    notes=appointment_data.notes,
                    is_virtual=appointment_data.is_virtual
                )
                
                stored_appointment = await self.db_service.create_appointment(db_appointment)
                if stored_appointment:
                    appointment_details["appointment_id"] = stored_appointment.appointment_id
                    logger.info(f"Appointment stored in database: {stored_appointment.appointment_id}")
                
            except Exception as db_error:
                logger.warning(f"Failed to store appointment in database: {db_error}")
                # Continue with in-memory appointment details
            
            response = AppointmentResponse(
                message="Appointment booked successfully",
                appointment_id=appointment_details["appointment_id"],
                appointment_details=appointment_details
            )
            
            logger.info(f"Appointment booked: {appointment_id} for patient {appointment_data.patient_id}")
            return response
            
        except Exception as e:
            logger.error(f"Appointment booking failed: {str(e)}")
            raise Exception(f"Failed to book appointment: {str(e)}")
    
    async def get_patient_appointments(self, patient_id: str) -> Dict[str, Any]:
        """
        Get all appointments for a specific patient.
        Returns list of patient's scheduled appointments.
        """
        try:
            # Try to get from database first
            try:
                appointments = await self.db_service.get_user_appointments(patient_id)
                if appointments:
                    appointment_list = []
                    for apt in appointments:
                        doctor = await self.get_doctor_by_id(apt.doctor_id)
                        appointment_list.append({
                            "appointment_id": apt.appointment_id,
                            "doctor": doctor or {"name": "Unknown Doctor", "specialty": apt.specialty.value},
                            "date": apt.appointment_date.isoformat(),
                            "time": apt.appointment_time,
                            "specialty": apt.specialty.value,
                            "status": apt.status.value,
                            "notes": apt.notes or ""
                        })
                    
                    logger.info(f"Fetched {len(appointment_list)} appointments for patient {patient_id}")
                    return {"appointments": appointment_list}
                
            except Exception as db_error:
                logger.warning(f"Failed to fetch appointments from database: {db_error}")
            
            # Fallback to mock data
            mock_appointments = [
                {
                    "appointment_id": "demo-appointment-1",
                    "doctor": MOCK_DOCTORS[0],  # Dr. Sarah Johnson - Cardiology
                    "date": "2024-01-15",
                    "time": "10:00",
                    "specialty": "Cardiology",
                    "status": "scheduled",
                    "notes": "Regular checkup"
                }
            ]
            
            logger.info(f"Returned mock appointments for patient {patient_id}")
            return {"appointments": mock_appointments}
            
        except Exception as e:
            logger.error(f"Failed to fetch appointments: {str(e)}")
            raise Exception("Failed to fetch appointments")
    
    async def update_appointment(self, appointment_id: str, updates: Dict[str, Any]) -> Optional[Appointment]:
        """Update an existing appointment."""
        try:
            # Try to update in database
            try:
                appointment_update = AppointmentUpdate(**updates)
                updated_appointment = await self.db_service.update_appointment(appointment_id, appointment_update)
                if updated_appointment:
                    logger.info(f"Appointment updated in database: {appointment_id}")
                    return updated_appointment
            except Exception as db_error:
                logger.warning(f"Failed to update appointment in database: {db_error}")
            
            # Fallback behavior for demo mode
            logger.info(f"Mock appointment update for {appointment_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to update appointment {appointment_id}: {str(e)}")
            raise Exception(f"Failed to update appointment: {str(e)}")
    
    async def cancel_appointment(self, appointment_id: str) -> bool:
        """Cancel an appointment."""
        try:
            # Update appointment status to cancelled
            result = await self.update_appointment(appointment_id, {"status": "cancelled"})
            
            if result:
                logger.info(f"Appointment cancelled: {appointment_id}")
                return True
            
            # Fallback for demo mode
            logger.info(f"Mock appointment cancellation for {appointment_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel appointment {appointment_id}: {str(e)}")
            return False
    
    async def check_availability(self, doctor_id: str, appointment_date: date, appointment_time: str) -> bool:
        """Check if a doctor is available at the specified time."""
        try:
            # In a real system, this would check the doctor's schedule
            # For now, we'll do basic validation
            
            appointment_datetime = datetime.combine(
                appointment_date,
                datetime.strptime(appointment_time, "%H:%M").time()
            )
            
            # Don't allow appointments in the past
            if appointment_datetime <= datetime.now():
                return False
            
            # Don't allow appointments outside business hours (8 AM - 6 PM)
            hour = appointment_datetime.hour
            if hour < 8 or hour >= 18:
                return False
            
            # In production, check against existing appointments
            logger.info(f"Availability check passed for doctor {doctor_id} on {appointment_date} at {appointment_time}")
            return True
            
        except Exception as e:
            logger.error(f"Availability check failed: {str(e)}")
            return False

# Global service instance
appointment_service = AppointmentService()

def get_appointment_service() -> AppointmentService:
    """Get the global appointment service instance."""
    return appointment_service
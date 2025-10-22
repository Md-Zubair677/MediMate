from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
import re
from datetime import datetime, timedelta, date
import boto3
import json

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

class ChatBookingRequest(BaseModel):
    message: str
    userId: str
    userName: str

class AppointmentCreate(BaseModel):
    user_id: str
    user_name: str
    doctor_name: str
    date: str
    time: str
    location: str

class Appointment(BaseModel):
    appointment_id: str
    user_id: str
    user_name: str
    doctor_name: str
    date: str
    time: str
    location: str
    status: str
    created_at: str
    updated_at: str

# Mock database
appointments_db = []

def generate_future_slots():
    """Generate available slots for the next 30 days"""
    slots = {}
    doctors = ["Dr. Smith", "Dr. Johnson", "Cardiology", "Dermatology"]
    
    for doctor in doctors:
        slots[doctor] = []
        for days_ahead in range(1, 31):  # Next 30 days, starting tomorrow
            future_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            # Add morning and afternoon slots
            slots[doctor].extend([
                f"{future_date} 09:00",
                f"{future_date} 10:00", 
                f"{future_date} 11:00",
                f"{future_date} 14:00",
                f"{future_date} 15:00",
                f"{future_date} 16:00"
            ])
    return slots

# Generate future available slots
available_slots = generate_future_slots()

def parse_appointment_request(message: str):
    """Parse natural language appointment request"""
    message = message.lower()
    
    # Extract doctor/department
    doctor_patterns = [
        r"dr\.?\s+(\w+)",
        r"doctor\s+(\w+)",
        r"with\s+(dr\.?\s*\w+)",
        r"(cardiology|dermatology|neurology|orthopedic|pediatric|gynecology)"
    ]
    
    doctor = None
    for pattern in doctor_patterns:
        match = re.search(pattern, message)
        if match:
            doctor = match.group(1).title()
            if doctor.lower() in ["cardiology", "dermatology", "neurology", "orthopedic", "pediatric", "gynecology"]:
                doctor = doctor.capitalize()
            else:
                doctor = f"Dr. {doctor}"
            break
    
    # Extract date - only allow future dates
    date_patterns = [
        r"tomorrow",
        r"(\d{1,2})/(\d{1,2})/(\d{4})",
        r"(\d{1,2})-(\d{1,2})-(\d{4})",
        r"(\d{4})-(\d{1,2})-(\d{1,2})",
        r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)"
    ]
    
    appointment_date = None
    today = datetime.now().date()
    
    for pattern in date_patterns:
        match = re.search(pattern, message)
        if match:
            if pattern == r"tomorrow":
                appointment_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
            elif "monday" in pattern:
                # Find next occurrence of the day
                days_ahead = 1
                while (today + timedelta(days=days_ahead)).strftime("%A").lower() != match.group(1):
                    days_ahead += 1
                    if days_ahead > 7:  # Prevent infinite loop
                        break
                appointment_date = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            else:
                # Parse specific date
                try:
                    if len(match.groups()) == 3:
                        if match.group(3):  # Full year provided
                            parsed_date = datetime.strptime(f"{match.group(1)}/{match.group(2)}/{match.group(3)}", "%m/%d/%Y").date()
                        else:
                            parsed_date = datetime.strptime(f"{match.group(1)}/{match.group(2)}/{datetime.now().year}", "%m/%d/%Y").date()
                    else:
                        parsed_date = datetime.strptime(match.group(0), "%Y-%m-%d").date()
                    
                    # Only allow future dates
                    if parsed_date > today:
                        appointment_date = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    continue
            break
    
    # Extract time
    time_patterns = [
        r"(\d{1,2}):?(\d{2})?\s*(am|pm)",
        r"(\d{1,2})\s*(am|pm)",
        r"(\d{1,2}):(\d{2})"
    ]
    
    time = None
    for pattern in time_patterns:
        match = re.search(pattern, message)
        if match:
            if len(match.groups()) >= 3 and match.group(3):
                hour = int(match.group(1))
                minute = match.group(2) or "00"
                period = match.group(3)
                if period == "pm" and hour != 12:
                    hour += 12
                elif period == "am" and hour == 12:
                    hour = 0
                time = f"{hour:02d}:{minute}"
            elif len(match.groups()) >= 2 and match.group(2) in ["am", "pm"]:
                hour = int(match.group(1))
                period = match.group(2)
                if period == "pm" and hour != 12:
                    hour += 12
                elif period == "am" and hour == 12:
                    hour = 0
                time = f"{hour:02d}:00"
            else:
                hour = int(match.group(1))
                minute = match.group(2) if len(match.groups()) > 1 else "00"
                time = f"{hour:02d}:{minute}"
            break
    
    # Extract intent
    intent = "book"
    if any(word in message for word in ["cancel", "delete", "remove"]):
        intent = "cancel"
    elif any(word in message for word in ["show", "list", "view", "my"]):
        intent = "view"
    
    return {
        "intent": intent,
        "doctor": doctor,
        "date": appointment_date,
        "time": time
    }

def check_slot_availability(doctor: str, date: str, time: str):
    """Check if appointment slot is available and not in the past"""
    # Check if date is in the future
    try:
        appointment_date = datetime.strptime(date, "%Y-%m-%d").date()
        if appointment_date <= datetime.now().date():
            return False
    except ValueError:
        return False
    
    slot_key = f"{date} {time}"
    return slot_key in available_slots.get(doctor, [])

def suggest_alternative_slots(doctor: str):
    """Suggest alternative available slots (only future dates)"""
    today = datetime.now().date()
    future_slots = []
    
    for slot in available_slots.get(doctor, []):
        slot_date = datetime.strptime(slot.split()[0], "%Y-%m-%d").date()
        if slot_date > today:
            future_slots.append(slot)
        if len(future_slots) >= 5:  # Limit to 5 suggestions
            break
    
    return future_slots

async def send_sns_notification(phone: str, email: str, message: str, subject: str):
    """Send SMS and Email via AWS SNS"""
    try:
        # Initialize SNS client (mock for demo)
        print(f"📱 SMS to {phone}: {message}")
        print(f"📧 Email to {email}: {subject}")
        return True
    except Exception as e:
        print(f"Failed to send notification: {e}")
        return False

@router.post("/chat-book")
async def chat_based_booking(request: ChatBookingRequest):
    """Handle chat-based appointment booking"""
    try:
        parsed = parse_appointment_request(request.message)
        
        if parsed["intent"] == "view":
            user_appointments = [apt for apt in appointments_db if apt["user_id"] == request.userId]
            if not user_appointments:
                return {"response": "You don't have any appointments scheduled.", "appointmentCreated": False}
            
            response = "Here are your appointments:\n"
            for apt in user_appointments:
                response += f"• {apt['doctor_name']} on {apt['date']} at {apt['time']} - {apt['status']}\n"
            return {"response": response, "appointmentCreated": False}
        
        elif parsed["intent"] == "cancel":
            if parsed["doctor"]:
                cancelled = False
                for apt in appointments_db:
                    if apt["user_id"] == request.userId and parsed["doctor"].lower() in apt["doctor_name"].lower() and apt["status"] == "Booked":
                        apt["status"] = "Cancelled"
                        apt["updated_at"] = datetime.now().isoformat()
                        cancelled = True
                        
                        # Send cancellation notification
                        await send_sns_notification(
                            "+1234567890",  # Mock phone
                            "user@example.com",  # Mock email
                            f"Hi {request.userName}, your appointment with {apt['doctor_name']} on {apt['date']} at {apt['time']} has been Cancelled. – MediMate",
                            "Appointment Cancelled Confirmation – MediMate"
                        )
                        break
                
                if cancelled:
                    return {"response": f"Your appointment with {parsed['doctor']} has been cancelled.", "appointmentCreated": False}
                else:
                    return {"response": f"No active appointment found with {parsed['doctor']}.", "appointmentCreated": False}
            else:
                return {"response": "Please specify which doctor's appointment you want to cancel.", "appointmentCreated": False}
        
        elif parsed["intent"] == "book":
            if not parsed["doctor"]:
                return {"response": "Please specify the doctor or department you'd like to book with.", "appointmentCreated": False}
            
            if not parsed["date"]:
                return {"response": f"Please specify a future date for your appointment with {parsed['doctor']}. Past dates are not allowed.", "appointmentCreated": False}
            
            if not parsed["time"]:
                return {"response": f"Please specify the time for your appointment with {parsed['doctor']} on {parsed['date']}.", "appointmentCreated": False}
            
            # Check if date is in the future
            try:
                appointment_date = datetime.strptime(parsed["date"], "%Y-%m-%d").date()
                if appointment_date <= datetime.now().date():
                    return {"response": "Sorry, appointments can only be booked for future dates. Please choose a date after today.", "appointmentCreated": False}
            except ValueError:
                return {"response": "Invalid date format. Please use a valid future date.", "appointmentCreated": False}
            
            # Check availability
            if check_slot_availability(parsed["doctor"], parsed["date"], parsed["time"]):
                # Create appointment
                appointment_id = str(uuid.uuid4())[:8]
                new_appointment = {
                    "appointment_id": appointment_id,
                    "user_id": request.userId,
                    "user_name": request.userName,
                    "doctor_name": parsed["doctor"],
                    "date": parsed["date"],
                    "time": parsed["time"],
                    "location": "MediMate Clinic",
                    "status": "Booked",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                appointments_db.append(new_appointment)
                
                # Remove slot from available slots
                slot_key = f"{parsed['date']} {parsed['time']}"
                if parsed["doctor"] in available_slots and slot_key in available_slots[parsed["doctor"]]:
                    available_slots[parsed["doctor"]].remove(slot_key)
                
                # Send confirmation notification
                await send_sns_notification(
                    "+1234567890",  # Mock phone
                    "user@example.com",  # Mock email
                    f"Hi {request.userName}, your appointment with {parsed['doctor']} on {parsed['date']} at {parsed['time']} has been Booked. – MediMate",
                    "Appointment Booked Confirmation – MediMate"
                )
                
                return {
                    "response": f"✅ Appointment booked successfully!\n\nDetails:\n• Doctor: {parsed['doctor']}\n• Date: {parsed['date']}\n• Time: {parsed['time']}\n• ID: {appointment_id}\n\nYou'll receive SMS and email confirmations shortly.",
                    "appointmentCreated": True
                }
            else:
                # Suggest alternatives
                alternatives = suggest_alternative_slots(parsed["doctor"])
                if alternatives:
                    alt_text = "\n".join([f"• {slot}" for slot in alternatives])
                    return {
                        "response": f"Sorry, {parsed['doctor']} is not available on {parsed['date']} at {parsed['time']}.\n\nAvailable future slots:\n{alt_text}\n\nPlease choose one of these times.",
                        "appointmentCreated": False
                    }
                else:
                    return {
                        "response": f"Sorry, {parsed['doctor']} has no available slots at the moment. Please try a different doctor or check back later.",
                        "appointmentCreated": False
                    }
        
        return {"response": "I didn't understand your request. Please try: 'Book appointment with Dr. Smith tomorrow 3pm' or 'Show my appointments'", "appointmentCreated": False}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(e)}")

@router.get("/user/{user_id}")
async def get_user_appointments(user_id: str):
    """Get all appointments for a user"""
    try:
        user_appointments = [apt for apt in appointments_db if apt["user_id"] == user_id]
        return {"appointments": user_appointments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch appointments: {str(e)}")

@router.put("/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str):
    """Cancel an appointment"""
    try:
        for apt in appointments_db:
            if apt["appointment_id"] == appointment_id and apt["status"] == "Booked":
                apt["status"] = "Cancelled"
                apt["updated_at"] = datetime.now().isoformat()
                
                # Send cancellation notification
                await send_sns_notification(
                    "+1234567890",  # Mock phone
                    "user@example.com",  # Mock email
                    f"Hi {apt['user_name']}, your appointment with {apt['doctor_name']} on {apt['date']} at {apt['time']} has been Cancelled. – MediMate",
                    "Appointment Cancelled Confirmation – MediMate"
                )
                
                return {"success": True, "message": "Appointment cancelled successfully"}
        
        raise HTTPException(status_code=404, detail="Appointment not found or already cancelled")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel appointment: {str(e)}")

@router.get("/available-slots/{doctor}")
async def get_available_slots(doctor: str):
    """Get available slots for a doctor (future dates only)"""
    try:
        today = datetime.now().date()
        future_slots = []
        
        for slot in available_slots.get(doctor, []):
            slot_date = datetime.strptime(slot.split()[0], "%Y-%m-%d").date()
            if slot_date > today:
                future_slots.append(slot)
        
        return {"doctor": doctor, "available_slots": future_slots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get available slots: {str(e)}")

def parse_appointment_request(message: str):
    """Parse natural language appointment request"""
    message = message.lower()
    
    # Extract doctor/department
    doctor_patterns = [
        r"dr\.?\s+(\w+)",
        r"doctor\s+(\w+)",
        r"with\s+(dr\.?\s*\w+)",
        r"(cardiology|dermatology|neurology|orthopedic|pediatric|gynecology)"
    ]
    
    doctor = None
    for pattern in doctor_patterns:
        match = re.search(pattern, message)
        if match:
            doctor = match.group(1).title()
            if doctor.lower() in ["cardiology", "dermatology", "neurology", "orthopedic", "pediatric", "gynecology"]:
                doctor = doctor.capitalize()
            else:
                doctor = f"Dr. {doctor}"
            break
    
    # Extract date
    date_patterns = [
        r"tomorrow",
        r"today",
        r"(\d{1,2})/(\d{1,2})",
        r"(\d{1,2})-(\d{1,2})",
        r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)"
    ]
    
    date = None
    for pattern in date_patterns:
        match = re.search(pattern, message)
        if match:
            if pattern == r"tomorrow":
                date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            elif pattern == r"today":
                date = datetime.now().strftime("%Y-%m-%d")
            else:
                # For simplicity, assume current year and month
                date = "2024-10-19"  # Mock date
            break
    
    # Extract time
    time_patterns = [
        r"(\d{1,2}):?(\d{2})?\s*(am|pm)",
        r"(\d{1,2})\s*(am|pm)",
        r"(\d{1,2}):(\d{2})"
    ]
    
    time = None
    for pattern in time_patterns:
        match = re.search(pattern, message)
        if match:
            if len(match.groups()) >= 3:
                hour = int(match.group(1))
                minute = match.group(2) or "00"
                period = match.group(3)
                if period == "pm" and hour != 12:
                    hour += 12
                elif period == "am" and hour == 12:
                    hour = 0
                time = f"{hour:02d}:{minute}"
            else:
                time = "09:00"  # Default time
            break
    
    # Extract intent
    intent = "book"
    if any(word in message for word in ["cancel", "delete", "remove"]):
        intent = "cancel"
    elif any(word in message for word in ["show", "list", "view", "my"]):
        intent = "view"
    
    return {
        "intent": intent,
        "doctor": doctor,
        "date": date,
        "time": time
    }

def check_slot_availability(doctor: str, date: str, time: str):
    """Check if appointment slot is available"""
    slot_key = f"{date} {time}"
    return slot_key in available_slots.get(doctor, [])

def suggest_alternative_slots(doctor: str):
    """Suggest alternative available slots"""
    return available_slots.get(doctor, [])[:3]

async def send_sns_notification(phone: str, email: str, message: str, subject: str):
    """Send SMS and Email via AWS SNS"""
    try:
        # Initialize SNS client (mock for demo)
        print(f"📱 SMS to {phone}: {message}")
        print(f"📧 Email to {email}: {subject}")
        return True
    except Exception as e:
        print(f"Failed to send notification: {e}")
        return False

@router.post("/chat-book")
async def chat_based_booking(request: ChatBookingRequest):
    """Handle chat-based appointment booking"""
    try:
        parsed = parse_appointment_request(request.message)
        
        if parsed["intent"] == "view":
            user_appointments = [apt for apt in appointments_db if apt["user_id"] == request.userId]
            if not user_appointments:
                return {"response": "You don't have any appointments scheduled.", "appointmentCreated": False}
            
            response = "Here are your appointments:\n"
            for apt in user_appointments:
                response += f"• {apt['doctor_name']} on {apt['date']} at {apt['time']} - {apt['status']}\n"
            return {"response": response, "appointmentCreated": False}
        
        elif parsed["intent"] == "cancel":
            if parsed["doctor"]:
                cancelled = False
                for apt in appointments_db:
                    if apt["user_id"] == request.userId and parsed["doctor"].lower() in apt["doctor_name"].lower() and apt["status"] == "Booked":
                        apt["status"] = "Cancelled"
                        apt["updated_at"] = datetime.now().isoformat()
                        cancelled = True
                        
                        # Send cancellation notification
                        await send_sns_notification(
                            "+1234567890",  # Mock phone
                            "user@example.com",  # Mock email
                            f"Hi {request.userName}, your appointment with {apt['doctor_name']} on {apt['date']} at {apt['time']} has been Cancelled. – MediMate",
                            "Appointment Cancelled Confirmation – MediMate"
                        )
                        break
                
                if cancelled:
                    return {"response": f"Your appointment with {parsed['doctor']} has been cancelled.", "appointmentCreated": False}
                else:
                    return {"response": f"No active appointment found with {parsed['doctor']}.", "appointmentCreated": False}
            else:
                return {"response": "Please specify which doctor's appointment you want to cancel.", "appointmentCreated": False}
        
        elif parsed["intent"] == "book":
            if not parsed["doctor"]:
                return {"response": "Please specify the doctor or department you'd like to book with.", "appointmentCreated": False}
            
            if not parsed["date"] or not parsed["time"]:
                return {"response": f"Please specify both date and time for your appointment with {parsed['doctor']}.", "appointmentCreated": False}
            
            # Check availability
            if check_slot_availability(parsed["doctor"], parsed["date"], parsed["time"]):
                # Create appointment
                appointment_id = str(uuid.uuid4())[:8]
                new_appointment = {
                    "appointment_id": appointment_id,
                    "user_id": request.userId,
                    "user_name": request.userName,
                    "doctor_name": parsed["doctor"],
                    "date": parsed["date"],
                    "time": parsed["time"],
                    "location": "MediMate Clinic",
                    "status": "Booked",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                appointments_db.append(new_appointment)
                
                # Remove slot from available slots
                slot_key = f"{parsed['date']} {parsed['time']}"
                if parsed["doctor"] in available_slots and slot_key in available_slots[parsed["doctor"]]:
                    available_slots[parsed["doctor"]].remove(slot_key)
                
                # Send confirmation notification
                await send_sns_notification(
                    "+1234567890",  # Mock phone
                    "user@example.com",  # Mock email
                    f"Hi {request.userName}, your appointment with {parsed['doctor']} on {parsed['date']} at {parsed['time']} has been Booked. – MediMate",
                    "Appointment Booked Confirmation – MediMate"
                )
                
                return {
                    "response": f"✅ Appointment booked successfully!\n\nDetails:\n• Doctor: {parsed['doctor']}\n• Date: {parsed['date']}\n• Time: {parsed['time']}\n• ID: {appointment_id}\n\nYou'll receive SMS and email confirmations shortly.",
                    "appointmentCreated": True
                }
            else:
                # Suggest alternatives
                alternatives = suggest_alternative_slots(parsed["doctor"])
                if alternatives:
                    alt_text = "\n".join([f"• {slot}" for slot in alternatives])
                    return {
                        "response": f"Sorry, {parsed['doctor']} is not available on {parsed['date']} at {parsed['time']}.\n\nAvailable slots:\n{alt_text}\n\nPlease choose one of these times.",
                        "appointmentCreated": False
                    }
                else:
                    return {
                        "response": f"Sorry, {parsed['doctor']} has no available slots at the moment. Please try a different doctor or check back later.",
                        "appointmentCreated": False
                    }
        
        return {"response": "I didn't understand your request. Please try: 'Book appointment with Dr. Smith tomorrow 3pm' or 'Show my appointments'", "appointmentCreated": False}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(e)}")

@router.get("/user/{user_id}")
async def get_user_appointments(user_id: str):
    """Get all appointments for a user"""
    try:
        user_appointments = [apt for apt in appointments_db if apt["user_id"] == user_id]
        return {"appointments": user_appointments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch appointments: {str(e)}")

@router.put("/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str):
    """Cancel an appointment"""
    try:
        for apt in appointments_db:
            if apt["appointment_id"] == appointment_id and apt["status"] == "Booked":
                apt["status"] = "Cancelled"
                apt["updated_at"] = datetime.now().isoformat()
                
                # Send cancellation notification
                await send_sns_notification(
                    "+1234567890",  # Mock phone
                    "user@example.com",  # Mock email
                    f"Hi {apt['user_name']}, your appointment with {apt['doctor_name']} on {apt['date']} at {apt['time']} has been Cancelled. – MediMate",
                    "Appointment Cancelled Confirmation – MediMate"
                )
                
                return {"success": True, "message": "Appointment cancelled successfully"}
        
        raise HTTPException(status_code=404, detail="Appointment not found or already cancelled")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel appointment: {str(e)}")

@router.get("/available-slots/{doctor}")
async def get_available_slots(doctor: str):
    """Get available slots for a doctor"""
    try:
        slots = available_slots.get(doctor, [])
        return {"doctor": doctor, "available_slots": slots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get available slots: {str(e)}")

@router.post("/book")
async def book_appointment(appointment: AppointmentCreate):
    """Book a new appointment"""
    try:
        appointment_id = str(uuid.uuid4())
        new_appointment = {
            "appointment_id": appointment_id,
            "user_id": appointment.user_id,
            "user_name": appointment.user_name,
            "doctor_name": appointment.doctor_name,
            "date": appointment.date,
            "time": appointment.time,
            "location": appointment.location,
            "status": "confirmed",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        appointments_db.append(new_appointment)
        
        # Send confirmation notification
        await send_sns_notification(
            "+1234567890",  # Mock phone
            "user@example.com",  # Mock email
            f"Hi {appointment.user_name}, your appointment with {appointment.doctor_name} on {appointment.date} at {appointment.time} has been confirmed. – MediMate",
            "Appointment Confirmation – MediMate"
        )
        
        return {
            "success": True,
            "message": "Appointment booked successfully",
            "appointment_id": appointment_id,
            "appointment": new_appointment
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to book appointment: {str(e)}")

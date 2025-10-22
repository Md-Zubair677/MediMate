"""
AI Chat API endpoints for health consultations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import uuid
import logging
import requests

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

async def send_chat_notification(message_type: str, patient_message: str, ai_response: str, user_id: str = "patient"):
    """Send notifications for chat interactions"""
    try:
        notification_data = {
            "type": message_type,  # 'emergency', 'health_consultation', 'symptom_check'
            "patientEmail": "patient@example.com",
            "doctorEmail": "dr.primary.care@medimate.com",
            "chatData": {
                "patientMessage": patient_message,
                "aiResponse": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response,
                "userId": user_id,
                "timestamp": "2025-09-21T16:15:00Z"
            }
        }
        
        # Send notification (in demo mode, just log)
        # In production, this would call the notification service
        requests.post("http://localhost:8000/api/notifications/chat", 
                     json=notification_data, timeout=1)
    except:
        # Fallback - just log in demo mode
        logger.info(f"Chat notification sent: {message_type}")

def detect_emergency(message: str) -> bool:
    """Detect emergency keywords in message"""
    emergency_keywords = [
        "chest pain", "difficulty breathing", "can't breathe", "heart attack",
        "stroke", "severe bleeding", "unconscious", "suicide", "overdose",
        "severe pain", "choking", "allergic reaction", "anaphylaxis"
    ]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in emergency_keywords)

def get_emergency_response() -> str:
    """Get emergency response with 911 guidance"""
    return """🚨 EMERGENCY DETECTED 🚨

IMMEDIATE ACTION REQUIRED:
• Call 911 NOW or go to nearest emergency room
• Do not delay - this could be life-threatening
• Stay calm and follow emergency operator instructions

While waiting for help:
• Stay with the patient
• Monitor breathing and consciousness
• Do not give food or water
• Keep patient comfortable

Nearest Emergency Services:
• Emergency: 911
• Poison Control: 1-800-222-1222

This is a medical emergency requiring immediate professional care."""

def get_structured_medical_response(message: str) -> str:
    """Get structured medical response based on symptoms/query"""
    message_lower = message.lower()
    
    # Specific symptom responses
    if "fever" in message_lower and "headache" in message_lower:
        return """Fever and Headache Management:

• Immediate Care:
  - Rest in a cool, quiet room
  - Stay hydrated with water and clear fluids
  - Monitor temperature every 2-4 hours

• Fever Reduction:
  - Use fever-reducing medications as directed
  - Apply cool compresses to forehead
  - Wear light, breathable clothing

• Seek Medical Attention If:
  - Fever exceeds 103°F (39.4°C)
  - Severe headache with neck stiffness
  - Symptoms worsen after 48 hours"""
    
    elif "stomach" in message_lower and ("pain" in message_lower or "ache" in message_lower):
        return """Stomach Pain Management:

• Immediate Relief:
  - Rest and avoid solid foods temporarily
  - Stay hydrated with clear fluids
  - Apply gentle heat to abdomen

• Dietary Adjustments:
  - Try bland foods (BRAT diet)
  - Avoid spicy, fatty, or acidic foods
  - Eat small, frequent meals

• Seek Medical Care If:
  - Severe or persistent pain
  - Vomiting or inability to keep fluids down
  - Signs of dehydration"""
    
    elif "headache" in message_lower:
        return """Headache Management:

• Immediate Relief:
  - Rest in a dark, quiet room
  - Apply cold or warm compress
  - Stay hydrated

• Pain Management:
  - Over-the-counter pain relievers as directed
  - Gentle neck and shoulder massage
  - Practice relaxation techniques

• Seek Medical Attention If:
  - Sudden, severe headache
  - Headache with fever, stiff neck, or vision changes
  - Persistent or worsening headaches"""
    
    elif "cough" in message_lower:
        return """Cough Management:

• Symptom Relief:
  - Stay hydrated with warm liquids
  - Use honey for throat soothing
  - Humidify the air

• Home Remedies:
  - Warm salt water gargling
  - Elevate head while sleeping
  - Avoid irritants like smoke

• Seek Medical Care If:
  - Cough persists over 2 weeks
  - Blood in sputum
  - High fever or difficulty breathing"""
    
    elif "diet" in message_lower or "nutrition" in message_lower or "eat" in message_lower:
        return """Healthy Nutrition Guidelines:

• Balanced Diet Essentials:
  - 5-9 servings of fruits and vegetables daily
  - Whole grains over refined carbohydrates
  - Lean proteins (fish, poultry, legumes)

• Hydration & Portions:
  - 8-10 glasses of water daily
  - Control portion sizes
  - Limit processed and sugary foods

• Meal Planning:
  - Regular meal times
  - Include healthy fats (nuts, olive oil)
  - Limit sodium and added sugars"""
    
    elif "exercise" in message_lower or "fitness" in message_lower:
        return """Exercise & Fitness Recommendations:

• Weekly Activity Goals:
  - 150 minutes moderate aerobic activity
  - 2+ days of strength training
  - Include flexibility and balance exercises

• Getting Started:
  - Start slowly and gradually increase
  - Choose activities you enjoy
  - Set realistic, achievable goals

• Safety Considerations:
  - Warm up before and cool down after
  - Stay hydrated during exercise
  - Listen to your body and rest when needed"""
    
    elif "sleep" in message_lower or "insomnia" in message_lower:
        return """Sleep Health Management:

• Sleep Hygiene:
  - Maintain consistent sleep schedule
  - Create comfortable sleep environment
  - Limit screen time before bed

• Relaxation Techniques:
  - Practice deep breathing or meditation
  - Try progressive muscle relaxation
  - Keep bedroom cool and dark

• Seek Help If:
  - Persistent sleep difficulties
  - Excessive daytime fatigue
  - Loud snoring or breathing interruptions"""
    
    elif "hello" in message_lower or "hi" in message_lower:
        return "Hello! I'm MediMate, your AI healthcare assistant. I'm here to help with your health questions and provide structured medical guidance. What symptoms or health concerns would you like to discuss today?"
    
    else:
        # Generic structured response for any health query
        return f"""Medical Guidance for Your Health Concern:

• Initial Assessment:
  - Monitor your symptoms closely
  - Note when symptoms started and severity
  - Keep track of any triggers or patterns

• General Care Recommendations:
  - Maintain good hydration
  - Get adequate rest
  - Follow a balanced diet

• When to Seek Professional Care:
  - Symptoms persist or worsen
  - You develop new concerning symptoms
  - You feel unsure about your condition

For personalized medical advice, please consult with a qualified healthcare provider."""

@router.post("/chat")
async def simple_chat(data: dict):
    """
    Simple chat endpoint for basic message handling.
    Compatible with frontend message format with multilingual support.
    """
    try:
        message = data.get("message", "")
        user_id = data.get("user_id", "patient")
        language = data.get("language", "en-US")
        
        # Check for emergency first
        if detect_emergency(message):
            emergency_response = get_emergency_response()
            
            # Send emergency notification to both patient and doctor
            await send_chat_notification("emergency", message, emergency_response, user_id)
            
            return {
                "response": emergency_response,
                "session_id": "emergency-session",
                "ai_powered": True,
                "emergency": True,
                "language": language,
                "disclaimer": "EMERGENCY: Call 911 immediately. This is not a substitute for emergency services."
            }
        
        # Get structured medical response
        response = get_structured_medical_response(message)
        
        # Send health consultation notification
        await send_chat_notification("health_consultation", message, response, user_id)
        
        return {
            "response": response,
            "session_id": "demo-session",
            "ai_powered": True,
            "language": language,
            "disclaimer": "This is for demo purposes only. Always consult a healthcare professional for medical advice."
        }
        
    except Exception as e:
        logger.error(f"Simple chat failed: {str(e)}")
        return {
            "response": "I'm experiencing technical difficulties. Please try again or consult a healthcare professional.",
            "session_id": "demo-session",
            "ai_powered": False,
            "disclaimer": "This is for demo purposes only. Always consult a healthcare professional for medical advice."
        }

@router.post("/appointments/auto-book")
async def auto_book_appointment(data: dict):
    """Auto-book appointment based on symptoms"""
    try:
        symptoms = data.get("symptoms", "")
        specialty = data.get("specialty", "General Medicine")
        
        appointment = {
            "id": f"APT-{abs(hash(symptoms)) % 10000:04d}",
            "date": "2024-10-19",
            "time": "10:00 AM",
            "doctorName": "Dr. Sarah Johnson",
            "specialty": specialty,
            "location": "MediMate Clinic",
            "status": "confirmed"
        }
        
        return {
            "success": True,
            "appointment": appointment,
            "message": "Appointment booked successfully"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

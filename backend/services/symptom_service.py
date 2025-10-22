import json
import uuid
from datetime import datetime
from .comprehend_service import extract_medical_entities
from .dynamodb_service import find_doctors_by_specialty, save_triage_log
from .bedrock_service import get_bedrock_service

# Red flag symptoms requiring immediate emergency care
RED_FLAGS = {
    "chest pain", "severe bleeding", "loss of consciousness", 
    "severe shortness of breath", "sudden weakness", "difficulty breathing",
    "severe headache", "stroke symptoms", "heart attack"
}

# Symptom to specialty mapping
SYMPTOM_TO_SPECIALTY = {
    "chest pain": ["cardiology", "emergency_medicine"],
    "shortness of breath": ["pulmonology", "cardiology"],
    "fever": ["internal_medicine", "general_practitioner"],
    "headache": ["neurology", "general_practitioner"],
    "abdominal pain": ["gastroenterology", "general_practitioner"],
    "rash": ["dermatology"],
    "dizziness": ["cardiology", "neurology"],
    "blood in stool": ["gastroenterology", "emergency_medicine"],
    "nausea": ["gastroenterology", "general_practitioner"],
    "fatigue": ["internal_medicine", "general_practitioner"]
}

def analyze_symptoms_and_suggest_doctors(patient_id, input_text, location=None):
    """
    Main function to analyze symptoms and suggest appropriate doctors
    """
    try:
        # 1. Extract medical entities
        entities = extract_medical_entities(input_text)
        symptoms = [e['text'].lower() for e in entities if e['category'] == 'SYMPTOM']
        
        # 2. Determine triage level
        triage_result = determine_triage(symptoms, input_text)
        
        # 3. Map symptoms to specialties
        specialties = map_symptoms_to_specialties(symptoms)
        
        # 4. Handle emergency cases
        if triage_result['level'] == 'emergency':
            # Send emergency notifications
            from .notification_service import notification_service
            from .cloudwatch_service import cloudwatch_service
            
            notification_service.send_emergency_alert(patient_id, input_text)
            cloudwatch_service.log_triage_decision(patient_id, 'emergency', symptoms)
            cloudwatch_service.put_metric('EmergencyTriageCount', 1)
            
            save_triage_log(patient_id, input_text, entities, 'emergency', specialties, triage_result['reason'])
            return {
                "triage": "emergency",
                "message": "🚨 MEDICAL EMERGENCY DETECTED\n\nBased on your symptoms, this requires immediate medical attention. Do not wait - seek emergency care now.",
                "escalation": True,
                "emergency_actions": [
                    {"type": "call", "label": "Call Emergency (911)", "action": "tel:911"},
                    {"type": "call", "label": "Call Medical Emergency (108)", "action": "tel:108"},
                    {"type": "navigate", "label": "Find Nearest Hospital", "action": "emergency_rooms"}
                ],
                "warning": "Emergency alert sent to medical team. Please proceed to nearest emergency room immediately."
            }
        
        # 5. Find matching doctors
        doctor_suggestions = find_matching_doctors(specialties, location)
        
        # 6. Generate explanation
        explanation = generate_patient_explanation(symptoms, triage_result['level'], specialties)
        
        # 7. Save triage log
        save_triage_log(patient_id, input_text, entities, triage_result['level'], specialties, triage_result['reason'])
        
        # 7. Log metrics
        from .cloudwatch_service import cloudwatch_service
        cloudwatch_service.log_triage_decision(patient_id, triage_result['level'], symptoms)
        cloudwatch_service.put_metric(f'Triage{triage_result["level"].title()}Count', 1)
        
        return {
            "triage": triage_result['level'],
            "specialties": specialties,
            "doctor_suggestions": doctor_suggestions,
            "explanation": explanation,
            "next_steps": get_next_steps(triage_result['level'], specialties),
            "appointment_prompt": f"Would you like me to book an appointment with a {specialties[0].replace('_', ' ')} specialist?",
            "privacy_note": "Your health data is securely stored and encrypted. We never share it without your consent."
        }
        
    except Exception as e:
        print(f"Error in symptom analysis: {e}")
        return {
            "error": "Unable to analyze symptoms. Please consult a healthcare provider.",
            "triage": "routine",
            "doctor_suggestions": []
        }

def determine_triage(symptoms, input_text):
    """
    Determine urgency level based on symptoms
    """
    # Check for red flag symptoms
    for symptom in symptoms:
        if any(flag in symptom for flag in RED_FLAGS):
            return {
                "level": "emergency",
                "reason": f"Red flag symptom detected: {symptom}"
            }
    
    # Check for urgent indicators in text
    urgent_keywords = ["severe", "intense", "unbearable", "can't breathe", "crushing", "sudden"]
    if any(keyword in input_text.lower() for keyword in urgent_keywords):
        return {
            "level": "urgent", 
            "reason": "Severe symptom indicators present"
        }
    
    return {
        "level": "routine",
        "reason": "No emergency or urgent indicators"
    }

def map_symptoms_to_specialties(symptoms):
    """
    Map symptoms to medical specialties
    """
    specialty_scores = {}
    
    for symptom in symptoms:
        # Direct mapping
        if symptom in SYMPTOM_TO_SPECIALTY:
            for specialty in SYMPTOM_TO_SPECIALTY[symptom]:
                specialty_scores[specialty] = specialty_scores.get(specialty, 0) + 1
        else:
            # Fuzzy matching for partial matches
            for key_symptom, specialties in SYMPTOM_TO_SPECIALTY.items():
                if key_symptom in symptom or symptom in key_symptom:
                    for specialty in specialties:
                        specialty_scores[specialty] = specialty_scores.get(specialty, 0) + 0.5
    
    # Default to general practitioner if no matches
    if not specialty_scores:
        specialty_scores["general_practitioner"] = 1
    
    # Sort by score
    return sorted(specialty_scores.keys(), key=lambda k: -specialty_scores[k])

def find_matching_doctors(specialties, location=None):
    """
    Find doctors matching the required specialties
    """
    all_doctors = []
    
    for specialty in specialties[:3]:  # Top 3 specialties
        doctors = find_doctors_by_specialty(specialty, location=location, limit=5)
        all_doctors.extend(doctors)
    
    # Remove duplicates and sort by rating
    unique_doctors = {}
    for doctor in all_doctors:
        if doctor['doctor_id'] not in unique_doctors:
            unique_doctors[doctor['doctor_id']] = doctor
    
    # Sort by rating and availability
    sorted_doctors = sorted(
        unique_doctors.values(), 
        key=lambda d: (-d.get('rating', 0), d.get('available_today', False)),
        reverse=False
    )
    
    return sorted_doctors[:10]

def generate_patient_explanation(symptoms, triage_level, specialties):
    """
    Generate patient-friendly explanation using Bedrock
    """
    try:
        prompt = f"""
        You are MediMate, a professional AI healthcare assistant. A patient reported: {', '.join(symptoms)}.
        
        Triage: {triage_level} | Specialties: {', '.join(specialties[:2])}
        
        Respond in this format:
        
        "Hello! I'm MediMate, your AI healthcare assistant. I'm here to guide you, but I'm not a replacement for a licensed doctor.
        
        **Immediate Care Steps:**
        • [Specific care for these symptoms]
        • [Monitoring advice]
        • [Self-care measures]
        
        **Seek Medical Care If:**
        • [Red flag symptoms to watch for]
        • [Timeline for seeking care]
        
        **Next Steps:**
        Would you like me to connect you with a {specialties[0].replace('_', ' ')} specialist for further evaluation?
        
        **Privacy Note:** Your health data is securely stored and encrypted.
        **Important:** This is preliminary guidance only - not a substitute for professional medical advice."
        """
        
        bedrock_service = get_bedrock_service()
        if not bedrock_service.client:
            return "AI service temporarily unavailable. Please consult a healthcare provider."
        
        import json
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        response = bedrock_service.client.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20240620-v1:0",
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
        
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return "Please consult with a healthcare provider for proper evaluation of your symptoms."

def get_next_steps(triage_level, specialties):
    """
    Get recommended next steps based on triage level
    """
    if triage_level == "emergency":
        return [
            "Call emergency services immediately (911/108)",
            "Go to nearest emergency room",
            "Do not drive yourself - call ambulance or have someone drive you"
        ]
    elif triage_level == "urgent":
        return [
            "Book appointment with recommended specialist within 24-48 hours",
            "Monitor symptoms closely",
            "Seek immediate care if symptoms worsen"
        ]
    else:
        return [
            "Consider booking appointment with recommended specialist",
            "Monitor symptoms and note any changes",
            "Practice self-care measures as appropriate"
        ]

def needs_clarification(input_text):
    """
    Determine if more information is needed for proper triage
    """
    clarifying_questions = []
    
    if "pain" in input_text.lower():
        if not any(word in input_text.lower() for word in ["severe", "mild", "moderate", "scale", "/10"]):
            clarifying_questions.append("On a scale of 1-10, how severe is the pain?")
    
    if "fever" in input_text.lower():
        if not any(word in input_text.lower() for word in ["temperature", "°", "degrees"]):
            clarifying_questions.append("How long have you had the fever?")
    
    if "headache" in input_text.lower():
        if not any(word in input_text.lower() for word in ["hours", "days", "weeks"]):
            clarifying_questions.append("How long have you had the headache?")
    
    if len(input_text.split()) < 5:
        clarifying_questions.append("Can you describe your symptoms in more detail? When did they start?")
    
    return clarifying_questions[:1]  # Return only first question
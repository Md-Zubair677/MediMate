"""
AWS Bedrock Service for MediMate Healthcare Platform.
Handles AI-powered health consultations using Claude 3.5 Sonnet.
"""

import boto3
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from botocore.exceptions import ClientError

from models.chat import HealthConsultation, ChatResponse, MedicalAdvice, UrgencyLevel

logger = logging.getLogger(__name__)

class BedrockService:
    """AWS Bedrock service for AI health consultations."""
    
    def __init__(self, region: str = "ap-south-1"):
        self.region = region
        self.model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"
        self.max_tokens = 1000
        self.temperature = 0.1
        self._client = None
    
    @property
    def client(self):
        """Get Bedrock Runtime client with lazy initialization."""
        if self._client is None:
            try:
                self._client = boto3.client('bedrock-runtime', region_name=self.region)
            except Exception as e:
                logger.warning(f"Could not initialize Bedrock client: {e}")
                self._client = None
        return self._client
    
    def _create_health_prompt(self, consultation: HealthConsultation, language: str = "en-US") -> str:
        """Create a structured prompt for health consultation with language support."""
        
        # Language-specific instructions
        language_instructions = {
            "te-IN": "దయచేసి తెలుగులో వైద్య సలహా అందించండి। వైద్య పరిభాషను సరళంగా వివరించండి।",
            "hi-IN": "कृपया हिंदी में चिकित्सा सलाह प्रदान करें। चिकित्सा शब्दावली को सरल भाषा में समझाएं।",
            "ta-IN": "தயவுசெய்து தமிழில் மருத்துவ ஆலோசனை வழங்கவும். மருத்துவ சொற்களை எளிய மொழியில் விளக்கவும்।",
            "kn-IN": "ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ವೈದ್ಯಕೀಯ ಸಲಹೆಯನ್ನು ಒದಗಿಸಿ. ವೈದ್ಯಕೀಯ ಪರಿಭಾಷೆಯನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ।",
            "es-ES": "Por favor proporcione consejos médicos en español. Explique la terminología médica en lenguaje sencillo.",
            "fr-FR": "Veuillez fournir des conseils médicaux en français. Expliquez la terminologie médicale en langage simple.",
            "de-DE": "Bitte geben Sie medizinische Beratung auf Deutsch. Erklären Sie medizinische Terminologie in einfacher Sprache."
        }
        
        lang_instruction = language_instructions.get(language, "Please provide medical advice in English.")
        
        prompt = f"""🏥 MediMate AI Medical Assistant

{lang_instruction}

I am a professional medical AI assistant helping patients with ANY health concerns, symptoms, or medical questions. Whether the patient has specific symptoms, general health questions, mental health concerns, or wellness inquiries, I provide comprehensive, personalized guidance.

Patient Consultation:
- Health Concern/Question: {consultation.symptoms}
- Medical History: {consultation.medical_history or 'Not provided'}
- Age: {consultation.age or 'Not provided'}
- Gender: {consultation.gender or 'Not provided'}
- Current Medications: {', '.join(consultation.current_medications) if consultation.current_medications else 'None reported'}
- Language: {language}
- Known Allergies: {', '.join(consultation.allergies) if consultation.allergies else 'None reported'}
- Urgency Level: {consultation.urgency_level.value if hasattr(consultation, 'urgency_level') else 'Not specified'}

Response Instructions:
Analyze the patient's concern and provide appropriate guidance. This could be:
- Symptom analysis and care recommendations
- Health information and education
- Mental health support and resources
- Wellness tips and lifestyle advice
- Preventive care guidance
- Medication information
- When to seek medical care

Please provide a response in this EXACT format:

🏥 Health Guidance

Understanding Your Concern:
✅ [Acknowledge and explain the patient's concern]
✅ [Provide relevant medical/health information]
✅ [Address any misconceptions or provide clarity]

Recommended Actions:
✅ [List 2-4 specific, actionable recommendations]
✅ [Include self-care measures, lifestyle changes, or immediate steps]
✅ [Provide timeline guidance when appropriate]

When to Seek Medical Care:
🚨 [List warning signs that require immediate attention]
🚨 [Include emergency symptoms to watch for if applicable]
🚨 [Specify when to contact healthcare providers]

Next Steps:
👨⚕️ [Recommend appropriate medical specialists if needed]
👨⚕️ [Suggest follow-up care or monitoring]
👨⚕️ [Include resources, tests, or evaluations that may be helpful]

Privacy & Disclaimer:
🔒 This guidance is for informational purposes only and does not replace professional medical advice.

⚠️ Important: For medical emergencies, please call emergency services immediately.

Please provide your health guidance now:"""

        return prompt
    
    def _parse_ai_response(self, response_text: str, session_id: str) -> ChatResponse:
        """Parse AI response and create structured ChatResponse."""
        
        # Extract key information from response
        suggested_actions = []
        if "seek immediate" in response_text.lower() or "emergency" in response_text.lower():
            suggested_actions.append("Seek immediate medical attention")
        if "follow up" in response_text.lower():
            suggested_actions.append("Schedule follow-up with healthcare provider")
        if "monitor" in response_text.lower():
            suggested_actions.append("Monitor symptoms and track changes")
        
        # Determine confidence score based on response content
        confidence_score = 0.8  # Default confidence
        if "uncertain" in response_text.lower() or "unclear" in response_text.lower():
            confidence_score = 0.6
        elif "likely" in response_text.lower() or "probably" in response_text.lower():
            confidence_score = 0.7
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            confidence_score=confidence_score,
            suggested_actions=suggested_actions if suggested_actions else None
        )
    
    def get_health_consultation(self, consultation: HealthConsultation, session_id: str, language: str = "en-US") -> ChatResponse:
        """Get AI health consultation response."""
        
        if not self.client:
            # Fallback response when Bedrock is not available
            fallback_response = f"""Thank you for sharing your symptoms with MediMate. I understand you're experiencing: {consultation.symptoms}

General Health Guidance:
- Monitor your symptoms and note any changes
- Stay hydrated and get adequate rest
- Consider over-the-counter remedies if appropriate for your symptoms
- Keep track of when symptoms started and their severity

When to Seek Medical Care:
- If symptoms worsen or persist for more than a few days
- If you develop fever, severe pain, or difficulty breathing
- If you have concerns about your condition
- For proper diagnosis and treatment recommendations

Important Reminder:
This is preliminary health guidance only. For accurate diagnosis and personalized treatment, please consult with a qualified healthcare professional who can properly evaluate your condition.

If this is a medical emergency, please call emergency services immediately."""
            
            return self._parse_ai_response(fallback_response, session_id)
        
        try:
            # Create prompt with language support
            prompt = self._create_health_prompt(consultation, language)
            
            # Prepare request body
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            # Call Bedrock
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            ai_response = response_body['content'][0]['text']
            
            logger.info(f"Bedrock consultation completed for patient {consultation.patient_id}")
            return self._parse_ai_response(ai_response, session_id)
            
        except Exception as e:
            logger.error(f"Bedrock consultation failed: {e}")
            
            # Return fallback response on error
            error_response = f"""I apologize, but I'm currently experiencing technical difficulties. However, I can still provide some general guidance about your symptoms: {consultation.symptoms}

General Recommendations:
- Monitor your symptoms carefully
- Stay hydrated and rest
- Consider consulting a healthcare professional for proper evaluation
- Seek immediate medical attention if symptoms worsen

When to Seek Care:
- If symptoms are severe or worsening
- If you're concerned about your condition
- For proper medical diagnosis and treatment

This is preliminary guidance only. Please consult a healthcare professional for proper medical care."""
            
            return self._parse_ai_response(error_response, session_id)
    
    def analyze_medical_text(self, text: str, context: str = "general") -> Dict[str, Any]:
        """Analyze medical text and extract insights."""
        
        if not self.client:
            return {
                "analysis": "Medical text analysis service temporarily unavailable",
                "confidence": 0.0,
                "insights": []
            }
        
        try:
            prompt = f"""Analyze the following medical text and provide insights:

Context: {context}
Medical Text: {text}

Please provide:
1. Key medical findings
2. Potential concerns or abnormalities
3. Recommendations for follow-up
4. Risk assessment

Use clear, professional language suitable for both patients and healthcare providers."""

            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": self.max_tokens,
                "temperature": 0.1,
                "messages": [{"role": "user", "content": prompt}]
            }
            
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            analysis = response_body['content'][0]['text']
            
            return {
                "analysis": analysis,
                "confidence": 0.85,
                "insights": self._extract_insights(analysis)
            }
            
        except Exception as e:
            logger.error(f"Medical text analysis failed: {e}")
            return {
                "analysis": "Analysis temporarily unavailable",
                "confidence": 0.0,
                "insights": []
            }
    
    def _extract_insights(self, analysis_text: str) -> List[Dict[str, Any]]:
        """Extract structured insights from analysis text."""
        insights = []
        
        # Simple keyword-based insight extraction
        if "normal" in analysis_text.lower():
            insights.append({
                "type": "normal_finding",
                "description": "Results appear within normal ranges",
                "confidence": 0.8
            })
        
        if "abnormal" in analysis_text.lower() or "elevated" in analysis_text.lower():
            insights.append({
                "type": "abnormal_finding",
                "description": "Some values may be outside normal ranges",
                "confidence": 0.7
            })
        
        if "follow" in analysis_text.lower() and "up" in analysis_text.lower():
            insights.append({
                "type": "follow_up_needed",
                "description": "Follow-up recommended",
                "confidence": 0.9
            })
        
        return insights

class ChatService:
    """Chat session management service."""
    
    def __init__(self):
        self.bedrock_service = BedrockService()
        self.active_sessions = {}
    
    def start_chat_session(self, patient_id: str) -> str:
        """Start a new chat session."""
        import uuid
        session_id = str(uuid.uuid4())
        
        self.active_sessions[session_id] = {
            'patient_id': patient_id,
            'messages': [],
            'created_at': datetime.now(),
            'last_activity': datetime.now()
        }
        
        return session_id
    
    def process_message(self, consultation: HealthConsultation, session_id: str, language: str = "en-US") -> ChatResponse:
        """Process a chat message and get AI response."""
        
        # Update session activity
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['last_activity'] = datetime.now()
            self.active_sessions[session_id]['messages'].append({
                'type': 'user',
                'content': consultation.symptoms,
                'timestamp': datetime.now()
            })
        
        # Get AI response
        response = self.bedrock_service.get_health_consultation(consultation, session_id, language)
        
        # Add AI response to session
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['messages'].append({
                'type': 'assistant',
                'content': response.response,
                'timestamp': datetime.now()
            })
        
        return response
    
    def get_session_history(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get chat session history."""
        return self.active_sessions.get(session_id)

# Service instances
bedrock_service = BedrockService()
chat_service = ChatService()

def get_bedrock_service() -> BedrockService:
    """Get the global bedrock service instance."""
    return bedrock_service

def get_chat_service() -> ChatService:
    """Get the global chat service instance."""
    return chat_service
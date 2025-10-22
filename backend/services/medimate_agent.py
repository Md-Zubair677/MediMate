"""
MediMate AI Agent - Central Coordinator
Minimal implementation for hackathon demo
"""

class MediMateAgent:
    def __init__(self):
        self.active_sessions = {}
        self.patient_states = {}
    
    async def process_patient_event(self, user_id: str, event_type: str, data: dict):
        """Central AI agent processing"""
        
        # Emergency Protocol
        if event_type == "emergency" or self._detect_emergency(data):
            return await self._handle_emergency(user_id, data)
        
        # Symptom Analysis
        elif event_type == "symptoms":
            return await self._analyze_symptoms(user_id, data)
        
        # Health Monitoring
        elif event_type == "health_check":
            return await self._health_assessment(user_id, data)
        
        # Default processing
        return {"status": "processed", "agent": "active"}
    
    def _detect_emergency(self, data: dict) -> bool:
        """Emergency detection logic"""
        content = str(data.get("message", "")).lower()
        emergency_keywords = ["chest pain", "can't breathe", "heart attack", "stroke"]
        return any(keyword in content for keyword in emergency_keywords)
    
    async def _handle_emergency(self, user_id: str, data: dict):
        """Emergency response protocol"""
        return {
            "status": "EMERGENCY",
            "priority": "CRITICAL",
            "actions": ["911_protocol_activated", "hospital_located", "emergency_contacts_notified"],
            "agent_response": "Emergency protocol activated - help is on the way"
        }
    
    async def _analyze_symptoms(self, user_id: str, data: dict):
        """Symptom analysis and triage"""
        symptoms = data.get("symptoms", "").lower()
        
        if any(word in symptoms for word in ["severe", "intense", "critical"]):
            severity = "HIGH"
            recommendation = "Seek immediate medical attention"
        elif any(word in symptoms for word in ["moderate", "persistent"]):
            severity = "MEDIUM" 
            recommendation = "Schedule appointment within 24 hours"
        else:
            severity = "LOW"
            recommendation = "Monitor symptoms, self-care recommended"
        
        return {
            "severity": severity,
            "recommendation": recommendation,
            "agent_analysis": f"AI triage complete - {severity} priority case"
        }
    
    async def _health_assessment(self, user_id: str, data: dict):
        """Health status assessment"""
        return {
            "health_score": 78,
            "risk_factors": ["Elevated BP", "Overweight"],
            "recommendations": ["Cardiology follow-up", "Lifestyle changes"],
            "agent_insights": "Moderate health status - proactive care recommended"
        }

# Global agent instance
agent = MediMateAgent()

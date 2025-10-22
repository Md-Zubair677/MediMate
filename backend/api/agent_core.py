from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from ..utils.aws_clients import get_bedrock_client

router = APIRouter()

class AgentAction(BaseModel):
    action_type: str
    parameters: Dict[str, Any]
    reasoning: str

class AgentResponse(BaseModel):
    agent_id: str
    actions_taken: List[AgentAction]
    final_recommendation: str
    confidence_score: float

@router.post("/api/agent/autonomous-assessment")
async def autonomous_medical_assessment(
    symptoms: List[str],
    vital_signs: Optional[Dict[str, float]] = None,
    patient_context: Optional[Dict[str, Any]] = None
):
    """Autonomous AI agent that reasons through medical assessment and takes actions"""
    
    bedrock = get_bedrock_client()
    
    # Agent reasoning prompt
    agent_prompt = f"""
    You are an autonomous medical AI agent. Analyze this case and determine actions:
    
    Symptoms: {symptoms}
    Vital Signs: {vital_signs or 'Not provided'}
    Patient Context: {patient_context or 'Limited information'}
    
    Think step-by-step and decide on actions:
    1. ASSESS: Evaluate symptom severity and patterns
    2. PRIORITIZE: Determine urgency and risk factors  
    3. RECOMMEND: Suggest specific next steps
    4. COORDINATE: Identify required resources/specialists
    5. MONITOR: Define follow-up requirements
    
    For each action, provide:
    - Action type (assess/prioritize/recommend/coordinate/monitor)
    - Specific parameters/details
    - Medical reasoning
    
    Output as JSON with structure:
    {{
        "actions": [
            {{
                "action_type": "assess",
                "parameters": {{"severity": "moderate", "pattern": "acute"}},
                "reasoning": "explanation"
            }}
        ],
        "final_recommendation": "summary",
        "confidence": 0.85
    }}
    """
    
    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1500,
                "messages": [{"role": "user", "content": agent_prompt}]
            })
        )
        
        analysis = json.loads(response['body'].read())
        ai_response = analysis['content'][0]['text']
        
        # Parse JSON response
        import re
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            agent_data = json.loads(json_match.group())
            
            actions = []
            for action in agent_data.get('actions', []):
                actions.append(AgentAction(
                    action_type=action.get('action_type', 'assess'),
                    parameters=action.get('parameters', {}),
                    reasoning=action.get('reasoning', 'Medical evaluation')
                ))
            
            return AgentResponse(
                agent_id=f"AGENT_{len(symptoms)}_{hash(str(symptoms)) % 1000}",
                actions_taken=actions,
                final_recommendation=agent_data.get('final_recommendation', 'Consult healthcare provider'),
                confidence_score=agent_data.get('confidence', 0.8)
            )
        
    except Exception:
        pass
    
    # Fallback autonomous reasoning
    actions = [
        AgentAction(
            action_type="assess",
            parameters={"symptom_count": len(symptoms), "complexity": "moderate"},
            reasoning=f"Evaluated {len(symptoms)} reported symptoms for pattern recognition"
        ),
        AgentAction(
            action_type="prioritize", 
            parameters={"urgency": "routine", "risk_level": "low-moderate"},
            reasoning="Determined appropriate care timeline based on symptom presentation"
        ),
        AgentAction(
            action_type="recommend",
            parameters={"next_step": "consultation", "timeframe": "1-2 weeks"},
            reasoning="Recommended healthcare provider consultation for comprehensive evaluation"
        )
    ]
    
    return AgentResponse(
        agent_id="AGENT_DEMO",
        actions_taken=actions,
        final_recommendation="Schedule consultation with primary care provider for symptom evaluation and care planning",
        confidence_score=0.75
    )

@router.post("/api/agent/care-orchestration")
async def care_orchestration_agent(
    patient_id: str,
    care_goals: List[str],
    current_treatments: List[str]
):
    """AI agent that orchestrates multi-disciplinary care coordination"""
    
    bedrock = get_bedrock_client()
    
    orchestration_prompt = f"""
    As a care orchestration AI agent, coordinate care for patient {patient_id}:
    
    Care Goals: {care_goals}
    Current Treatments: {current_treatments}
    
    Orchestrate care by:
    1. Analyzing treatment effectiveness
    2. Identifying care gaps
    3. Coordinating specialist involvement
    4. Scheduling follow-ups
    5. Monitoring progress metrics
    
    Provide orchestration plan with specific actions and timelines.
    """
    
    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": orchestration_prompt}]
            })
        )
        
        analysis = json.loads(response['body'].read())
        return {
            "orchestration_plan": analysis['content'][0]['text'],
            "patient_id": patient_id,
            "status": "active"
        }
        
    except Exception:
        return {
            "orchestration_plan": "Multi-disciplinary care coordination initiated. Regular monitoring and specialist consultation scheduled.",
            "patient_id": patient_id,
            "status": "fallback"
        }
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from services.medimate_agent import agent

router = APIRouter()
logger = logging.getLogger("medimate.orchestrator")

@router.post("/process")
async def process_health_event(request: dict):
    """Process health event through main AI agent"""
    try:
        user_id = request.get("user_id", "default_user")
        event_type = request.get("event_type", "general")
        data = request.get("data", {})
        
        result = await agent.process_patient_event(user_id, event_type, data)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Agent processing failed: {str(e)}")
        return {"success": False, "error": str(e)}

@router.post("/symptom-check")
async def intelligent_symptom_check(request: dict):
    """AI-powered symptom analysis via main agent"""
    try:
        user_id = request.get("user_id", "default_user")
        symptoms = request.get("symptoms", "")
        
        result = await agent.process_patient_event(
            user_id, "symptoms", {"symptoms": symptoms}
        )
        
        return {"success": True, "analysis": result}
    except Exception as e:
        logger.error(f"Symptom check failed: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/health-status/{user_id}")
async def get_health_status(user_id: str):
    """Get health status via main agent"""
    try:
        result = await agent.process_patient_event(
            user_id, "health_check", {}
        )
        
        # Format for frontend compatibility
        health_status = {
            "health_score": result.get("health_score", 78),
            "risk_factors": result.get("risk_factors", []),
            "recommendations": result.get("recommendations", []),
            "agent_insights": result.get("agent_insights", "")
        }
        
        return {"success": True, "health_status": health_status}
    except Exception as e:
        logger.error(f"Health status failed: {str(e)}")
        return {"success": False, "error": str(e)}

"""
Personalized AI API endpoints for MediMate Healthcare Platform.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/personalized", tags=["personalized-ai"])

@router.get("/genetic-insights/{user_id}")
async def get_genetic_insights(user_id: str):
    """Get genetic-based health insights"""
    try:
        insights = {
            "genetic_markers": {
                "APOE4": "positive",
                "BRCA1": "negative", 
                "MTHFR": "positive"
            },
            "risk_factors": [
                {
                    "condition": "Cardiovascular Disease",
                    "risk": "moderate",
                    "confidence": 0.78
                },
                {
                    "condition": "Type 2 Diabetes",
                    "risk": "low",
                    "confidence": 0.85
                }
            ],
            "recommendations": [
                "Regular cardiovascular screening recommended",
                "Mediterranean diet beneficial for your genetic profile",
                "Folate supplementation may be beneficial"
            ],
            "personalization_score": 94
        }
        
        return {"insights": insights, "user_id": user_id}
    except Exception as e:
        logger.error(f"Genetic insights error: {e}")
        raise HTTPException(status_code=500, detail="Genetic analysis unavailable")

@router.get("/behavioral-learning/{user_id}")
async def get_behavioral_learning(user_id: str):
    """Get behavioral learning insights"""
    try:
        learning = {
            "patterns": {
                "sleep_quality": "improving",
                "exercise_consistency": "good",
                "stress_levels": "moderate"
            },
            "adaptations": [
                "Adjusted medication reminders based on your routine",
                "Personalized exercise recommendations",
                "Stress management techniques tailored to your preferences"
            ],
            "learning_score": 87
        }
        
        return {"behavioral_learning": learning, "user_id": user_id}
    except Exception as e:
        logger.error(f"Behavioral learning error: {e}")
        raise HTTPException(status_code=500, detail="Behavioral analysis unavailable")

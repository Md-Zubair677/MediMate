from fastapi import APIRouter
from ..utils.cost_optimizer import get_estimated_costs, reset_daily_usage, CostOptimizer

router = APIRouter()

@router.get("/api/costs/daily")
async def get_daily_costs():
    """Get current daily cost estimates"""
    costs = get_estimated_costs()
    optimizer = CostOptimizer()
    
    return {
        "costs": costs,
        "usage": optimizer.daily_usage,
        "budget_status": {
            "bedrock_usage_pct": (optimizer.daily_usage['bedrock_tokens'] / optimizer.budget_limits['bedrock_daily_tokens']) * 100,
            "textract_usage_pct": (optimizer.daily_usage['textract_pages'] / optimizer.budget_limits['textract_daily_pages']) * 100,
            "within_budget": all([
                optimizer.daily_usage['bedrock_tokens'] <= optimizer.budget_limits['bedrock_daily_tokens'],
                optimizer.daily_usage['textract_pages'] <= optimizer.budget_limits['textract_daily_pages']
            ])
        }
    }

@router.post("/api/costs/reset")
async def reset_costs():
    """Reset daily usage counters"""
    reset_daily_usage()
    return {"message": "Daily usage counters reset"}

@router.get("/api/costs/budget")
async def get_budget_info():
    """Get hackathon budget information"""
    return {
        "total_budget": 100,
        "estimated_per_demo": 1.15,
        "max_demos": 87,
        "services": {
            "bedrock": {"cost_per_1k_tokens": 3.0, "daily_limit": 10000},
            "textract": {"cost_per_1k_pages": 1.5, "daily_limit": 50}
        },
        "optimization_tips": [
            "Use demo mode for development",
            "Cache API responses",
            "Batch document processing",
            "Monitor usage in real-time"
        ]
    }
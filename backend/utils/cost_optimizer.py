import os
import json
import time
from typing import Dict, Any
from functools import wraps

class CostOptimizer:
    """AWS cost optimization utilities for hackathon budget management"""
    
    def __init__(self):
        self.request_cache = {}
        self.daily_usage = {
            'bedrock_tokens': 0,
            'textract_pages': 0,
            'api_calls': 0
        }
        self.budget_limits = {
            'bedrock_daily_tokens': 10000,  # ~$2-3 per day
            'textract_daily_pages': 50,     # ~$0.75 per day
            'api_calls_daily': 1000         # Rate limiting
        }
    
    def check_budget_limits(self, service: str, usage: int) -> bool:
        """Check if usage is within budget limits"""
        current = self.daily_usage.get(f'{service}_daily_{usage}', 0)
        limit = self.budget_limits.get(f'{service}_daily_{usage}', float('inf'))
        return current + usage <= limit
    
    def cache_response(self, cache_key: str, response: Any, ttl: int = 3600):
        """Cache API responses to reduce costs"""
        self.request_cache[cache_key] = {
            'response': response,
            'timestamp': time.time(),
            'ttl': ttl
        }
    
    def get_cached_response(self, cache_key: str) -> Any:
        """Get cached response if valid"""
        if cache_key in self.request_cache:
            cached = self.request_cache[cache_key]
            if time.time() - cached['timestamp'] < cached['ttl']:
                return cached['response']
            else:
                del self.request_cache[cache_key]
        return None
    
    def track_usage(self, service: str, amount: int):
        """Track service usage for budget monitoring"""
        key = f'{service}_tokens' if service == 'bedrock' else f'{service}_pages'
        self.daily_usage[key] += amount
        self.daily_usage['api_calls'] += 1

def cost_optimized(service: str, cache_ttl: int = 3600):
    """Decorator for cost-optimized API calls"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            optimizer = CostOptimizer()
            
            # Create cache key from function args
            cache_key = f"{service}_{hash(str(args) + str(kwargs))}"
            
            # Check cache first
            cached_response = optimizer.get_cached_response(cache_key)
            if cached_response:
                return cached_response
            
            # Check budget limits
            estimated_usage = 1000 if service == 'bedrock' else 1
            if not optimizer.check_budget_limits(service, estimated_usage):
                return {"error": "Daily budget limit reached", "fallback": True}
            
            # Make actual API call
            try:
                response = await func(*args, **kwargs)
                optimizer.cache_response(cache_key, response, cache_ttl)
                optimizer.track_usage(service, estimated_usage)
                return response
            except Exception as e:
                return {"error": str(e), "fallback": True}
        
        return wrapper
    return decorator

# Budget monitoring utilities
def get_estimated_costs() -> Dict[str, float]:
    """Get estimated costs for current usage"""
    optimizer = CostOptimizer()
    
    bedrock_cost = (optimizer.daily_usage['bedrock_tokens'] / 1000) * 0.003  # $3 per 1K tokens
    textract_cost = (optimizer.daily_usage['textract_pages'] / 1000) * 1.50  # $1.50 per 1K pages
    
    return {
        'bedrock_daily': bedrock_cost,
        'textract_daily': textract_cost,
        'total_daily': bedrock_cost + textract_cost
    }

def reset_daily_usage():
    """Reset daily usage counters (call via cron job)"""
    optimizer = CostOptimizer()
    optimizer.daily_usage = {
        'bedrock_tokens': 0,
        'textract_pages': 0,
        'api_calls': 0
    }
"""
Production caching system for performance optimization.
"""

import json
import time
import hashlib
from typing import Any, Optional, Dict
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    """In-memory cache manager with TTL support."""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = 300  # 5 minutes
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from function arguments."""
        key_data = f"{prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry['expires_at']:
                return entry['value']
            else:
                # Expired, remove from cache
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL."""
        ttl = ttl or self.default_ttl
        self._cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl,
            'created_at': time.time()
        }
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if current_time >= entry['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        current_time = time.time()
        active_entries = sum(1 for entry in self._cache.values() 
                           if current_time < entry['expires_at'])
        
        return {
            'total_entries': len(self._cache),
            'active_entries': active_entries,
            'expired_entries': len(self._cache) - active_entries,
            'memory_usage_mb': len(str(self._cache)) / (1024 * 1024)
        }

# Global cache instance
cache = CacheManager()

def cached(ttl: int = 300, key_prefix: str = "default"):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {func.__name__}, result cached")
            
            return result
        return wrapper
    return decorator

# Specific cache decorators for common use cases
def cache_user_data(ttl: int = 600):
    """Cache user-related data for 10 minutes."""
    return cached(ttl=ttl, key_prefix="user")

def cache_health_data(ttl: int = 300):
    """Cache health predictions for 5 minutes."""
    return cached(ttl=ttl, key_prefix="health")

def cache_appointments(ttl: int = 180):
    """Cache appointment data for 3 minutes."""
    return cached(ttl=ttl, key_prefix="appointments")

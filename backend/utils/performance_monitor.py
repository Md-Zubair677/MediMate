"""
Production performance monitoring and optimization utilities.
"""

import time
import psutil
import logging
from functools import wraps
from typing import Dict, Any, Optional
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Monitor and optimize application performance."""
    
    def __init__(self):
        self.metrics = {}
        self.thresholds = {
            'response_time': 2.0,  # seconds
            'memory_usage': 80,    # percentage
            'cpu_usage': 70,       # percentage
            'error_rate': 5        # percentage
        }
    
    def measure_time(self, func_name: str = None):
        """Decorator to measure function execution time."""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    
                    # Log slow operations
                    if execution_time > self.thresholds['response_time']:
                        logger.warning(f"Slow operation: {func_name or func.__name__} took {execution_time:.2f}s")
                    
                    # Store metrics
                    self._record_metric(func_name or func.__name__, {
                        'execution_time': execution_time,
                        'status': 'success',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    self._record_metric(func_name or func.__name__, {
                        'execution_time': execution_time,
                        'status': 'error',
                        'error': str(e),
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    raise
            return wrapper
        return decorator
    
    def _record_metric(self, name: str, data: Dict[str, Any]):
        """Record performance metric."""
        if name not in self.metrics:
            self.metrics[name] = []
        
        self.metrics[name].append(data)
        
        # Keep only last 1000 entries per metric
        if len(self.metrics[name]) > 1000:
            self.metrics[name] = self.metrics[name][-1000:]
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics."""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def check_health(self) -> Dict[str, Any]:
        """Check overall system health."""
        system_metrics = self.get_system_metrics()
        
        health_status = {
            'status': 'healthy',
            'issues': [],
            'metrics': system_metrics
        }
        
        # Check thresholds
        if system_metrics['cpu_percent'] > self.thresholds['cpu_usage']:
            health_status['status'] = 'warning'
            health_status['issues'].append(f"High CPU usage: {system_metrics['cpu_percent']:.1f}%")
        
        if system_metrics['memory_percent'] > self.thresholds['memory_usage']:
            health_status['status'] = 'warning'
            health_status['issues'].append(f"High memory usage: {system_metrics['memory_percent']:.1f}%")
        
        return health_status
    
    def optimize_database_queries(self):
        """Optimize database query performance."""
        # Connection pooling optimization
        return {
            'connection_pool_size': 20,
            'max_overflow': 30,
            'pool_timeout': 30,
            'pool_recycle': 3600
        }
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate performance report."""
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'system_health': self.check_health(),
            'function_metrics': {}
        }
        
        # Analyze function performance
        for func_name, metrics in self.metrics.items():
            if metrics:
                recent_metrics = [m for m in metrics if 
                    datetime.fromisoformat(m['timestamp']) > datetime.utcnow() - timedelta(hours=1)]
                
                if recent_metrics:
                    avg_time = sum(m['execution_time'] for m in recent_metrics) / len(recent_metrics)
                    error_count = sum(1 for m in recent_metrics if m['status'] == 'error')
                    error_rate = (error_count / len(recent_metrics)) * 100
                    
                    report['function_metrics'][func_name] = {
                        'avg_execution_time': avg_time,
                        'error_rate': error_rate,
                        'total_calls': len(recent_metrics),
                        'errors': error_count
                    }
        
        return report

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

# Decorator for easy use
measure_performance = performance_monitor.measure_time

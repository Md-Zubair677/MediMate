"""
Centralized logging configuration with CloudWatch integration for MediMate platform.
Provides structured logging with performance metrics and error tracking.
"""

import logging
import logging.config
import json
import sys
import traceback
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import uuid

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

from utils.config import get_settings


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        
        # Base log data
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add request ID if available
        if hasattr(record, 'request_id'):
            log_data["request_id"] = record.request_id
        
        # Add user ID if available
        if hasattr(record, 'user_id'):
            log_data["user_id"] = record.user_id
        
        # Add performance metrics if available
        if hasattr(record, 'duration'):
            log_data["duration_ms"] = record.duration
        
        if hasattr(record, 'status_code'):
            log_data["status_code"] = record.status_code
        
        # Add custom fields
        for key, value in record.__dict__.items():
            if key.startswith('custom_'):
                log_data[key[7:]] = value  # Remove 'custom_' prefix
        
        # Add exception information
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields from logging call
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)
        
        return json.dumps(log_data, default=str, ensure_ascii=False)


class CloudWatchHandler(logging.Handler):
    """Custom CloudWatch Logs handler."""
    
    def __init__(self, log_group: str, log_stream: str, region: str = 'us-east-1'):
        super().__init__()
        self.log_group = log_group
        self.log_stream = log_stream
        self.region = region
        self.client = None
        self.sequence_token = None
        self.batch = []
        self.batch_size = 10
        
        if BOTO3_AVAILABLE:
            try:
                self.client = boto3.client('logs', region_name=region)
                self._ensure_log_group_exists()
                self._ensure_log_stream_exists()
            except (NoCredentialsError, ClientError) as e:
                print(f"Warning: CloudWatch logging not available: {e}")
                self.client = None
    
    def _ensure_log_group_exists(self):
        """Ensure log group exists."""
        try:
            self.client.describe_log_groups(logGroupNamePrefix=self.log_group)
        except ClientError:
            try:
                self.client.create_log_group(logGroupName=self.log_group)
                # Set retention policy (30 days)
                self.client.put_retention_policy(
                    logGroupName=self.log_group,
                    retentionInDays=30
                )
            except ClientError as e:
                print(f"Failed to create log group: {e}")
    
    def _ensure_log_stream_exists(self):
        """Ensure log stream exists."""
        try:
            response = self.client.describe_log_streams(
                logGroupName=self.log_group,
                logStreamNamePrefix=self.log_stream
            )
            
            streams = response.get('logStreams', [])
            if streams:
                self.sequence_token = streams[0].get('uploadSequenceToken')
            else:
                self.client.create_log_stream(
                    logGroupName=self.log_group,
                    logStreamName=self.log_stream
                )
        except ClientError as e:
            print(f"Failed to ensure log stream exists: {e}")
    
    def emit(self, record: logging.LogRecord):
        """Emit log record to CloudWatch."""
        if not self.client:
            return
        
        try:
            log_event = {
                'timestamp': int(record.created * 1000),
                'message': self.format(record)
            }
            
            self.batch.append(log_event)
            
            if len(self.batch) >= self.batch_size:
                self._send_batch()
        
        except Exception as e:
            print(f"Error sending log to CloudWatch: {e}")
    
    def _send_batch(self):
        """Send batch of log events to CloudWatch."""
        if not self.batch or not self.client:
            return
        
        try:
            kwargs = {
                'logGroupName': self.log_group,
                'logStreamName': self.log_stream,
                'logEvents': sorted(self.batch, key=lambda x: x['timestamp'])
            }
            
            if self.sequence_token:
                kwargs['sequenceToken'] = self.sequence_token
            
            response = self.client.put_log_events(**kwargs)
            self.sequence_token = response.get('nextSequenceToken')
            self.batch = []
            
        except ClientError as e:
            print(f"Failed to send logs to CloudWatch: {e}")
            self.batch = []
    
    def close(self):
        """Close handler and send remaining logs."""
        if self.batch:
            self._send_batch()
        super().close()


class PerformanceLogger:
    """Logger for performance metrics and monitoring."""
    
    def __init__(self, logger_name: str = "medimate.performance"):
        self.logger = logging.getLogger(logger_name)
    
    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        **kwargs
    ):
        """Log HTTP request performance."""
        
        extra = {
            'request_id': request_id,
            'user_id': user_id,
            'duration': duration_ms,
            'status_code': status_code,
            'custom_method': method,
            'custom_path': path,
            'custom_request_type': 'http_request'
        }
        
        # Add any additional metrics
        for key, value in kwargs.items():
            extra[f'custom_{key}'] = value
        
        level = logging.INFO
        if status_code >= 500:
            level = logging.ERROR
        elif status_code >= 400:
            level = logging.WARNING
        
        self.logger.log(
            level,
            f"{method} {path} - {status_code} ({duration_ms:.2f}ms)",
            extra=extra
        )
    
    def log_service_call(
        self,
        service: str,
        operation: str,
        duration_ms: float,
        success: bool = True,
        error: Optional[str] = None,
        **kwargs
    ):
        """Log external service call performance."""
        
        extra = {
            'duration': duration_ms,
            'custom_service': service,
            'custom_operation': operation,
            'custom_success': success,
            'custom_request_type': 'service_call'
        }
        
        if error:
            extra['custom_error'] = error
        
        # Add any additional metrics
        for key, value in kwargs.items():
            extra[f'custom_{key}'] = value
        
        level = logging.INFO if success else logging.ERROR
        
        message = f"{service}.{operation} - {'SUCCESS' if success else 'FAILED'} ({duration_ms:.2f}ms)"
        if error:
            message += f" - {error}"
        
        self.logger.log(level, message, extra=extra)
    
    def log_database_query(
        self,
        table: str,
        operation: str,
        duration_ms: float,
        record_count: Optional[int] = None,
        success: bool = True,
        error: Optional[str] = None
    ):
        """Log database query performance."""
        
        extra = {
            'duration': duration_ms,
            'custom_table': table,
            'custom_operation': operation,
            'custom_success': success,
            'custom_request_type': 'database_query'
        }
        
        if record_count is not None:
            extra['custom_record_count'] = record_count
        
        if error:
            extra['custom_error'] = error
        
        level = logging.INFO if success else logging.ERROR
        
        message = f"DB.{table}.{operation} - {'SUCCESS' if success else 'FAILED'} ({duration_ms:.2f}ms)"
        if record_count is not None:
            message += f" - {record_count} records"
        if error:
            message += f" - {error}"
        
        self.logger.log(level, message, extra=extra)


class SecurityLogger:
    """Logger for security events and audit trail."""
    
    def __init__(self, logger_name: str = "medimate.security"):
        self.logger = logging.getLogger(logger_name)
    
    def log_auth_event(
        self,
        event_type: str,
        user_id: Optional[str] = None,
        email: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        reason: Optional[str] = None
    ):
        """Log authentication events."""
        
        extra = {
            'custom_event_type': event_type,
            'custom_success': success,
            'custom_security_event': True
        }
        
        if user_id:
            extra['user_id'] = user_id
        if email:
            extra['custom_email'] = email
        if ip_address:
            extra['custom_ip_address'] = ip_address
        if user_agent:
            extra['custom_user_agent'] = user_agent
        if reason:
            extra['custom_reason'] = reason
        
        level = logging.INFO if success else logging.WARNING
        
        message = f"AUTH {event_type} - {'SUCCESS' if success else 'FAILED'}"
        if email:
            message += f" - {email}"
        if reason:
            message += f" - {reason}"
        
        self.logger.log(level, message, extra=extra)
    
    def log_access_event(
        self,
        resource: str,
        action: str,
        user_id: str,
        success: bool = True,
        reason: Optional[str] = None
    ):
        """Log resource access events."""
        
        extra = {
            'user_id': user_id,
            'custom_resource': resource,
            'custom_action': action,
            'custom_success': success,
            'custom_security_event': True
        }
        
        if reason:
            extra['custom_reason'] = reason
        
        level = logging.INFO if success else logging.WARNING
        
        message = f"ACCESS {action} {resource} - {'SUCCESS' if success else 'DENIED'}"
        if reason:
            message += f" - {reason}"
        
        self.logger.log(level, message, extra=extra)
    
    def log_data_event(
        self,
        operation: str,
        data_type: str,
        user_id: str,
        record_id: Optional[str] = None,
        sensitive: bool = False
    ):
        """Log data access and modification events."""
        
        extra = {
            'user_id': user_id,
            'custom_operation': operation,
            'custom_data_type': data_type,
            'custom_sensitive': sensitive,
            'custom_security_event': True
        }
        
        if record_id:
            extra['custom_record_id'] = record_id
        
        message = f"DATA {operation} {data_type}"
        if record_id:
            message += f" - {record_id}"
        if sensitive:
            message += " - SENSITIVE"
        
        self.logger.info(message, extra=extra)


def setup_logging(
    app_name: str = "medimate",
    log_level: str = "INFO",
    enable_cloudwatch: bool = True,
    cloudwatch_log_group: Optional[str] = None,
    log_file: Optional[str] = None
) -> Dict[str, logging.Logger]:
    """Setup centralized logging configuration."""
    
    settings = get_settings()
    
    # Create logs directory if using file logging
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Base logging configuration
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': JSONFormatter,
            },
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'json' if settings.environment == 'production' else 'standard',
                'stream': sys.stdout
            }
        },
        'loggers': {
            app_name: {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False
            },
            f'{app_name}.performance': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            f'{app_name}.security': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            'uvicorn': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            'uvicorn.access': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            }
        },
        'root': {
            'level': 'WARNING',
            'handlers': ['console']
        }
    }
    
    # Add file handler if specified
    if log_file:
        config['handlers']['file'] = {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': log_level,
            'formatter': 'json',
            'filename': log_file,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        }
        
        # Add file handler to all loggers
        for logger_config in config['loggers'].values():
            logger_config['handlers'].append('file')
    
    # Add CloudWatch handler if enabled and available
    if enable_cloudwatch and BOTO3_AVAILABLE and settings.environment == 'production':
        log_group = cloudwatch_log_group or f"/aws/medimate/{app_name}"
        log_stream = f"{app_name}-{datetime.utcnow().strftime('%Y-%m-%d')}"
        
        try:
            cloudwatch_handler = CloudWatchHandler(
                log_group=log_group,
                log_stream=log_stream,
                region=settings.aws_region
            )
            cloudwatch_handler.setFormatter(JSONFormatter())
            
            # Add CloudWatch handler to configuration
            config['handlers']['cloudwatch'] = {
                '()': lambda: cloudwatch_handler,
                'level': log_level
            }
            
            # Add CloudWatch handler to all loggers
            for logger_config in config['loggers'].values():
                logger_config['handlers'].append('cloudwatch')
                
        except Exception as e:
            print(f"Warning: Failed to setup CloudWatch logging: {e}")
    
    # Apply logging configuration
    logging.config.dictConfig(config)
    
    # Create specialized loggers
    loggers = {
        'main': logging.getLogger(app_name),
        'performance': PerformanceLogger(),
        'security': SecurityLogger()
    }
    
    loggers['main'].info(
        f"Logging configured - Level: {log_level}, CloudWatch: {enable_cloudwatch and BOTO3_AVAILABLE}"
    )
    
    return loggers


def get_logger(name: str = "medimate") -> logging.Logger:
    """Get logger instance."""
    return logging.getLogger(name)


def get_performance_logger() -> PerformanceLogger:
    """Get performance logger instance."""
    return PerformanceLogger()


def get_security_logger() -> SecurityLogger:
    """Get security logger instance."""
    return SecurityLogger()


# Context manager for performance logging
class LogPerformance:
    """Context manager for automatic performance logging."""
    
    def __init__(
        self,
        operation: str,
        logger: Optional[PerformanceLogger] = None,
        **kwargs
    ):
        self.operation = operation
        self.logger = logger or get_performance_logger()
        self.kwargs = kwargs
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.utcnow()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration = (datetime.utcnow() - self.start_time).total_seconds() * 1000
            
            success = exc_type is None
            error = str(exc_val) if exc_val else None
            
            if 'service' in self.kwargs:
                self.logger.log_service_call(
                    service=self.kwargs['service'],
                    operation=self.operation,
                    duration_ms=duration,
                    success=success,
                    error=error,
                    **{k: v for k, v in self.kwargs.items() if k != 'service'}
                )
            else:
                # Generic performance log
                extra = {
                    'duration': duration,
                    'custom_operation': self.operation,
                    'custom_success': success
                }
                
                if error:
                    extra['custom_error'] = error
                
                extra.update({f'custom_{k}': v for k, v in self.kwargs.items()})
                
                level = logging.INFO if success else logging.ERROR
                message = f"{self.operation} - {'SUCCESS' if success else 'FAILED'} ({duration:.2f}ms)"
                
                self.logger.logger.log(level, message, extra=extra)
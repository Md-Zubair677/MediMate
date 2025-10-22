"""
Custom exception classes and standardized HTTP error responses for MediMate platform.
Provides consistent error handling across all API endpoints.
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)


class MediMateException(Exception):
    """Base exception class for MediMate platform."""
    
    def __init__(
        self,
        message: str,
        error_code: str = "MEDIMATE_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(MediMateException):
    """Authentication related errors."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTH_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class AuthorizationError(MediMateException):
    """Authorization related errors."""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHZ_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class ValidationError(MediMateException):
    """Data validation errors."""
    
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )


class NotFoundError(MediMateException):
    """Resource not found errors."""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class ConflictError(MediMateException):
    """Resource conflict errors."""
    
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONFLICT_ERROR",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class ServiceUnavailableError(MediMateException):
    """Service unavailable errors."""
    
    def __init__(self, message: str = "Service temporarily unavailable", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="SERVICE_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details
        )


class ExternalServiceError(MediMateException):
    """External service integration errors."""
    
    def __init__(self, service_name: str, message: str = "External service error", details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["service"] = service_name
        super().__init__(
            message=f"{service_name}: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details
        )


class RateLimitError(MediMateException):
    """Rate limiting errors."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details
        )


class FileProcessingError(MediMateException):
    """File processing and upload errors."""
    
    def __init__(self, message: str = "File processing failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="FILE_PROCESSING_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class DatabaseError(MediMateException):
    """Database operation errors."""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


def create_error_response(
    error: Exception,
    request: Optional[Request] = None,
    include_traceback: bool = False
) -> Dict[str, Any]:
    """Create standardized error response."""
    
    timestamp = datetime.utcnow().isoformat()
    request_id = getattr(request.state, 'request_id', None) if request else None
    
    if isinstance(error, MediMateException):
        response = {
            "error": {
                "code": error.error_code,
                "message": error.message,
                "status_code": error.status_code,
                "timestamp": timestamp,
                "details": error.details
            }
        }
        
        if request_id:
            response["error"]["request_id"] = request_id
            
        if include_traceback:
            response["error"]["traceback"] = traceback.format_exc()
            
        return response
    
    elif isinstance(error, HTTPException):
        response = {
            "error": {
                "code": "HTTP_ERROR",
                "message": error.detail,
                "status_code": error.status_code,
                "timestamp": timestamp,
                "details": {}
            }
        }
        
        if request_id:
            response["error"]["request_id"] = request_id
            
        return response
    
    else:
        # Generic error
        response = {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "status_code": 500,
                "timestamp": timestamp,
                "details": {}
            }
        }
        
        if request_id:
            response["error"]["request_id"] = request_id
            
        if include_traceback:
            response["error"]["traceback"] = traceback.format_exc()
            response["error"]["original_error"] = str(error)
            
        return response


async def medimate_exception_handler(request: Request, exc: MediMateException) -> JSONResponse:
    """Handle MediMate custom exceptions."""
    
    logger.error(
        f"MediMate exception: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "request_id": getattr(request.state, 'request_id', None)
        }
    )
    
    error_response = create_error_response(exc, request)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    
    logger.warning(
        f"HTTP exception: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "request_id": getattr(request.state, 'request_id', None)
        }
    )
    
    error_response = create_error_response(exc, request)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    
    validation_errors = []
    for error in exc.errors():
        validation_errors.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        f"Validation error: {len(validation_errors)} field(s) failed validation",
        extra={
            "validation_errors": validation_errors,
            "request_id": getattr(request.state, 'request_id', None)
        }
    )
    
    medimate_exc = ValidationError(
        message="Request validation failed",
        details={
            "validation_errors": validation_errors,
            "error_count": len(validation_errors)
        }
    )
    
    error_response = create_error_response(medimate_exc, request)
    return JSONResponse(
        status_code=422,
        content=error_response
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    
    logger.error(
        f"Unexpected error: {type(exc).__name__} - {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "request_id": getattr(request.state, 'request_id', None)
        },
        exc_info=True
    )
    
    # Don't expose internal error details in production
    from utils.config import get_settings
    settings = get_settings()
    
    error_response = create_error_response(
        exc, 
        request, 
        include_traceback=settings.debug
    )
    
    return JSONResponse(
        status_code=500,
        content=error_response
    )


def setup_error_handlers(app):
    """Setup error handlers for FastAPI application."""
    
    # Custom MediMate exceptions
    app.add_exception_handler(MediMateException, medimate_exception_handler)
    
    # FastAPI HTTP exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    
    # Pydantic validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Generic exception handler (catch-all)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    logger.info("Error handlers configured successfully")


# Utility functions for common error scenarios

def raise_not_found(resource_type: str, resource_id: str) -> None:
    """Raise a standardized not found error."""
    raise NotFoundError(
        message=f"{resource_type} not found",
        details={
            "resource_type": resource_type,
            "resource_id": resource_id
        }
    )


def raise_validation_error(field: str, message: str, value: Any = None) -> None:
    """Raise a standardized validation error."""
    details = {"field": field, "message": message}
    if value is not None:
        details["value"] = str(value)
    
    raise ValidationError(
        message=f"Validation failed for field '{field}': {message}",
        details=details
    )


def raise_service_error(service_name: str, operation: str, error_message: str) -> None:
    """Raise a standardized external service error."""
    raise ExternalServiceError(
        service_name=service_name,
        message=f"Failed to {operation}: {error_message}",
        details={
            "operation": operation,
            "error_message": error_message
        }
    )


def raise_auth_error(reason: str = "Invalid credentials") -> None:
    """Raise a standardized authentication error."""
    raise AuthenticationError(
        message=reason,
        details={"reason": reason}
    )


def raise_authz_error(resource: str, action: str) -> None:
    """Raise a standardized authorization error."""
    raise AuthorizationError(
        message=f"Access denied for {action} on {resource}",
        details={
            "resource": resource,
            "action": action
        }
    )


# Error context manager for service operations
class ErrorContext:
    """Context manager for handling service operation errors."""
    
    def __init__(self, operation: str, service: str = "MediMate"):
        self.operation = operation
        self.service = service
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            return False
        
        if isinstance(exc_val, MediMateException):
            # Re-raise MediMate exceptions as-is
            return False
        
        # Convert other exceptions to service errors
        logger.error(
            f"Error in {self.service} {self.operation}: {exc_val}",
            exc_info=True
        )
        
        raise ExternalServiceError(
            service_name=self.service,
            message=f"Operation '{self.operation}' failed: {str(exc_val)}",
            details={
                "operation": self.operation,
                "original_error": str(exc_val),
                "error_type": type(exc_val).__name__
            }
        )


# Decorator for automatic error handling
def handle_service_errors(service_name: str):
    """Decorator to automatically handle service errors."""
    
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except MediMateException:
                raise
            except Exception as e:
                logger.error(
                    f"Error in {service_name}.{func.__name__}: {e}",
                    exc_info=True
                )
                raise ExternalServiceError(
                    service_name=service_name,
                    message=f"Operation '{func.__name__}' failed: {str(e)}",
                    details={
                        "function": func.__name__,
                        "original_error": str(e),
                        "error_type": type(e).__name__
                    }
                )
        
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except MediMateException:
                raise
            except Exception as e:
                logger.error(
                    f"Error in {service_name}.{func.__name__}: {e}",
                    exc_info=True
                )
                raise ExternalServiceError(
                    service_name=service_name,
                    message=f"Operation '{func.__name__}' failed: {str(e)}",
                    details={
                        "function": func.__name__,
                        "original_error": str(e),
                        "error_type": type(e).__name__
                    }
                )
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator
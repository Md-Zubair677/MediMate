"""
Base Pydantic models for MediMate Healthcare Platform.
Contains common models used across the application.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum

class BaseResponse(BaseModel):
    """Base response model for all API responses."""
    success: bool = Field(True, description="Indicates if the request was successful")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(), description="Response timestamp")
    message: Optional[str] = Field(None, description="Optional response message")

class HealthStatus(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Application health status")
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    version: str = Field(..., description="Application version")
    services: Dict[str, str] = Field(default_factory=dict, description="Service status")
    region: Optional[str] = Field(None, description="AWS region")
    demo_mode: bool = Field(False, description="Whether running in demo mode")

class ErrorResponse(BaseModel):
    """Error response model for API errors."""
    success: bool = Field(False, description="Always false for error responses")
    error: str = Field(..., description="Error type or code")
    message: str = Field(..., description="Human-readable error message")
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

class StatusEnum(str, Enum):
    """Common status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
"""
Authentication API endpoints for MediMate platform.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "patient"

class LoginRequest(BaseModel):
    email: str
    password: str

class ConfirmEmailRequest(BaseModel):
    email: str
    confirmation_code: str

class ResendCodeRequest(BaseModel):
    email: str

@router.post("/register")
async def register_user(request: RegisterRequest):
    """Register a new user."""
    try:
        # Simple registration for demo
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": f"user_{hash(request.email) % 10000}",
            "confirmation_required": True
        }
            
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login_user(request: LoginRequest):
    """Login user and return JWT token."""
    try:
        # Simple login for demo
        return {
            "success": True,
            "message": "Login successful",
            "access_token": "demo_token_123",
            "user": {
                "email": request.email,
                "role": "patient",
                "name": "Demo User"
            },
            "expires_in": 3600
        }
            
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/confirm-email")
async def confirm_email(request: ConfirmEmailRequest):
    """Confirm user email with verification code."""
    try:
        # Simple confirmation for demo
        if request.confirmation_code == "123456":
            return {
                "success": True,
                "message": "Email confirmed successfully",
                "user_confirmed": True
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid confirmation code")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email confirmation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Email confirmation failed")

@router.post("/resend-confirmation")
async def resend_confirmation_code(request: ResendCodeRequest):
    """Resend email confirmation code."""
    try:
        return {
            "success": True,
            "message": "Confirmation code sent to your email (demo: use 123456)"
        }
            
    except Exception as e:
        logger.error(f"Resend confirmation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend confirmation code")

"""
Custom middleware for MediMate platform.
Provides request/response logging, performance metrics, and security features.
"""

import time
import uuid
import json
from typing import Callable, Optional, Dict, Any
from datetime import datetime
import logging

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from utils.logger import get_performance_logger, get_security_logger
from utils.error_handlers import create_error_response

logger = logging.getLogger("medimate.middleware")
performance_logger = get_performance_logger()
security_logger = get_security_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses with performance metrics."""
    
    def __init__(
        self,
        app: ASGIApp,
        log_requests: bool = True,
        log_responses: bool = True,
        log_request_body: bool = False,
        log_response_body: bool = False,
        exclude_paths: Optional[list] = None
    ):
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
        self.log_request_body = log_request_body
        self.log_response_body = log_response_body
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json", "/favicon.ico"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and response with logging."""
        
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Skip logging for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        
        # Log request
        if self.log_requests:
            await self._log_request(request, request_id)
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error and create error response
            duration = (time.time() - start_time) * 1000
            
            logger.error(
                f"Unhandled error in request {request_id}: {e}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration": duration
                },
                exc_info=True
            )
            
            # Create standardized error response
            error_response = create_error_response(e, request)
            response = JSONResponse(
                status_code=500,
                content=error_response
            )
        
        # Calculate duration
        duration = (time.time() - start_time) * 1000
        
        # Add performance headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.2f}ms"
        
        # Log response
        if self.log_responses:
            await self._log_response(request, response, request_id, duration)
        
        # Log performance metrics
        performance_logger.log_request(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration,
            request_id=request_id,
            user_agent=request.headers.get("user-agent"),
            ip_address=self._get_client_ip(request)
        )
        
        return response
    
    async def _log_request(self, request: Request, request_id: str):
        """Log incoming request details."""
        
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Log request body if enabled (be careful with sensitive data)
        if self.log_request_body and request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    # Try to parse as JSON, otherwise log as string
                    try:
                        log_data["body"] = json.loads(body.decode())
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        log_data["body"] = body.decode(errors='ignore')[:1000]  # Limit size
            except Exception as e:
                log_data["body_error"] = str(e)
        
        logger.info(
            f"Request {request.method} {request.url.path}",
            extra={"request_data": log_data}
        )
    
    async def _log_response(self, request: Request, response: Response, request_id: str, duration: float):
        """Log outgoing response details."""
        
        log_data = {
            "request_id": request_id,
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "duration_ms": duration,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Log response body if enabled and it's a JSON response
        if (self.log_response_body and 
            response.headers.get("content-type", "").startswith("application/json")):
            try:
                # This is tricky with streaming responses, so we'll skip for now
                pass
            except Exception as e:
                log_data["body_error"] = str(e)
        
        level = logging.INFO
        if response.status_code >= 500:
            level = logging.ERROR
        elif response.status_code >= 400:
            level = logging.WARNING
        
        logger.log(
            level,
            f"Response {response.status_code} for {request.method} {request.url.path} ({duration:.2f}ms)",
            extra={"response_data": log_data}
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        
        # Check for forwarded headers (common in load balancers/proxies)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for security features and monitoring."""
    
    def __init__(
        self,
        app: ASGIApp,
        enable_security_headers: bool = True,
        enable_rate_limiting: bool = False,
        rate_limit_requests: int = 100,
        rate_limit_window: int = 60,
        blocked_user_agents: Optional[list] = None,
        blocked_ips: Optional[list] = None
    ):
        super().__init__(app)
        self.enable_security_headers = enable_security_headers
        self.enable_rate_limiting = enable_rate_limiting
        self.rate_limit_requests = rate_limit_requests
        self.rate_limit_window = rate_limit_window
        self.blocked_user_agents = blocked_user_agents or []
        self.blocked_ips = blocked_ips or []
        
        # Simple in-memory rate limiting (use Redis in production)
        self.rate_limit_store: Dict[str, Dict[str, Any]] = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with security checks."""
        
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Check blocked IPs
        if client_ip in self.blocked_ips:
            security_logger.log_access_event(
                resource=request.url.path,
                action="BLOCKED_IP",
                user_id="anonymous",
                success=False,
                reason=f"IP {client_ip} is blocked"
            )
            
            return JSONResponse(
                status_code=403,
                content={"error": "Access denied"}
            )
        
        # Check blocked user agents
        if any(blocked_ua.lower() in user_agent.lower() for blocked_ua in self.blocked_user_agents):
            security_logger.log_access_event(
                resource=request.url.path,
                action="BLOCKED_USER_AGENT",
                user_id="anonymous",
                success=False,
                reason=f"User agent blocked: {user_agent}"
            )
            
            return JSONResponse(
                status_code=403,
                content={"error": "Access denied"}
            )
        
        # Rate limiting
        if self.enable_rate_limiting:
            if not self._check_rate_limit(client_ip):
                security_logger.log_access_event(
                    resource=request.url.path,
                    action="RATE_LIMITED",
                    user_id="anonymous",
                    success=False,
                    reason=f"Rate limit exceeded for IP {client_ip}"
                )
                
                return JSONResponse(
                    status_code=429,
                    content={"error": "Rate limit exceeded"},
                    headers={"Retry-After": str(self.rate_limit_window)}
                )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        if self.enable_security_headers:
            self._add_security_headers(response)
        
        return response
    
    def _check_rate_limit(self, client_ip: str) -> bool:
        """Check if client IP is within rate limits."""
        
        current_time = time.time()
        window_start = current_time - self.rate_limit_window
        
        # Clean old entries
        if client_ip in self.rate_limit_store:
            self.rate_limit_store[client_ip]["requests"] = [
                req_time for req_time in self.rate_limit_store[client_ip]["requests"]
                if req_time > window_start
            ]
        else:
            self.rate_limit_store[client_ip] = {"requests": []}
        
        # Check current request count
        request_count = len(self.rate_limit_store[client_ip]["requests"])
        
        if request_count >= self.rate_limit_requests:
            return False
        
        # Add current request
        self.rate_limit_store[client_ip]["requests"].append(current_time)
        return True
    
    def _add_security_headers(self, response: Response):
        """Add security headers to response."""
        
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


class CORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware with enhanced configuration."""
    
    def __init__(
        self,
        app: ASGIApp,
        allow_origins: list = None,
        allow_methods: list = None,
        allow_headers: list = None,
        allow_credentials: bool = True,
        expose_headers: list = None,
        max_age: int = 600
    ):
        super().__init__(app)
        self.allow_origins = allow_origins or ["*"]
        self.allow_methods = allow_methods or ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
        self.allow_headers = allow_headers or [
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Request-ID"
        ]
        self.allow_credentials = allow_credentials
        self.expose_headers = expose_headers or ["X-Request-ID", "X-Response-Time"]
        self.max_age = max_age
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle CORS for requests."""
        
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            self._add_cors_headers(response, origin)
            return response
        
        # Process normal request
        response = await call_next(request)
        self._add_cors_headers(response, origin)
        
        return response
    
    def _add_cors_headers(self, response: Response, origin: Optional[str]):
        """Add CORS headers to response."""
        
        # Check if origin is allowed
        if origin and (self.allow_origins == ["*"] or origin in self.allow_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
        elif self.allow_origins == ["*"]:
            response.headers["Access-Control-Allow-Origin"] = "*"
        
        response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
        response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)
        response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
        response.headers["Access-Control-Max-Age"] = str(self.max_age)
        
        if self.allow_credentials:
            response.headers["Access-Control-Allow-Credentials"] = "true"


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware for health check endpoints."""
    
    def __init__(self, app: ASGIApp, health_check_paths: list = None):
        super().__init__(app)
        self.health_check_paths = health_check_paths or ["/health", "/healthz", "/ping"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle health check requests."""
        
        if request.url.path in self.health_check_paths:
            # Simple health check response
            return JSONResponse(
                status_code=200,
                content={
                    "status": "healthy",
                    "timestamp": datetime.utcnow().isoformat(),
                    "service": "medimate-api"
                }
            )
        
        return await call_next(request)


def setup_middleware(app, settings):
    """Setup all middleware for the FastAPI application."""
    
    # Health check middleware (should be first)
    app.add_middleware(HealthCheckMiddleware)
    
    # Security middleware
    app.add_middleware(
        SecurityMiddleware,
        enable_security_headers=settings.environment == "production",
        enable_rate_limiting=settings.environment == "production",
        rate_limit_requests=100,
        rate_limit_window=60
    )
    
    # CORS middleware
    cors_origins = ["*"] if settings.environment == "development" else settings.cors_origins_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Request-ID"
        ]
    )
    
    # Request logging middleware (should be last to capture all requests)
    app.add_middleware(
        RequestLoggingMiddleware,
        log_requests=True,
        log_responses=True,
        log_request_body=settings.debug,
        log_response_body=settings.debug
    )
    
    logger.info("Middleware configured successfully")
    
    return app
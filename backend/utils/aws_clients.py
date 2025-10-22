"""
Centralized AWS client management for MediMate platform.
Provides singleton instances of AWS service clients with proper configuration,
connection pooling, and retry logic.
"""

import boto3
import os
from typing import Optional, Dict, Any
import json
import time
import logging
import threading
from datetime import datetime, timedelta
from botocore.exceptions import ClientError, NoCredentialsError, BotoCoreError
from botocore.config import Config
from functools import wraps
from enum import Enum

# Import settings for configuration
from .config import get_settings

# Configure logging
logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Circuit breaker implementation for AWS service calls."""
    
    def __init__(self, failure_threshold=5, recovery_timeout=60, expected_exception=Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED
        self._lock = threading.Lock()
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with self._lock:
                if self.state == CircuitBreakerState.OPEN:
                    if self._should_attempt_reset():
                        self.state = CircuitBreakerState.HALF_OPEN
                        logger.info(f"Circuit breaker for {func.__name__} moved to HALF_OPEN")
                    else:
                        raise Exception(f"Circuit breaker OPEN for {func.__name__}")
                
                try:
                    result = func(*args, **kwargs)
                    self._on_success()
                    return result
                except self.expected_exception as e:
                    self._on_failure()
                    raise e
        
        return wrapper
    
    def _should_attempt_reset(self):
        """Check if enough time has passed to attempt reset."""
        return (
            self.last_failure_time and
            datetime.now() - self.last_failure_time >= timedelta(seconds=self.recovery_timeout)
        )
    
    def _on_success(self):
        """Reset circuit breaker on successful call."""
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED
    
    def _on_failure(self):
        """Handle failure and potentially open circuit breaker."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.warning(f"Circuit breaker OPENED after {self.failure_count} failures")


class ConnectionPool:
    """Enhanced connection pool for AWS clients."""
    
    def __init__(self, max_connections=50, connection_timeout=10, read_timeout=30):
        self.max_connections = max_connections
        self.connection_timeout = connection_timeout
        self.read_timeout = read_timeout
        self._active_connections = 0
        self._lock = threading.Lock()
    
    def get_config(self, region_name=None):
        """Get boto3 config with connection pooling settings."""
        return Config(
            region_name=region_name,
            retries={
                'max_attempts': 3,
                'mode': 'adaptive'
            },
            max_pool_connections=self.max_connections,
            connect_timeout=self.connection_timeout,
            read_timeout=self.read_timeout,
            # Enable connection reuse
            parameter_validation=False,
            # Use signature version 4 for better security
            signature_version='v4'
        )
    
    def acquire_connection(self):
        """Acquire a connection from the pool."""
        with self._lock:
            if self._active_connections >= self.max_connections:
                raise Exception("Connection pool exhausted")
            self._active_connections += 1
    
    def release_connection(self):
        """Release a connection back to the pool."""
        with self._lock:
            if self._active_connections > 0:
                self._active_connections -= 1


def load_aws_config() -> Dict[str, Any]:
    """Load AWS configuration from config.json file."""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'aws', 'config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            return config.get('aws', {})
    except FileNotFoundError:
        logger.warning(f"AWS config file not found at {config_path}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in AWS config file: {e}")
        return {}
    except Exception as e:
        logger.error(f"Error loading AWS config: {e}")
        return {}


def retry_on_failure(max_retries=3, delay=1, backoff=2, exceptions=(ClientError, BotoCoreError)):
    """Enhanced decorator to retry AWS operations on failure with exponential backoff and jitter."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            last_exception = None
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    retries += 1
                    last_exception = e
                    
                    if retries >= max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}: {e}")
                        raise e
                    
                    # Calculate wait time with jitter to avoid thundering herd
                    base_wait_time = delay * (backoff ** (retries - 1))
                    jitter = base_wait_time * 0.1 * (0.5 - time.time() % 1)  # ±10% jitter
                    wait_time = base_wait_time + jitter
                    
                    logger.warning(f"Retry {retries}/{max_retries} for {func.__name__} in {wait_time:.2f}s: {e}")
                    time.sleep(wait_time)
                
                except Exception as e:
                    # Don't retry on unexpected exceptions
                    logger.error(f"Unexpected error in {func.__name__}: {e}")
                    raise e
            
            # This should never be reached, but just in case
            if last_exception:
                raise last_exception
            
        return wrapper
    return decorator


class ServiceHealthMonitor:
    """Monitor health of AWS services."""
    
    def __init__(self):
        self._service_health = {}
        self._lock = threading.Lock()
    
    def record_success(self, service_name: str):
        """Record successful service call."""
        with self._lock:
            if service_name not in self._service_health:
                self._service_health[service_name] = {
                    'success_count': 0,
                    'failure_count': 0,
                    'last_success': None,
                    'last_failure': None,
                    'consecutive_failures': 0
                }
            
            self._service_health[service_name]['success_count'] += 1
            self._service_health[service_name]['last_success'] = datetime.now()
            self._service_health[service_name]['consecutive_failures'] = 0
    
    def record_failure(self, service_name: str, error: Exception):
        """Record failed service call."""
        with self._lock:
            if service_name not in self._service_health:
                self._service_health[service_name] = {
                    'success_count': 0,
                    'failure_count': 0,
                    'last_success': None,
                    'last_failure': None,
                    'consecutive_failures': 0
                }
            
            self._service_health[service_name]['failure_count'] += 1
            self._service_health[service_name]['last_failure'] = datetime.now()
            self._service_health[service_name]['consecutive_failures'] += 1
            self._service_health[service_name]['last_error'] = str(error)
    
    def get_health_status(self, service_name: str) -> Dict[str, Any]:
        """Get health status for a service."""
        with self._lock:
            if service_name not in self._service_health:
                return {'status': 'unknown', 'message': 'No health data available'}
            
            health = self._service_health[service_name]
            total_calls = health['success_count'] + health['failure_count']
            
            if total_calls == 0:
                return {'status': 'unknown', 'message': 'No calls recorded'}
            
            success_rate = health['success_count'] / total_calls
            consecutive_failures = health['consecutive_failures']
            
            if consecutive_failures >= 5:
                status = 'critical'
            elif consecutive_failures >= 3:
                status = 'degraded'
            elif success_rate < 0.8:
                status = 'warning'
            else:
                status = 'healthy'
            
            return {
                'status': status,
                'success_rate': success_rate,
                'total_calls': total_calls,
                'consecutive_failures': consecutive_failures,
                'last_success': health['last_success'],
                'last_failure': health['last_failure'],
                'last_error': health.get('last_error')
            }


class AWSClientManager:
    """Enhanced singleton class to manage AWS service clients with connection pooling, retry logic, and circuit breakers."""
    
    _instance = None
    _clients = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AWSClientManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Prevent re-initialization
        if hasattr(self, '_initialized'):
            return
        
        # Get settings from configuration system
        self.settings = get_settings()
        self.region = "ap-south-1"  # Force ap-south-1 region
        self.profile = self.settings.aws_profile
        
        # Load AWS configuration from config.json
        self.aws_config = load_aws_config()
        connection_config = self.aws_config.get('connection_config', {})
        retry_config = connection_config.get('retry_config', {})
        
        # Initialize connection pool
        self.connection_pool = ConnectionPool(
            max_connections=connection_config.get('max_pool_connections', 50),
            connection_timeout=connection_config.get('connect_timeout', 10),
            read_timeout=connection_config.get('read_timeout', 30)
        )
        
        # Initialize health monitor
        self.health_monitor = ServiceHealthMonitor()
        
        # Initialize circuit breakers for each service
        self.circuit_breakers = {
            'bedrock': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'dynamodb': CircuitBreaker(failure_threshold=3, recovery_timeout=30),
            'textract': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'cognito': CircuitBreaker(failure_threshold=3, recovery_timeout=30),
            'ses': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'sns': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'sagemaker': CircuitBreaker(failure_threshold=3, recovery_timeout=120),
            'comprehend_medical': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'kms': CircuitBreaker(failure_threshold=3, recovery_timeout=30),
            'transcribe': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'polly': CircuitBreaker(failure_threshold=5, recovery_timeout=60),
            'stepfunctions': CircuitBreaker(failure_threshold=3, recovery_timeout=90),
            's3': CircuitBreaker(failure_threshold=3, recovery_timeout=30)
        }
        
        # Connection pooling and retry configuration
        self.config = self.connection_pool.get_config(self.region)
        
        logger.info(f"Enhanced AWS Client Manager initialized - Region: {self.region}, Profile: {self.profile or 'default'}")
        logger.info(f"Connection config - Pool: {self.connection_pool.max_connections}, Retries: {self.config.retries['max_attempts']}")
        logger.info(f"Circuit breakers initialized for {len(self.circuit_breakers)} services")
        
        self._initialized = True
    
    def _is_service_enabled(self, service_name: str) -> bool:
        """Check if a service is enabled in the configuration."""
        services_config = self.aws_config.get('services', {})
        service_config = services_config.get(service_name, {})
        return service_config.get('enabled', False)
    
    def _get_service_config(self, service_name: str) -> Dict[str, Any]:
        """Get configuration for a specific service."""
        services_config = self.aws_config.get('services', {})
        return services_config.get(service_name, {})
        
    def _create_session(self):
        """Create boto3 session with optional profile or credentials."""
        if self.profile:
            return boto3.Session(profile_name=self.profile)
        elif self.settings.aws_access_key_id and self.settings.aws_secret_access_key:
            return boto3.Session(
                aws_access_key_id=self.settings.aws_access_key_id,
                aws_secret_access_key=self.settings.aws_secret_access_key,
                region_name=self.region
            )
        return boto3.Session()
    
    def _create_client_with_monitoring(self, service_name: str, service_type: str, config_override=None):
        """Create AWS client with health monitoring and circuit breaker protection."""
        try:
            # Check if service is enabled
            if not self._is_service_enabled(service_name):
                logger.info(f"{service_name} service is disabled in configuration")
                return None
            
            # Apply circuit breaker
            circuit_breaker = self.circuit_breakers.get(service_name)
            if circuit_breaker and circuit_breaker.state == CircuitBreakerState.OPEN:
                logger.warning(f"Circuit breaker OPEN for {service_name} - using fallback")
                return None
            
            # Acquire connection from pool
            self.connection_pool.acquire_connection()
            
            try:
                session = self._create_session()
                config = config_override or self.config
                
                client = session.client(service_type, config=config)
                
                # Record success
                self.health_monitor.record_success(service_name)
                if circuit_breaker:
                    circuit_breaker._on_success()
                
                logger.info(f"{service_name} client initialized successfully")
                return client
                
            finally:
                self.connection_pool.release_connection()
                
        except Exception as e:
            # Record failure
            self.health_monitor.record_failure(service_name, e)
            if circuit_breaker:
                circuit_breaker._on_failure()
            
            logger.warning(f"Could not initialize {service_name} client: {e}")
            return None

    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_bedrock_client(self):
        """Get Bedrock Runtime client for AI model inference with enhanced reliability."""
        if 'bedrock' not in self._clients:
            self._clients['bedrock'] = self._create_client_with_monitoring('bedrock', 'bedrock-runtime')
        return self._clients['bedrock']
    
    @retry_on_failure(max_retries=3, delay=0.5, backoff=2)
    def get_dynamodb_resource(self):
        """Get DynamoDB resource for database operations with enhanced reliability."""
        if 'dynamodb' not in self._clients:
            # DynamoDB uses resource instead of client
            try:
                if not self._is_service_enabled('dynamodb'):
                    logger.info("DynamoDB service is disabled in configuration")
                    return None
                
                circuit_breaker = self.circuit_breakers.get('dynamodb')
                if circuit_breaker and circuit_breaker.state == CircuitBreakerState.OPEN:
                    logger.warning("Circuit breaker OPEN for DynamoDB - using fallback")
                    return None
                
                self.connection_pool.acquire_connection()
                
                try:
                    session = self._create_session()
                    resource = session.resource('dynamodb', config=self.config)
                    
                    # Test connection by listing tables (with limit to avoid performance impact)
                    list(resource.tables.limit(1))
                    
                    self.health_monitor.record_success('dynamodb')
                    if circuit_breaker:
                        circuit_breaker._on_success()
                    
                    self._clients['dynamodb'] = resource
                    logger.info(f"DynamoDB resource initialized successfully - Tables: {self.settings.dynamodb_appointments_table}, {self.settings.dynamodb_users_table}, {self.settings.dynamodb_reports_table}")
                    
                finally:
                    self.connection_pool.release_connection()
                    
            except Exception as e:
                self.health_monitor.record_failure('dynamodb', e)
                if circuit_breaker:
                    circuit_breaker._on_failure()
                logger.warning(f"Could not initialize DynamoDB resource: {e}")
                self._clients['dynamodb'] = None
                
        return self._clients['dynamodb']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_textract_client(self):
        """Get Textract client for document text extraction with enhanced reliability."""
        if 'textract' not in self._clients:
            self._clients['textract'] = self._create_client_with_monitoring('textract', 'textract')
        return self._clients['textract']
    
    @retry_on_failure(max_retries=3, delay=0.5, backoff=2)
    def get_cognito_client(self):
        """Get Cognito Identity Provider client for authentication with enhanced reliability."""
        if 'cognito' not in self._clients:
            cognito_config = self._get_service_config('cognito')
            cognito_region = cognito_config.get('region', self.region)
            
            # Create region-specific config for Cognito
            config_override = self.connection_pool.get_config(cognito_region)
            
            self._clients['cognito'] = self._create_client_with_monitoring(
                'cognito', 'cognito-idp', config_override
            )
        return self._clients['cognito']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_ses_client(self):
        """Get SES client for email notifications with enhanced reliability."""
        if 'ses' not in self._clients:
            ses_service_config = self._get_service_config('ses')
            ses_region = ses_service_config.get('region', self.settings.ses_region)
            
            # Create region-specific config for SES
            config_override = self.connection_pool.get_config(ses_region)
            
            self._clients['ses'] = self._create_client_with_monitoring(
                'ses', 'ses', config_override
            )
        return self._clients['ses']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_sns_client(self):
        """Get SNS client for SMS notifications with enhanced reliability."""
        if 'sns' not in self._clients:
            sns_service_config = self._get_service_config('sns')
            sns_region = sns_service_config.get('region', self.settings.sns_region)
            
            # Create region-specific config for SNS
            config_override = self.connection_pool.get_config(sns_region)
            
            self._clients['sns'] = self._create_client_with_monitoring(
                'sns', 'sns', config_override
            )
        return self._clients['sns']
    
    @retry_on_failure(max_retries=3, delay=2, backoff=2)
    def get_sagemaker_client(self):
        """Get SageMaker Runtime client for ML model inference with enhanced reliability."""
        if 'sagemaker' not in self._clients:
            self._clients['sagemaker'] = self._create_client_with_monitoring('sagemaker', 'sagemaker-runtime')
        return self._clients['sagemaker']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_comprehend_medical_client(self):
        """Get Comprehend Medical client for medical text analysis with enhanced reliability."""
        if 'comprehend_medical' not in self._clients:
            self._clients['comprehend_medical'] = self._create_client_with_monitoring(
                'comprehend_medical', 'comprehendmedical'
            )
        return self._clients['comprehend_medical']
    
    @retry_on_failure(max_retries=3, delay=0.5, backoff=2)
    def get_kms_client(self):
        """Get KMS client for encryption/decryption operations with enhanced reliability."""
        if 'kms' not in self._clients:
            self._clients['kms'] = self._create_client_with_monitoring('kms', 'kms')
        return self._clients['kms']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_transcribe_client(self):
        """Get Transcribe client for speech-to-text conversion with enhanced reliability."""
        if 'transcribe' not in self._clients:
            self._clients['transcribe'] = self._create_client_with_monitoring('transcribe', 'transcribe')
        return self._clients['transcribe']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_polly_client(self):
        """Get Polly client for text-to-speech conversion with enhanced reliability."""
        if 'polly' not in self._clients:
            self._clients['polly'] = self._create_client_with_monitoring('polly', 'polly')
        return self._clients['polly']
    
    @retry_on_failure(max_retries=3, delay=1, backoff=2)
    def get_stepfunctions_client(self):
        """Get Step Functions client for workflow orchestration with enhanced reliability."""
        if 'stepfunctions' not in self._clients:
            self._clients['stepfunctions'] = self._create_client_with_monitoring('stepfunctions', 'stepfunctions')
        return self._clients['stepfunctions']
    
    @retry_on_failure(max_retries=3, delay=0.5, backoff=2)
    def get_s3_client(self):
        """Get S3 client for file storage operations with enhanced reliability."""
        if 's3' not in self._clients:
            self._clients['s3'] = self._create_client_with_monitoring('s3', 's3')
        return self._clients['s3']
    
    def refresh_clients(self):
        """Refresh all AWS clients by clearing the cache."""
        self._clients.clear()
        # Reload settings in case configuration changed
        self.settings = get_settings()
        self.region = self.settings.aws_region
        self.profile = self.settings.aws_profile
        logger.info("AWS clients cache cleared and will be refreshed on next access")
    
    def get_client_status(self, service_name: str) -> dict:
        """Get detailed status for a specific AWS service client."""
        client_methods = {
            'bedrock': self.get_bedrock_client,
            'dynamodb': self.get_dynamodb_resource,
            'textract': self.get_textract_client,
            'cognito': self.get_cognito_client,
            'ses': self.get_ses_client,
            'sns': self.get_sns_client,
            'sagemaker': self.get_sagemaker_client,
            'comprehend_medical': self.get_comprehend_medical_client,
            'kms': self.get_kms_client,
            'transcribe': self.get_transcribe_client,
            'polly': self.get_polly_client,
            'stepfunctions': self.get_stepfunctions_client,
            's3': self.get_s3_client
        }
        
        if service_name not in client_methods:
            return {'status': 'unknown', 'error': f'Unknown service: {service_name}'}
        
        try:
            client = client_methods[service_name]()
            return {
                'status': 'healthy' if client is not None else 'unavailable',
                'client_initialized': client is not None,
                'region': self.region
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'region': self.region
            }
    
    def health_check(self):
        """Enhanced health check with circuit breaker status and performance metrics."""
        health_status = {}
        services = [
            'bedrock', 'dynamodb', 'textract', 'cognito', 
            'ses', 'sns', 'sagemaker', 'comprehend_medical', 'kms',
            'transcribe', 'polly', 'stepfunctions', 's3'
        ]
        
        enabled_services = []
        healthy_services = 0
        critical_services = 0
        
        for service in services:
            # Get basic client status
            service_status = self.get_client_status(service)
            
            # Add health monitoring data
            health_data = self.health_monitor.get_health_status(service)
            service_status.update(health_data)
            
            # Add circuit breaker status
            circuit_breaker = self.circuit_breakers.get(service)
            if circuit_breaker:
                service_status['circuit_breaker'] = {
                    'state': circuit_breaker.state.value,
                    'failure_count': circuit_breaker.failure_count,
                    'last_failure_time': circuit_breaker.last_failure_time
                }
            
            health_status[service] = service_status
            
            if self._is_service_enabled(service):
                enabled_services.append(service)
                
                # Count service health
                if service_status.get('status') == 'healthy':
                    healthy_services += 1
                elif service_status.get('status') == 'critical':
                    critical_services += 1
        
        # Calculate overall health
        enabled_count = len(enabled_services)
        total_services = len(services)
        
        if enabled_count == 0:
            overall_status = 'unknown'
        elif critical_services > 0:
            overall_status = 'critical'
        elif healthy_services < enabled_count * 0.8:  # Less than 80% healthy
            overall_status = 'degraded'
        elif healthy_services == enabled_count:
            overall_status = 'healthy'
        else:
            overall_status = 'warning'
        
        # Connection pool status
        pool_status = {
            'active_connections': self.connection_pool._active_connections,
            'max_connections': self.connection_pool.max_connections,
            'utilization': self.connection_pool._active_connections / self.connection_pool.max_connections
        }
        
        health_status['summary'] = {
            'healthy_services': healthy_services,
            'critical_services': critical_services,
            'enabled_services': enabled_count,
            'total_services': total_services,
            'overall_status': overall_status,
            'region': self.region,
            'demo_mode': self.settings.demo_mode,
            'mock_aws_services': self.settings.mock_aws_services,
            'enabled_service_list': enabled_services,
            'connection_pool': pool_status,
            'timestamp': datetime.now().isoformat()
        }
        
        return health_status
    
    def get_performance_metrics(self):
        """Get detailed performance metrics for all AWS services."""
        metrics = {
            'connection_pool': {
                'active_connections': self.connection_pool._active_connections,
                'max_connections': self.connection_pool.max_connections,
                'utilization_percentage': (self.connection_pool._active_connections / self.connection_pool.max_connections) * 100,
                'connection_timeout': self.connection_pool.connection_timeout,
                'read_timeout': self.connection_pool.read_timeout
            },
            'circuit_breakers': {},
            'service_health': {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Circuit breaker metrics
        for service_name, circuit_breaker in self.circuit_breakers.items():
            metrics['circuit_breakers'][service_name] = {
                'state': circuit_breaker.state.value,
                'failure_count': circuit_breaker.failure_count,
                'failure_threshold': circuit_breaker.failure_threshold,
                'recovery_timeout': circuit_breaker.recovery_timeout,
                'last_failure_time': circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None
            }
        
        # Service health metrics
        services = ['bedrock', 'dynamodb', 'textract', 'cognito', 'ses', 'sns', 'sagemaker', 'comprehend_medical', 'kms', 'transcribe', 'polly', 'stepfunctions', 's3']
        for service_name in services:
            health_data = self.health_monitor.get_health_status(service_name)
            metrics['service_health'][service_name] = {
                **health_data,
                'enabled': self._is_service_enabled(service_name),
                'client_initialized': service_name in self._clients and self._clients[service_name] is not None
            }
        
        return metrics
    
    def reset_circuit_breakers(self, service_name: str = None):
        """Reset circuit breakers for a specific service or all services."""
        if service_name:
            if service_name in self.circuit_breakers:
                self.circuit_breakers[service_name].failure_count = 0
                self.circuit_breakers[service_name].state = CircuitBreakerState.CLOSED
                self.circuit_breakers[service_name].last_failure_time = None
                logger.info(f"Circuit breaker reset for {service_name}")
            else:
                logger.warning(f"No circuit breaker found for service: {service_name}")
        else:
            for service, circuit_breaker in self.circuit_breakers.items():
                circuit_breaker.failure_count = 0
                circuit_breaker.state = CircuitBreakerState.CLOSED
                circuit_breaker.last_failure_time = None
            logger.info("All circuit breakers reset")
    
    def force_refresh_client(self, service_name: str):
        """Force refresh a specific AWS client."""
        if service_name in self._clients:
            del self._clients[service_name]
            logger.info(f"Client cache cleared for {service_name}")
            
            # Reset circuit breaker for the service
            if service_name in self.circuit_breakers:
                self.reset_circuit_breakers(service_name)
    
    def get_table_names(self):
        """Get configured DynamoDB table names from settings."""
        return {
            'appointments': self.settings.dynamodb_appointments_table,
            'users': self.settings.dynamodb_users_table,
            'reports': self.settings.dynamodb_reports_table
        }
    
    def get_bedrock_config(self):
        """Get Bedrock configuration from settings."""
        return {
            'model_id': self.settings.bedrock_model_id,
            'max_tokens': self.settings.bedrock_max_tokens,
            'region': self.region
        }
    
    def get_file_upload_config(self):
        """Get file upload configuration from settings."""
        return {
            'max_size_mb': self.settings.max_file_size_mb,
            'max_size_bytes': self.settings.max_file_size_bytes,
            'allowed_extensions': self.settings.allowed_file_extensions
        }
    
    def get_cognito_config(self):
        """Get Cognito configuration from settings and config file."""
        cognito_config = self._get_service_config('cognito')
        return {
            'user_pool_id': self.settings.cognito_user_pool_id or cognito_config.get('user_pool_id'),
            'client_id': self.settings.cognito_client_id or cognito_config.get('client_id'),
            'client_secret': self.settings.cognito_client_secret or cognito_config.get('client_secret'),
            'region': cognito_config.get('region', self.region),
            'password_policy': cognito_config.get('password_policy', {}),
            'enabled': cognito_config.get('enabled', False)
        }
    
    def get_ses_config(self):
        """Get SES configuration from settings and config file."""
        ses_config = self._get_service_config('ses')
        return {
            'from_email': self.settings.ses_from_email or ses_config.get('from_email'),
            'region': ses_config.get('region', self.settings.ses_region),
            'configuration_set': self.settings.ses_configuration_set or ses_config.get('configuration_set'),
            'templates': ses_config.get('template_names', {}),
            'enabled': ses_config.get('enabled', False)
        }
    
    def get_sns_config(self):
        """Get SNS configuration from settings and config file."""
        sns_config = self._get_service_config('sns')
        return {
            'region': sns_config.get('region', self.settings.sns_region),
            'sender_id': sns_config.get('sms_sender_id', self.settings.sns_sender_id),
            'topics': sns_config.get('topics', {}),
            'appointment_topic_arn': self.settings.sns_appointment_topic_arn,
            'system_alerts_topic_arn': self.settings.sns_system_alerts_topic_arn,
            'enabled': sns_config.get('enabled', False)
        }
    
    def get_sagemaker_config(self):
        """Get SageMaker configuration from settings and config file."""
        sagemaker_config = self._get_service_config('sagemaker')
        return {
            'endpoint_name': self.settings.sagemaker_endpoint_name or sagemaker_config.get('endpoint_name'),
            'model_name': sagemaker_config.get('model_name', self.settings.sagemaker_model_name),
            'instance_type': sagemaker_config.get('instance_type', 'ml.t2.medium'),
            'initial_instance_count': sagemaker_config.get('initial_instance_count', 1),
            'enabled': sagemaker_config.get('enabled', False)
        }
    
    def get_kms_config(self):
        """Get KMS configuration from settings and config file."""
        kms_config = self._get_service_config('kms')
        return {
            'key_id': self.settings.kms_key_id or kms_config.get('key_id'),
            'key_alias': kms_config.get('key_alias', self.settings.kms_key_alias),
            'key_description': kms_config.get('key_description', 'MediMate platform encryption key'),
            'key_usage': kms_config.get('key_usage', 'ENCRYPT_DECRYPT'),
            'enabled': kms_config.get('enabled', False)
        }


# Global instance
aws_clients = AWSClientManager()


def get_aws_clients():
    """Get the global AWS clients manager instance."""
    return aws_clients


# Convenience functions for backward compatibility
def get_bedrock_client():
    return aws_clients.get_bedrock_client()

def get_dynamodb_resource():
    return aws_clients.get_dynamodb_resource()

def get_textract_client():
    return aws_clients.get_textract_client()

def get_cognito_client():
    return aws_clients.get_cognito_client()

def get_ses_client():
    return aws_clients.get_ses_client()

def get_sns_client():
    return aws_clients.get_sns_client()

def get_sagemaker_client():
    return aws_clients.get_sagemaker_client()

def get_comprehend_medical_client():
    return aws_clients.get_comprehend_medical_client()

def get_kms_client():
    return aws_clients.get_kms_client()

def refresh_aws_clients():
    """Refresh all AWS clients."""
    return aws_clients.refresh_clients()

def get_aws_health_status():
    """Get comprehensive AWS services health status."""
    return aws_clients.health_check()
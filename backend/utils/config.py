"""
Configuration management for MediMate platform.
Handles environment variables and application settings.
"""

import os
from typing import Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application settings
    app_name: str = Field(default="MediMate API", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # AWS Configuration
    aws_region: str = Field(default="ap-south-1", env="AWS_REGION")
    aws_profile: Optional[str] = Field(default=None, env="AWS_PROFILE")
    aws_access_key_id: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    
    # Bedrock Configuration
    bedrock_model_id: str = Field(
        default="anthropic.claude-3-5-sonnet-20240620-v1:0", 
        env="BEDROCK_MODEL_ID"
    )
    bedrock_max_tokens: int = Field(default=1000, env="BEDROCK_MAX_TOKENS")
    
    # DynamoDB Configuration
    dynamodb_appointments_table: str = Field(
        default="medimate-appointments", 
        env="DYNAMODB_APPOINTMENTS_TABLE"
    )
    dynamodb_users_table: str = Field(
        default="medimate-users", 
        env="DYNAMODB_USERS_TABLE"
    )
    dynamodb_reports_table: str = Field(
        default="medimate-reports", 
        env="DYNAMODB_REPORTS_TABLE"
    )
    
    # Cognito Configuration
    cognito_user_pool_id: Optional[str] = Field(default=None, env="COGNITO_USER_POOL_ID")
    cognito_client_id: Optional[str] = Field(default=None, env="COGNITO_CLIENT_ID")
    cognito_client_secret: Optional[str] = Field(default=None, env="COGNITO_CLIENT_SECRET")
    
    # SES Configuration
    ses_from_email: str = Field(
        default="noreply@medimate.com", 
        env="SES_FROM_EMAIL"
    )
    ses_region: str = Field(default="ap-south-1", env="SES_REGION")
    
    # SNS Configuration
    sns_region: str = Field(default="ap-south-1", env="SNS_REGION")
    
    # SageMaker Configuration
    sagemaker_endpoint_name: Optional[str] = Field(
        default=None, 
        env="SAGEMAKER_ENDPOINT_NAME"
    )
    sagemaker_model_name: str = Field(
        default="medimate-health-risk-predictor",
        env="SAGEMAKER_MODEL_NAME"
    )
    
    # KMS Configuration
    kms_key_id: Optional[str] = Field(default=None, env="KMS_KEY_ID")
    kms_key_alias: str = Field(
        default="alias/medimate-encryption-key",
        env="KMS_KEY_ALIAS"
    )
    
    # SNS Configuration
    sns_appointment_topic_arn: Optional[str] = Field(
        default=None,
        env="SNS_APPOINTMENT_TOPIC_ARN"
    )
    sns_system_alerts_topic_arn: Optional[str] = Field(
        default=None,
        env="SNS_SYSTEM_ALERTS_TOPIC_ARN"
    )
    sns_sender_id: str = Field(default="MediMate", env="SNS_SENDER_ID")
    
    # SES Configuration Extensions
    ses_configuration_set: Optional[str] = Field(
        default=None,
        env="SES_CONFIGURATION_SET"
    )
    ses_appointment_template: str = Field(
        default="medimate-appointment-confirmation",
        env="SES_APPOINTMENT_TEMPLATE"
    )
    ses_reminder_template: str = Field(
        default="medimate-appointment-reminder",
        env="SES_REMINDER_TEMPLATE"
    )
    
    # Security Configuration
    jwt_secret_key: str = Field(
        default="your-secret-key-change-in-production", 
        env="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # File Upload Configuration
    max_file_size_mb: int = Field(default=10, env="MAX_FILE_SIZE_MB")
    allowed_file_types: str = Field(
        default="pdf,jpg,jpeg,png", 
        env="ALLOWED_FILE_TYPES"
    )
    
    # CORS Configuration
    cors_origins: str = Field(default="*", env="CORS_ORIGINS")
    
    # Demo Mode Configuration
    demo_mode: bool = Field(default=True, env="DEMO_MODE")
    mock_aws_services: bool = Field(default=True, env="MOCK_AWS_SERVICES")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }
    
    @property
    def allowed_file_extensions(self) -> list:
        """Get list of allowed file extensions."""
        return [ext.strip().lower() for ext in self.allowed_file_types.split(",")]
    
    @property
    def cors_origins_list(self) -> list:
        """Get list of CORS origins."""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def max_file_size_bytes(self) -> int:
        """Get maximum file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024
    
    def validate_configuration(self) -> dict:
        """Validate critical configuration settings and return status."""
        validation_results = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'info': []
        }
        
        # Check critical AWS configuration
        if not self.aws_region:
            validation_results['errors'].append("AWS_REGION is not set")
            validation_results['valid'] = False
        
        # Check AWS credentials
        has_credentials = bool(self.aws_access_key_id and self.aws_secret_access_key)
        has_profile = bool(self.aws_profile)
        
        if not has_credentials and not has_profile and not self.demo_mode:
            validation_results['warnings'].append("No AWS credentials or profile configured - will use default AWS credential chain")
        elif has_credentials:
            validation_results['info'].append("AWS credentials loaded from environment variables")
        elif has_profile:
            validation_results['info'].append(f"AWS profile configured: {self.aws_profile}")
        
        # Check security settings
        if self.jwt_secret_key == "your-secret-key-change-in-production":
            validation_results['warnings'].append("JWT_SECRET_KEY is using default value - change for production")
        
        if self.debug and not self.demo_mode:
            validation_results['warnings'].append("DEBUG mode is enabled - disable for production")
        
        # Check file upload settings
        if self.max_file_size_mb > 50:
            validation_results['warnings'].append(f"Max file size is {self.max_file_size_mb}MB - consider reducing for better performance")
        
        # Check CORS settings
        if "*" in self.cors_origins_list and not self.demo_mode:
            validation_results['warnings'].append("CORS allows all origins - restrict for production")
        
        # Info about current configuration
        validation_results['info'].extend([
            f"App: {self.app_name} v{self.app_version}",
            f"AWS Region: {self.aws_region}",
            f"Demo Mode: {self.demo_mode}",
            f"Debug Mode: {self.debug}",
            f"Bedrock Model: {self.bedrock_model_id}"
        ])
        
        return validation_results


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings instance."""
    return settings


def initialize_configuration(env_file_path: str = ".env", validate: bool = True) -> dict:
    """Initialize configuration with validation and return status."""
    print("🚀 Initializing MediMate configuration...")
    
    # Load environment file if it exists
    load_env_file(env_file_path)
    
    # Validate configuration if requested
    if validate:
        validation_results = settings.validate_configuration()
        
        # Print validation results
        if validation_results['errors']:
            print("❌ Configuration Errors:")
            for error in validation_results['errors']:
                print(f"   • {error}")
        
        if validation_results['warnings']:
            print("⚠️ Configuration Warnings:")
            for warning in validation_results['warnings']:
                print(f"   • {warning}")
        
        if validation_results['info']:
            print("ℹ️ Configuration Info:")
            for info in validation_results['info']:
                print(f"   • {info}")
        
        if validation_results['valid']:
            print("✅ Configuration validation passed")
        else:
            print("❌ Configuration validation failed")
        
        return validation_results
    
    return {'valid': True, 'warnings': [], 'errors': [], 'info': []}


def load_env_file(env_file_path: str = ".env") -> None:
    """Load environment variables from file."""
    if os.path.exists(env_file_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file_path)
            # Reload settings to pick up new environment variables
            global settings
            settings = Settings()
            print(f"✅ Environment variables loaded from {env_file_path}")
        except ImportError:
            print("⚠️ python-dotenv not available, using pydantic-settings built-in .env support")
        except Exception as e:
            print(f"❌ Error loading environment file {env_file_path}: {e}")
    else:
        print(f"⚠️ Environment file {env_file_path} not found")
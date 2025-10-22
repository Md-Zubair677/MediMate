#!/usr/bin/env python3
"""
Secure Configuration Management for MediMate
Loads environment variables and provides secure defaults
"""

import os
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

class Config:
    """Secure configuration class"""
    
    # AWS Configuration
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_DEFAULT_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
    
    # AWS Services
    AWS_BEDROCK_REGION = os.getenv('AWS_BEDROCK_REGION', 'us-east-1')
    AWS_TEXTRACT_REGION = os.getenv('AWS_TEXTRACT_REGION', 'us-east-1')
    AWS_S3_BUCKET_NAME = os.getenv('AWS_S3_BUCKET_NAME')
    AWS_DYNAMODB_TABLE_NAME = os.getenv('AWS_DYNAMODB_TABLE_NAME', 'medimate-patients')
    
    # Email & Notifications
    AWS_SES_FROM_EMAIL = os.getenv('AWS_SES_FROM_EMAIL')
    AWS_SNS_TOPIC_ARN = os.getenv('AWS_SNS_TOPIC_ARN')
    
    # Application Security
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key-change-in-production')
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///medimate.db')
    
    # Application Settings
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    
    # Bedrock Configuration
    BEDROCK_MODEL_ID = os.getenv('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', '4096'))
    TEMPERATURE = float(os.getenv('TEMPERATURE', '0.1'))
    
    @classmethod
    def validate_config(cls):
        """Validate required configuration"""
        required_vars = [
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_S3_BUCKET_NAME'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            logging.error(f"Missing required environment variables: {', '.join(missing_vars)}")
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        logging.info("✅ Configuration validation passed")
        return True

# Create global config instance
config = Config()

"""
MediMate Backend Utilities Package

This package contains utility modules for the MediMate backend:
- aws_clients: Centralized AWS service client management
- config: Application configuration and environment variable handling
"""

from .aws_clients import (
    aws_clients,
    get_bedrock_client,
    get_dynamodb_resource,
    get_textract_client,
    get_cognito_client,
    get_ses_client,
    get_sns_client,
    get_sagemaker_client,
    get_comprehend_medical_client,
    get_kms_client
)

from .config import (
    settings,
    get_settings,
    load_env_file
)

__all__ = [
    # AWS Clients
    'aws_clients',
    'get_bedrock_client',
    'get_dynamodb_resource', 
    'get_textract_client',
    'get_cognito_client',
    'get_ses_client',
    'get_sns_client',
    'get_sagemaker_client',
    'get_comprehend_medical_client',
    'get_kms_client',
    
    # Configuration
    'settings',
    'get_settings',
    'load_env_file'
]
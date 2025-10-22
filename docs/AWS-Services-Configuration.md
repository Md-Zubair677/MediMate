# AWS Services Configuration Guide

This document provides detailed information about configuring and using AWS services in the MediMate platform.

## Overview

MediMate integrates with 9 AWS services to provide comprehensive healthcare functionality:

1. **Bedrock** - AI model inference (Claude 3.5 Sonnet)
2. **DynamoDB** - NoSQL database for appointments, users, and reports
3. **Textract** - Document text extraction from PDFs and images
4. **Cognito** - User authentication and authorization
5. **SES** - Email notifications and communications
6. **SNS** - SMS notifications and system alerts
7. **SageMaker** - ML model inference for health risk prediction
8. **Comprehend Medical** - Medical text analysis and entity extraction
9. **KMS** - Encryption and decryption for HIPAA compliance

## Configuration Files

### 1. Environment Variables (.env)

Copy `.env.example` to `.env` and configure the following:

```bash
# AWS Configuration
AWS_REGION=ap-south-1
AWS_PROFILE=your-aws-profile
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cognito Configuration
COGNITO_USER_POOL_ID=ap-south-1_xxxxxxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com
SES_REGION=ap-south-1
SES_CONFIGURATION_SET=your-config-set

# SNS Configuration
SNS_REGION=ap-south-1
SNS_APPOINTMENT_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:appointment-notifications
SNS_SYSTEM_ALERTS_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:system-alerts

# SageMaker Configuration
SAGEMAKER_ENDPOINT_NAME=medimate-health-risk-predictor-endpoint

# KMS Configuration
KMS_KEY_ID=your-kms-key-id
KMS_KEY_ALIAS=alias/medimate-encryption-key
```

### 2. AWS Configuration (aws/config.json)

The `aws/config.json` file contains service-specific settings:

```json
{
  "aws": {
    "region": "ap-south-1",
    "services": {
      "cognito": {
        "enabled": true,
        "password_policy": {
          "minimum_length": 8,
          "require_uppercase": true,
          "require_lowercase": true,
          "require_numbers": true
        }
      },
      "ses": {
        "enabled": true,
        "template_names": {
          "appointment_confirmation": "medimate-appointment-confirmation",
          "appointment_reminder": "medimate-appointment-reminder"
        }
      }
    }
  }
}
```

## Service Setup Instructions

### 1. Amazon Cognito (User Authentication)

**Purpose**: Secure user authentication and authorization

**Setup Steps**:
1. Create a User Pool in AWS Cognito
2. Configure password policy and user attributes
3. Create an App Client with appropriate settings
4. Update environment variables with User Pool ID and Client ID

**Configuration**:
```bash
COGNITO_USER_POOL_ID=ap-south-1_xxxxxxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
```

**Usage**: Handles user registration, login, password reset, and JWT token management.

### 2. Amazon SES (Email Notifications)

**Purpose**: Send appointment confirmations, reminders, and system notifications

**Setup Steps**:
1. Verify your domain or email address in SES
2. Create email templates for different notification types
3. Configure DKIM and SPF records for better deliverability
4. Set up configuration sets for tracking (optional)

**Configuration**:
```bash
SES_FROM_EMAIL=noreply@yourdomain.com
SES_REGION=ap-south-1
SES_CONFIGURATION_SET=medimate-emails
```

**Email Templates**:
- `medimate-appointment-confirmation`: Sent when appointments are booked
- `medimate-appointment-reminder`: Sent 24 hours before appointments
- `medimate-password-reset`: Sent for password reset requests
- `medimate-welcome`: Sent to new users

### 3. Amazon SNS (SMS Notifications)

**Purpose**: Send SMS notifications for appointments and urgent alerts

**Setup Steps**:
1. Create SNS topics for different notification types
2. Configure SMS settings and sender ID
3. Set up subscriptions for different user groups
4. Configure delivery status logging (optional)

**Configuration**:
```bash
SNS_REGION=ap-south-1
SNS_APPOINTMENT_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:appointments
SNS_SENDER_ID=MediMate
```

**Topics**:
- `appointment-notifications`: Appointment-related SMS
- `system-alerts`: Critical system notifications

### 4. Amazon SageMaker (ML Inference)

**Purpose**: Health risk prediction and medical data analysis

**Setup Steps**:
1. Train and deploy a health risk prediction model
2. Create a SageMaker endpoint for real-time inference
3. Configure endpoint scaling and monitoring
4. Test model predictions with sample data

**Configuration**:
```bash
SAGEMAKER_ENDPOINT_NAME=medimate-health-risk-predictor-endpoint
SAGEMAKER_MODEL_NAME=medimate-health-risk-predictor
```

**Model Features**:
- Health risk assessment based on medical history
- Symptom severity prediction
- Treatment recommendation scoring

### 5. Amazon Comprehend Medical

**Purpose**: Extract medical entities and relationships from text

**Setup Steps**:
1. Enable Comprehend Medical in your AWS region
2. Configure IAM permissions for medical text analysis
3. Test entity extraction with sample medical documents

**Features**:
- Medical entity extraction (medications, conditions, procedures)
- Medical relationship detection
- PHI (Protected Health Information) detection
- Medical ontology mapping

### 6. AWS KMS (Encryption)

**Purpose**: Encrypt sensitive medical data for HIPAA compliance

**Setup Steps**:
1. Create a customer-managed KMS key
2. Set up key policies for appropriate access
3. Create key aliases for easier management
4. Configure automatic key rotation

**Configuration**:
```bash
KMS_KEY_ID=your-kms-key-id
KMS_KEY_ALIAS=alias/medimate-encryption-key
```

**Encryption Scope**:
- Patient medical records
- Appointment details
- Document analysis results
- User personal information

## Testing AWS Services

Use the provided test script to verify all services are configured correctly:

```bash
cd MediMate/backend
python test_aws_services.py
```

This will:
- Test connectivity to all AWS services
- Verify configuration settings
- Display service health status
- Show enabled/disabled services

## Demo Mode

When `DEMO_MODE=true`, the platform uses mock responses instead of actual AWS services. This is useful for:
- Development without AWS costs
- Demonstrations without AWS setup
- Testing application logic

## Production Considerations

### Security
- Use IAM roles instead of access keys when possible
- Enable CloudTrail for audit logging
- Configure VPC endpoints for private connectivity
- Implement least-privilege access policies

### Cost Optimization
- Use appropriate instance types for SageMaker
- Configure SES sending limits
- Monitor usage with AWS Cost Explorer
- Set up billing alerts

### Monitoring
- Enable CloudWatch metrics for all services
- Set up alarms for service failures
- Configure SNS notifications for alerts
- Use X-Ray for distributed tracing

### Compliance
- Enable encryption at rest for all services
- Configure data retention policies
- Implement audit logging
- Regular security assessments

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check AWS credentials and permissions
   - Verify IAM roles and policies
   - Ensure correct region configuration

2. **Service Unavailable**
   - Check service availability in your region
   - Verify service limits and quotas
   - Review CloudWatch logs for errors

3. **Configuration Issues**
   - Validate environment variables
   - Check config.json syntax
   - Verify resource ARNs and IDs

### Debug Commands

```bash
# Test AWS connectivity
python test_aws_services.py

# Check configuration
python -c "from utils.config import get_settings; print(get_settings().dict())"

# Test specific service
python -c "from utils.aws_clients import get_aws_clients; print(get_aws_clients().get_cognito_config())"
```

## Support

For additional support:
- Check AWS service documentation
- Review CloudWatch logs
- Use AWS Support (if available)
- Consult MediMate development team
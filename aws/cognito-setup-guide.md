# AWS Cognito User Pool Setup Guide for MediMate

## Overview
This guide will walk you through setting up AWS Cognito User Pool and Client for the MediMate healthcare platform.

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)
- Access to AWS Console

## Step 1: Create Cognito User Pool

### 1.1 Navigate to AWS Cognito Console
1. Open AWS Console and navigate to Amazon Cognito
2. Click "Create user pool"

### 1.2 Configure Sign-in Experience
1. **Provider types**: Select "Cognito user pool"
2. **Cognito user pool sign-in options**: 
   - ✅ Email
   - ✅ Username (optional)
3. Click "Next"

### 1.3 Configure Security Requirements
1. **Password policy**: 
   - Minimum length: 8 characters
   - ✅ Contains at least 1 uppercase letter
   - ✅ Contains at least 1 lowercase letter  
   - ✅ Contains at least 1 number
   - ❌ Contains at least 1 special character (optional for better UX)

2. **Multi-factor authentication (MFA)**:
   - Select "Optional MFA" for better user experience
   - MFA methods: SMS message (recommended for healthcare)

3. **User account recovery**:
   - ✅ Enable self-service account recovery
   - Recovery methods: Email only (more secure for healthcare)

4. Click "Next"

### 1.4 Configure Sign-up Experience
1. **Self-registration**: ✅ Enable self-registration
2. **Attribute verification and user account confirmation**:
   - ✅ Send email verification messages
   - ✅ Verify email address
3. **Required attributes**:
   - ✅ email (required)
   - ✅ given_name (first name)
   - ✅ family_name (last name)
   - ✅ phone_number (for SMS notifications)
4. Click "Next"

### 1.5 Configure Message Delivery
1. **Email provider**: Use Cognito (for development) or SES (for production)
2. **SMS**: Use SNS for SMS delivery
3. **FROM email address**: Use default or configure custom domain
4. Click "Next"

### 1.6 Integrate Your App
1. **User pool name**: `medimate-user-pool`
2. **App client name**: `medimate-web-client`
3. **Client secret**: ❌ Don't generate client secret (for web apps)
4. **Authentication flows**:
   - ✅ ALLOW_USER_SRP_AUTH (Secure Remote Password)
   - ✅ ALLOW_REFRESH_TOKEN_AUTH (Token refresh)
   - ✅ ALLOW_USER_PASSWORD_AUTH (Username/password auth)

### 1.7 Review and Create
1. Review all settings
2. Click "Create user pool"

## Step 2: Configure App Client Settings

### 2.1 Update App Client
1. In your newly created user pool, go to "App integration" tab
2. Click on your app client (`medimate-web-client`)
3. Edit the following settings:

**Callback URLs** (for development):
```
http://localhost:3000/auth/callback
http://localhost:3000/
```

**Sign out URLs**:
```
http://localhost:3000/
http://localhost:3000/login
```

**OAuth 2.0 settings**:
- ✅ Authorization code grant
- ✅ Implicit grant (for SPA)

**OpenID Connect scopes**:
- ✅ openid
- ✅ email
- ✅ profile

## Step 3: Note Down Configuration Values

After creating the User Pool and App Client, note down these values:

1. **User Pool ID**: Found in "User pool overview" (format: ap-south-1_xxxxxxxxx)
2. **App Client ID**: Found in "App integration" > "App clients" (format: xxxxxxxxxxxxxxxxxxxxxxxxxx)
3. **Region**: ap-south-1 (as configured)

## Step 4: Update MediMate Configuration

Update the following files with your Cognito configuration:

### 4.1 Update aws/config.json
Replace the cognito section with your actual values:

```json
"cognito": {
  "enabled": true,
  "user_pool_id": "YOUR_USER_POOL_ID",
  "client_id": "YOUR_CLIENT_ID", 
  "client_secret": null,
  "region": "ap-south-1",
  "password_policy": {
    "minimum_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": false
  },
  "fallback_enabled": true
}
```

### 4.2 Update Environment Variables
Create or update `.env` file in the backend directory:

```env
AWS_REGION=ap-south-1
COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_CLIENT_ID
```

## Step 5: Test Configuration

### 5.1 Test User Pool Creation
1. Go to your User Pool in AWS Console
2. Navigate to "Users" tab
3. Try creating a test user manually to verify the pool is working

### 5.2 Test App Client
1. Use AWS CLI to test authentication (optional):
```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

## Production Considerations

### Security Enhancements for Production:
1. **Custom Domain**: Set up custom domain for Cognito hosted UI
2. **SES Integration**: Use Amazon SES for email delivery
3. **Advanced Security**: Enable advanced security features
4. **Monitoring**: Set up CloudWatch monitoring for authentication events
5. **Backup**: Enable user pool backup and recovery

### Compliance (HIPAA):
1. **Business Associate Agreement**: Ensure AWS BAA is in place
2. **Encryption**: All data encrypted in transit and at rest
3. **Audit Logging**: Enable CloudTrail for all Cognito events
4. **Access Controls**: Implement least privilege access

## Troubleshooting

### Common Issues:
1. **Invalid callback URL**: Ensure callback URLs match exactly
2. **Client secret error**: Web apps should not use client secret
3. **CORS issues**: Configure proper CORS settings in API Gateway
4. **Token expiration**: Implement proper token refresh logic

### Useful AWS CLI Commands:
```bash
# List user pools
aws cognito-idp list-user-pools --max-results 10

# Describe user pool
aws cognito-idp describe-user-pool --user-pool-id YOUR_USER_POOL_ID

# List app clients
aws cognito-idp list-user-pool-clients --user-pool-id YOUR_USER_POOL_ID
```

## Next Steps

After completing this setup:
1. Update the MediMate configuration files with your Cognito values
2. Test the authentication flow in the application
3. Implement frontend Cognito SDK integration
4. Add proper error handling for authentication failures
5. Set up user registration and login flows

## Support

For issues with this setup:
1. Check AWS Cognito documentation
2. Review CloudWatch logs for authentication errors
3. Test with AWS CLI commands
4. Verify IAM permissions for Cognito access
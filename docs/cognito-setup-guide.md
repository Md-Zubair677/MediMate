# AWS Cognito Setup Guide for MediMate

This guide will help you set up AWS Cognito User Pool for MediMate authentication.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)
- Access to AWS Console

## Step 1: Create Cognito User Pool

1. **Go to AWS Console > Amazon Cognito > User Pools**
2. **Click "Create user pool"**

### Configure Sign-in Experience
- **Authentication providers**: Cognito user pool
- **Cognito user pool sign-in options**: ✅ Email
- **User name requirements**: Allow users to sign in with preferred user name

### Configure Security Requirements
- **Password policy**: 
  - Minimum length: 8 characters
  - ✅ Contains at least 1 uppercase letter
  - ✅ Contains at least 1 lowercase letter  
  - ✅ Contains at least 1 number
  - ❌ Contains at least 1 special character (optional)
- **Multi-factor authentication**: No MFA (for development)
- **User account recovery**: ✅ Enable self-service account recovery - Recommended

### Configure Sign-up Experience
- **Self-registration**: ✅ Enable self-registration
- **Cognito-assisted verification and confirmation**:
  - ✅ Allow Cognito to automatically send messages to verify and confirm - Recommended
  - **Attributes to verify**: Email
- **Verifying attribute changes**: ✅ Keep original attribute value active when an update is pending - Recommended
- **Required attributes**: 
  - ✅ email
  - ✅ family_name (last name)
  - ✅ given_name (first name)

### Configure Message Delivery
- **Email**: Send email with Cognito
- **SMS**: No SMS (for development)

### Integrate Your App
- **User pool name**: `medimate-users`
- **Use the Cognito Hosted UI**: No (we're using custom UI)
- **Domain**: Not needed for custom UI

### App Client Configuration
- **App type**: Public client
- **App client name**: `medimate-web-client`
- **Client secret**: ✅ Generate a client secret
- **Advanced app client settings**:
  - **Authentication flows**: 
    - ✅ ALLOW_USER_PASSWORD_AUTH
    - ✅ ALLOW_REFRESH_TOKEN_AUTH
    - ✅ ALLOW_USER_SRP_AUTH (recommended)
  - **Token expiration**:
    - Access token: 1 hour
    - ID token: 1 hour  
    - Refresh token: 30 days

## Step 2: Update Environment Variables

After creating the User Pool and App Client, update your environment variables:

### Get the Required Values

1. **User Pool ID**: 
   - Go to User pool > General settings
   - Copy the "User pool ID" (format: `ap-south-1_XXXXXXXXX`)

2. **App Client ID**:
   - Go to User pool > App integration > App clients
   - Copy the "Client ID"

3. **App Client Secret**:
   - Go to User pool > App integration > App clients
   - Click on your app client name
   - Click "Show Details" 
   - Copy the "Client secret"

### Update .env File

Update `MediMate/backend/.env`:

```bash
# Replace with your actual values
COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-actual-client-id
COGNITO_CLIENT_SECRET=your-actual-client-secret
```

## Step 3: Test the Configuration

1. **Restart the backend server**:
   ```bash
   cd MediMate/backend
   python main.py
   ```

2. **Check health endpoint**:
   ```bash
   curl http://localhost:8000/health
   ```
   
   Look for `"authentication": "healthy"` in the response.

3. **Test registration**:
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123",
       "first_name": "Test",
       "last_name": "User"
     }'
   ```

## Troubleshooting

### Common Issues

1. **"User pool does not exist"**:
   - Verify the User Pool ID is correct
   - Ensure you're using the correct AWS region

2. **"Invalid client"**:
   - Verify the Client ID is correct
   - Ensure the app client exists in the user pool

3. **"Unable to verify secret hash"**:
   - Verify the Client Secret is correct
   - Ensure the client secret is properly configured

### Debug Mode

Enable debug logging in `.env`:
```bash
LOG_LEVEL=DEBUG
DEBUG=true
```

This will provide detailed logs for authentication operations.
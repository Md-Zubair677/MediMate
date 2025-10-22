# AWS Cognito Setup Guide for MediMate

This guide explains how to set up AWS Cognito User Pool and configure the environment variables for MediMate authentication.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)
- Access to AWS Console

## Step 1: Create Cognito User Pool

### 1.1 Navigate to AWS Cognito Console
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **Cognito** service
3. Click **User Pools** in the left sidebar
4. Click **Create user pool**

### 1.2 Configure User Pool Settings

#### Step 1: Configure sign-in experience
- **Authentication providers**: Select **Cognito user pool**
- **Cognito user pool sign-in options**: Check **Email**
- Click **Next**

#### Step 2: Configure security requirements
- **Password policy**: 
  - Minimum length: **8 characters**
  - Check: **Contains at least 1 uppercase letter**
  - Check: **Contains at least 1 lowercase letter** 
  - Check: **Contains at least 1 number**
  - Uncheck: **Contains at least 1 special character** (optional)
- **Multi-factor authentication**: Select **Optional** (recommended for production)
- **User account recovery**: Select **Email only**
- Click **Next**

#### Step 3: Configure sign-up experience
- **Self-service sign-up**: **Enable self-registration**
- **Cognito-assisted verification and confirmation**:
  - **Allow Cognito to automatically send messages**: **Send email message, verify email address**
- **Verifying attribute changes**: **Keep original attribute value active when an update is pending**
- **Required attributes**: Select **email**, **given_name**, **family_name**
- **Custom attributes**: Add **role** (String, Mutable) for user roles (patient, doctor, admin)
- Click **Next**

#### Step 4: Configure message delivery
- **Email**: Select **Send email with Cognito**
- **SES Region**: Select your preferred region (e.g., **ap-south-1**)
- **FROM email address**: Use default or configure custom domain
- Click **Next**

#### Step 5: Integrate your app
- **User pool name**: `medimate-users`
- **Hosted authentication pages**: **Use the Cognito Hosted UI** (optional)
- **Domain**: Choose **Use a Cognito domain** and enter `medimate-auth-[random]`
- **Initial app client**:
  - **App client name**: `medimate-web-client`
  - **Client secret**: **Generate a client secret**
  - **Authentication flows**: 
    - Check **ALLOW_USER_PASSWORD_AUTH**
    - Check **ALLOW_REFRESH_TOKEN_AUTH**
    - Check **ALLOW_USER_SRP_AUTH**
- Click **Next**

#### Step 6: Review and create
- Review all settings
- Click **Create user pool**

## Step 2: Configure App Client Settings

### 2.1 Update App Client Configuration
1. In your newly created User Pool, go to **App integration** tab
2. Click on your app client (`medimate-web-client`)
3. Click **Edit** in the **Hosted UI** section
4. Configure the following:
   - **Allowed callback URLs**: 
     - `http://localhost:3000/callback` (for development)
     - `https://yourdomain.com/callback` (for production)
   - **Allowed sign-out URLs**:
     - `http://localhost:3000/logout` (for development)
     - `https://yourdomain.com/logout` (for production)
   - **Identity providers**: Select **Cognito user pool**
   - **OAuth 2.0 grant types**: 
     - Check **Authorization code grant**
     - Check **Implicit grant**
   - **OpenID Connect scopes**: 
     - Check **email**
     - Check **openid**
     - Check **profile**
5. Click **Save changes**

## Step 3: Get Configuration Values

### 3.1 User Pool ID
1. In your User Pool, go to **User pool overview**
2. Copy the **User pool ID** (format: `ap-south-1_XXXXXXXXX`)

### 3.2 App Client ID and Secret
1. Go to **App integration** tab
2. Click on your app client
3. Copy the **Client ID**
4. Click **Show client secret** and copy the **Client secret**

## Step 4: Update Environment Variables

### 4.1 Update .env file
Edit `MediMate/backend/.env` and update the following variables:

```bash
# AWS Cognito Authentication Configuration
COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-actual-client-id
COGNITO_CLIENT_SECRET=your-actual-client-secret
```

### 4.2 Example Configuration
```bash
# AWS Cognito Authentication Configuration
COGNITO_USER_POOL_ID=ap-south-1_ABC123DEF
COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m
COGNITO_CLIENT_SECRET=abcdef123456789ghijklmnopqrstuvwxyz1234567890abcdef
```

## Step 5: Test Configuration

### 5.1 Verify Environment Variables
Run the configuration test script:
```bash
cd MediMate/backend
python test_config.py
```

### 5.2 Test Authentication Endpoints
1. Start the backend server:
   ```bash
   cd MediMate/backend
   python main.py
   ```

2. Test the authentication status endpoint:
   ```bash
   curl http://localhost:8000/api/auth/status
   ```

3. Test user registration (optional):
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123",
       "first_name": "Test",
       "last_name": "User",
       "role": "patient"
     }'
   ```

## Step 6: Production Considerations

### 6.1 Security Settings
- Change `JWT_SECRET_KEY` to a secure random string (minimum 32 characters)
- Set `DEBUG=false`
- Set `DEMO_MODE=false`
- Configure proper CORS origins (remove `*`)

### 6.2 Cognito Production Settings
- Enable MFA for all users
- Configure custom email templates
- Set up proper domain for hosted UI
- Configure advanced security features
- Set up CloudWatch logging

### 6.3 Monitoring
- Enable CloudWatch logs for Cognito
- Set up CloudWatch alarms for authentication failures
- Monitor user registration and login patterns

## Troubleshooting

### Common Issues

1. **"User pool not found" error**
   - Verify `COGNITO_USER_POOL_ID` is correct
   - Ensure the user pool exists in the specified region

2. **"Invalid client" error**
   - Verify `COGNITO_CLIENT_ID` is correct
   - Ensure the app client exists and is enabled

3. **"Invalid client secret" error**
   - Verify `COGNITO_CLIENT_SECRET` is correct
   - Ensure client secret is enabled for the app client

4. **"NotAuthorizedException" during login**
   - Check if user exists and is confirmed
   - Verify password meets policy requirements
   - Ensure `ALLOW_USER_PASSWORD_AUTH` is enabled

### Debug Steps

1. Check AWS CloudWatch logs for Cognito events
2. Verify environment variables are loaded correctly
3. Test with AWS CLI:
   ```bash
   aws cognito-idp describe-user-pool --user-pool-id your-pool-id
   ```

## Additional Resources

- [AWS Cognito User Pools Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito Authentication Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
- [Cognito Security Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/security.html)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Consult the MediMate development team
4. Refer to AWS Cognito documentation
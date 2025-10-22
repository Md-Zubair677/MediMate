# AWS Cognito Setup Guide for MediMate

This guide will help you set up AWS Cognito authentication for the MediMate frontend application.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)
- Node.js and npm installed

## Step 1: Create Cognito User Pool

1. **Go to AWS Console**
   - Navigate to AWS Cognito service
   - Click "User pools" in the left sidebar
   - Click "Create user pool"

2. **Configure Sign-in Experience**
   - **Authentication providers**: Cognito user pool
   - **Cognito user pool sign-in options**: ✓ Email
   - Click "Next"

3. **Configure Security Requirements**
   - **Password policy**: Custom
     - Minimum length: 8 characters
     - ✓ Contains at least 1 uppercase letter
     - ✓ Contains at least 1 lowercase letter  
     - ✓ Contains at least 1 number
     - ✓ Contains at least 1 special character
   - **Multi-factor authentication**: Optional (recommended for production)
   - **User account recovery**: ✓ Enable self-service account recovery - Recommended
   - **Self-service account recovery methods**: ✓ Email only
   - Click "Next"

4. **Configure Sign-up Experience**
   - **Self-registration**: ✓ Enable self-registration
   - **Cognito-assisted verification and confirmation**:
     - ✓ Allow Cognito to automatically send messages to verify and confirm - Recommended
     - **Attributes to verify**: ✓ Send email message, verify email address
   - **Required attributes**: 
     - ✓ email
     - ✓ given_name (first name)
     - ✓ family_name (last name)
   - **Custom attributes** (optional):
     - Add custom attribute: `role` (String, Mutable) for user roles (patient, doctor, admin)
   - Click "Next"

5. **Configure Message Delivery**
   - **Email**: ✓ Send email with Cognito
   - **SES Region**: Choose your preferred region (e.g., ap-south-1)
   - **FROM email address**: Use default or configure custom domain
   - Click "Next"

6. **Integrate Your App**
   - **User pool name**: `medimate-users`
   - **Hosted authentication pages**: ✓ Use the Cognito Hosted UI (optional)
   - **Domain**: Choose Cognito domain or custom domain
   - **Initial app client**:
     - **App client name**: `medimate-web-client`
     - **Client secret**: ✓ Generate a client secret
     - **Authentication flows**:
       - ✓ ALLOW_USER_PASSWORD_AUTH
       - ✓ ALLOW_REFRESH_TOKEN_AUTH
       - ✓ ALLOW_USER_SRP_AUTH
   - Click "Next"

7. **Review and Create**
   - Review all settings
   - Click "Create user pool"

## Step 2: Configure App Client Settings

1. **Navigate to App Integration**
   - In your User Pool, go to "App integration" tab
   - Click on your app client (`medimate-web-client`)

2. **Configure App Client Settings**
   - **Allowed callback URLs**: 
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Allowed sign-out URLs**:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Identity providers**: ✓ Cognito User Pool
   - **OAuth 2.0 grant types**:
     - ✓ Authorization code grant
     - ✓ Implicit grant (for SPA)
   - **OpenID Connect scopes**:
     - ✓ email
     - ✓ openid
     - ✓ profile
   - Save changes

## Step 3: Get Configuration Values

After creating the User Pool and App Client, collect these values:

1. **User Pool ID**
   - Found in User Pool → General settings
   - Format: `ap-south-1_XXXXXXXXX`

2. **App Client ID**
   - Found in User Pool → App integration → App clients
   - Format: `xxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **App Client Secret** (if generated)
   - Found in User Pool → App integration → App clients → Show Details
   - Keep this secure and never expose in frontend code

## Step 4: Update Environment Variables

1. **Update Frontend Environment File**
   
   Edit `MediMate/frontend/.env.local`:
   ```bash
   # Replace with your actual values
   NEXT_PUBLIC_AWS_REGION=ap-south-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
   NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_DEMO_MODE=false
   ```

2. **Update Backend Environment File**
   
   Edit `MediMate/backend/.env`:
   ```bash
   # Replace with your actual values
   AWS_REGION=ap-south-1
   COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
   COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   COGNITO_CLIENT_SECRET=your-client-secret-here
   DEMO_MODE=false
   ```

## Step 5: Test Authentication

1. **Install Dependencies**
   ```bash
   cd MediMate/frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Test Registration Flow**
   - Go to `http://localhost:3000`
   - Try registering a new user
   - Check your email for verification code
   - Complete email verification

4. **Test Login Flow**
   - Try logging in with verified credentials
   - Verify token refresh works automatically

## Step 6: Production Considerations

### Security Best Practices

1. **Environment Variables**
   - Never commit real credentials to version control
   - Use different User Pools for dev/staging/production
   - Rotate client secrets regularly

2. **CORS Configuration**
   - Update CORS settings to only allow your production domains
   - Remove wildcard (*) origins in production

3. **MFA (Multi-Factor Authentication)**
   - Enable MFA for production environments
   - Consider SMS or TOTP-based MFA

4. **Custom Attributes**
   - Use custom attributes for user roles and metadata
   - Ensure proper validation on both frontend and backend

### Monitoring and Logging

1. **CloudWatch Integration**
   - Monitor authentication events
   - Set up alerts for failed login attempts
   - Track user registration patterns

2. **Error Handling**
   - Implement proper error boundaries
   - Provide user-friendly error messages
   - Log authentication errors for debugging

## Troubleshooting

### Common Issues

1. **"User Pool does not exist" Error**
   - Verify User Pool ID is correct
   - Ensure AWS region matches
   - Check AWS credentials/permissions

2. **"Invalid client" Error**
   - Verify App Client ID is correct
   - Ensure client secret is properly configured (backend only)
   - Check authentication flow settings

3. **CORS Errors**
   - Verify callback URLs are configured
   - Check CORS settings in backend
   - Ensure proper domain configuration

4. **Email Verification Issues**
   - Check SES configuration and limits
   - Verify email templates are set up
   - Ensure proper FROM email address

### Debug Mode

To enable debug logging, add to your environment:
```bash
NEXT_PUBLIC_DEBUG_AUTH=true
```

This will provide detailed console logs for authentication flows.

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth Documentation](https://docs.amplify.aws/lib/auth/getting-started/)
- [Cognito User Pool Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings.html)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test with demo mode first (`NEXT_PUBLIC_DEMO_MODE=true`)
4. Review AWS CloudWatch logs for backend errors
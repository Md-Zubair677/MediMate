"""
Authentication service for MediMate platform with AWS Cognito integration.
Handles user registration, login, token validation, and password management.
"""

import json
import logging
import hmac
import hashlib
import base64
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
from botocore.exceptions import ClientError

from utils.aws_clients import get_aws_clients
from utils.config import get_settings
from models.user import User, UserRole

logger = logging.getLogger(__name__)


class AuthenticationError(Exception):
    """Custom exception for authentication errors."""
    pass


class AuthService:
    """Authentication service with AWS Cognito integration."""
    
    def __init__(self):
        self.aws_clients = get_aws_clients()
        self.settings = get_settings()
        self.cognito_client = None
        self.cognito_config = None
        self._initialize_cognito()
    
    def _initialize_cognito(self):
        """Initialize Cognito client and configuration."""
        try:
            self.cognito_client = self.aws_clients.get_cognito_client()
            self.cognito_config = self.aws_clients.get_cognito_config()
            
            if self.cognito_client and self.cognito_config.get('enabled'):
                logger.info("Cognito authentication service initialized")
            else:
                logger.warning("Cognito not available - using fallback authentication")
        except Exception as e:
            logger.error(f"Failed to initialize Cognito service: {e}")
            self.cognito_client = None
    
    def _calculate_secret_hash(self, username: str) -> Optional[str]:
        """Calculate secret hash for Cognito operations."""
        client_secret = self.cognito_config.get('client_secret')
        client_id = self.cognito_config.get('client_id')
        
        if not client_secret or not client_id:
            return None
        
        message = username + client_id
        dig = hmac.new(
            client_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()
    
    async def register_user(self, email: str, password: str, first_name: str, 
                          last_name: str, role: UserRole, **kwargs) -> Dict[str, Any]:
        """Register a new user with Cognito and create user profile."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                # Fallback registration for demo mode
                return await self._fallback_register(email, password, first_name, last_name, role, **kwargs)
            
            user_pool_id = self.cognito_config.get('user_pool_id')
            client_id = self.cognito_config.get('client_id')
            
            if not user_pool_id or not client_id:
                raise AuthenticationError("Cognito configuration incomplete")
            
            # Prepare user attributes
            user_attributes = [
                {'Name': 'email', 'Value': email},
                {'Name': 'given_name', 'Value': first_name},
                {'Name': 'family_name', 'Value': last_name},
                {'Name': 'custom:role', 'Value': role.value},
                {'Name': 'name', 'Value': f"{first_name} {last_name}"},
            ]
            
            # Add optional attributes
            if kwargs.get('phone_number'):
                user_attributes.append({'Name': 'phone_number', 'Value': kwargs['phone_number']})
            
            # Calculate secret hash if needed
            secret_hash = self._calculate_secret_hash(email)
            
            # Create user in Cognito
            cognito_params = {
                'ClientId': client_id,
                'Username': email,
                'Password': password,
                'UserAttributes': user_attributes
            }
            
            if secret_hash:
                cognito_params['SecretHash'] = secret_hash
            
            response = self.cognito_client.sign_up(**cognito_params)
            
            # Create user profile in DynamoDB
            from services.dynamodb_service import get_dynamodb_service
            from models.user import UserCreate
            db_service = get_dynamodb_service()
            
            user_data = UserCreate(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=password,  # This won't be stored in DynamoDB
                **kwargs
            )
            
            user = await db_service.create_user(user_data)
            
            return {
                'success': True,
                'message': 'User registered successfully',
                'user_id': user.user_id if user else None,
                'cognito_user_sub': response.get('UserSub'),
                'confirmation_required': not response.get('UserConfirmed', False)
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Cognito registration error: {error_code} - {error_message}")
            
            # Handle specific Cognito errors
            if error_code == 'UsernameExistsException':
                return {'success': False, 'error': 'User already exists'}
            elif error_code == 'InvalidPasswordException':
                return {'success': False, 'error': 'Password does not meet requirements'}
            else:
                return {'success': False, 'error': f'Registration failed: {error_message}'}
                
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return {'success': False, 'error': 'Registration failed'}
    
    async def _fallback_register(self, email: str, password: str, first_name: str, 
                                last_name: str, role: UserRole, **kwargs) -> Dict[str, Any]:
        """Fallback registration for demo mode."""
        try:
            from services.dynamodb_service import get_dynamodb_service
            db_service = get_dynamodb_service()
            
            # Check if user already exists
            existing_user = await db_service.get_user_by_email(email)
            if existing_user:
                return {'success': False, 'error': 'User already exists'}
            
            # Create user
            from models.user import UserCreate
            user_data = UserCreate(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=password,
                **kwargs
            )
            
            user = await db_service.create_user(user_data)
            
            return {
                'success': True,
                'message': 'User registered successfully (demo mode)',
                'user_id': user.user_id if user else None,
                'confirmation_required': False
            }
            
        except Exception as e:
            logger.error(f"Fallback registration error: {e}")
            return {'success': False, 'error': 'Registration failed'}
    
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user with Cognito and return JWT token."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                # Fallback login for demo mode
                return await self._fallback_login(email, password)
            
            client_id = self.cognito_config.get('client_id')
            if not client_id:
                raise AuthenticationError("Cognito client ID not configured")
            
            # Calculate secret hash if needed
            secret_hash = self._calculate_secret_hash(email)
            
            # Authenticate with Cognito
            auth_params = {
                'ClientId': client_id,
                'AuthFlow': 'USER_PASSWORD_AUTH',
                'AuthParameters': {
                    'USERNAME': email,
                    'PASSWORD': password
                }
            }
            
            if secret_hash:
                auth_params['AuthParameters']['SECRET_HASH'] = secret_hash
            
            response = self.cognito_client.initiate_auth(**auth_params)
            
            # Extract tokens
            auth_result = response['AuthenticationResult']
            access_token = auth_result['AccessToken']
            id_token = auth_result['IdToken']
            refresh_token = auth_result['RefreshToken']
            
            # Get user info from token
            user_info = self._decode_token(id_token)
            
            # Get user profile from DynamoDB
            from services.dynamodb_service import get_dynamodb_service
            db_service = get_dynamodb_service()
            user = await db_service.get_user_by_email(email)
            
            # Update last login
            if user:
                user.last_login = datetime.now()
                from models.user import UserUpdate
                await db_service.update_user(user.user_id, UserUpdate())
            
            return {
                'success': True,
                'message': 'Login successful',
                'access_token': access_token,
                'id_token': id_token,
                'refresh_token': refresh_token,
                'expires_in': auth_result.get('ExpiresIn', 3600),
                'user': user.dict() if user else user_info
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Cognito login error: {error_code} - {error_message}")
            
            # Handle specific Cognito errors
            if error_code == 'NotAuthorizedException':
                return {'success': False, 'error': 'Invalid email or password'}
            elif error_code == 'UserNotConfirmedException':
                return {'success': False, 'error': 'Please confirm your email address'}
            elif error_code == 'UserNotFoundException':
                return {'success': False, 'error': 'User not found'}
            else:
                return {'success': False, 'error': f'Login failed: {error_message}'}
                
        except Exception as e:
            logger.error(f"Login error: {e}")
            return {'success': False, 'error': 'Login failed'}
    
    async def confirm_email(self, email: str, confirmation_code: str) -> Dict[str, Any]:
        """Confirm user email with verification code."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                # Fallback for demo mode
                return {
                    'success': True,
                    'message': 'Email confirmed successfully (demo mode)',
                    'user_confirmed': True
                }
            
            client_id = self.cognito_config.get('client_id')
            if not client_id:
                raise AuthenticationError("Cognito client ID not configured")
            
            # Calculate secret hash if needed
            secret_hash = self._calculate_secret_hash(email)
            
            # Confirm signup with Cognito
            confirm_params = {
                'ClientId': client_id,
                'Username': email,
                'ConfirmationCode': confirmation_code
            }
            
            if secret_hash:
                confirm_params['SecretHash'] = secret_hash
            
            response = self.cognito_client.confirm_sign_up(**confirm_params)
            
            return {
                'success': True,
                'message': 'Email confirmed successfully',
                'user_confirmed': True
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            if error_code == 'CodeMismatchException':
                return {'success': False, 'error': 'Invalid confirmation code'}
            elif error_code == 'ExpiredCodeException':
                return {'success': False, 'error': 'Confirmation code has expired'}
            elif error_code == 'NotAuthorizedException':
                return {'success': False, 'error': 'User already confirmed'}
            else:
                logger.error(f"Email confirmation failed: {error_code} - {error_message}")
                return {'success': False, 'error': f'Confirmation failed: {error_message}'}
        
        except Exception as e:
            logger.error(f"Email confirmation error: {str(e)}")
            return {'success': False, 'error': 'Email confirmation failed'}

    async def resend_confirmation_code(self, email: str) -> Dict[str, Any]:
        """Resend email confirmation code."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                return {
                    'success': True,
                    'message': 'Confirmation code sent (demo mode)'
                }
            
            client_id = self.cognito_config.get('client_id')
            secret_hash = self._calculate_secret_hash(email)
            
            resend_params = {
                'ClientId': client_id,
                'Username': email
            }
            
            if secret_hash:
                resend_params['SecretHash'] = secret_hash
            
            self.cognito_client.resend_confirmation_code(**resend_params)
            
            return {
                'success': True,
                'message': 'Confirmation code sent to your email'
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Resend confirmation failed: {error_code}")
            return {'success': False, 'error': 'Failed to resend confirmation code'}
        
        except Exception as e:
            logger.error(f"Resend confirmation error: {str(e)}")
            return {'success': False, 'error': 'Failed to resend confirmation code'}
        """Fallback login for demo mode."""
        try:
            from services.dynamodb_service import get_dynamodb_service
            db_service = get_dynamodb_service()
            
            # Get user from database
            user = await db_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # In demo mode, accept any password for existing users
            # In production, you would verify the password hash
            
            # Generate JWT token
            token_payload = {
                'user_id': user.user_id,
                'email': user.email,
                'role': user.role.value,
                'exp': datetime.utcnow() + timedelta(hours=self.settings.jwt_expiration_hours),
                'iat': datetime.utcnow()
            }
            
            access_token = jwt.encode(
                token_payload,
                self.settings.jwt_secret_key,
                algorithm=self.settings.jwt_algorithm
            )
            
            # Update last login
            user.last_login = datetime.now()
            from models.user import UserUpdate
            await db_service.update_user(user.user_id, UserUpdate())
            
            return {
                'success': True,
                'message': 'Login successful (demo mode)',
                'access_token': access_token,
                'expires_in': self.settings.jwt_expiration_hours * 3600,
                'user': user.dict()
            }
            
        except Exception as e:
            logger.error(f"Fallback login error: {e}")
            return {'success': False, 'error': 'Login failed'}
    
    def _decode_token(self, token: str) -> Dict[str, Any]:
        """Decode JWT token without verification (for demo purposes)."""
        try:
            # In production, you should verify the token signature
            decoded = jwt.decode(token, options={"verify_signature": False})
            return decoded
        except Exception as e:
            logger.error(f"Token decode error: {e}")
            return {}
    
    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token and return user information."""
        try:
            if not token:
                return None
            
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            if self.cognito_client and self.cognito_config.get('enabled'):
                # Validate with Cognito
                try:
                    response = self.cognito_client.get_user(AccessToken=token)
                    
                    # Extract user attributes
                    user_attributes = {}
                    for attr in response['UserAttributes']:
                        user_attributes[attr['Name']] = attr['Value']
                    
                    return {
                        'valid': True,
                        'username': response['Username'],
                        'email': user_attributes.get('email'),
                        'role': user_attributes.get('custom:role'),
                        'attributes': user_attributes
                    }
                    
                except ClientError as e:
                    logger.warning(f"Cognito token validation failed: {e}")
                    return None
            else:
                # Fallback JWT validation
                try:
                    decoded = jwt.decode(
                        token,
                        self.settings.jwt_secret_key,
                        algorithms=[self.settings.jwt_algorithm]
                    )
                    
                    return {
                        'valid': True,
                        'user_id': decoded.get('user_id'),
                        'email': decoded.get('email'),
                        'role': decoded.get('role'),
                        'exp': decoded.get('exp')
                    }
                    
                except jwt.ExpiredSignatureError:
                    logger.warning("JWT token expired")
                    return None
                except jwt.InvalidTokenError:
                    logger.warning("Invalid JWT token")
                    return None
                    
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                return {'success': False, 'error': 'Token refresh not available in demo mode'}
            
            client_id = self.cognito_config.get('client_id')
            if not client_id:
                raise AuthenticationError("Cognito client ID not configured")
            
            response = self.cognito_client.initiate_auth(
                ClientId=client_id,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters={
                    'REFRESH_TOKEN': refresh_token
                }
            )
            
            auth_result = response['AuthenticationResult']
            
            return {
                'success': True,
                'access_token': auth_result['AccessToken'],
                'id_token': auth_result['IdToken'],
                'expires_in': auth_result.get('ExpiresIn', 3600)
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Token refresh error: {error_code}")
            return {'success': False, 'error': 'Token refresh failed'}
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return {'success': False, 'error': 'Token refresh failed'}
    
    async def forgot_password(self, email: str) -> Dict[str, Any]:
        """Initiate password reset process."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                # Fallback for demo mode
                return {
                    'success': True,
                    'message': f'Password reset email sent to {email} (demo mode)'
                }
            
            client_id = self.cognito_config.get('client_id')
            secret_hash = self._calculate_secret_hash(email)
            
            params = {
                'ClientId': client_id,
                'Username': email
            }
            
            if secret_hash:
                params['SecretHash'] = secret_hash
            
            self.cognito_client.forgot_password(**params)
            
            return {
                'success': True,
                'message': f'Password reset code sent to {email}'
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Forgot password error: {error_code}")
            
            if error_code == 'UserNotFoundException':
                return {'success': False, 'error': 'User not found'}
            else:
                return {'success': False, 'error': 'Password reset failed'}
                
        except Exception as e:
            logger.error(f"Forgot password error: {e}")
            return {'success': False, 'error': 'Password reset failed'}
    
    async def reset_password(self, email: str, confirmation_code: str, new_password: str) -> Dict[str, Any]:
        """Reset password with confirmation code."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                return {'success': False, 'error': 'Password reset not available in demo mode'}
            
            client_id = self.cognito_config.get('client_id')
            secret_hash = self._calculate_secret_hash(email)
            
            params = {
                'ClientId': client_id,
                'Username': email,
                'ConfirmationCode': confirmation_code,
                'Password': new_password
            }
            
            if secret_hash:
                params['SecretHash'] = secret_hash
            
            self.cognito_client.confirm_forgot_password(**params)
            
            return {
                'success': True,
                'message': 'Password reset successfully'
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Password reset error: {error_code}")
            
            if error_code == 'CodeMismatchException':
                return {'success': False, 'error': 'Invalid confirmation code'}
            elif error_code == 'ExpiredCodeException':
                return {'success': False, 'error': 'Confirmation code expired'}
            else:
                return {'success': False, 'error': 'Password reset failed'}
                
        except Exception as e:
            logger.error(f"Password reset error: {e}")
            return {'success': False, 'error': 'Password reset failed'}
    
    async def logout_user(self, access_token: str) -> Dict[str, Any]:
        """Logout user and invalidate token."""
        try:
            if self.cognito_client and self.cognito_config.get('enabled'):
                # Global sign out from Cognito
                self.cognito_client.global_sign_out(AccessToken=access_token)
            
            return {
                'success': True,
                'message': 'Logout successful'
            }
            
        except ClientError as e:
            logger.error(f"Logout error: {e}")
            # Even if Cognito logout fails, we can still consider it successful
            return {
                'success': True,
                'message': 'Logout completed'
            }
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return {'success': False, 'error': 'Logout failed'}
    
    async def confirm_registration(self, email: str, confirmation_code: str) -> Dict[str, Any]:
        """Confirm user registration with verification code."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                # Fallback for demo mode - simulate successful confirmation
                return {
                    'success': True,
                    'message': 'Email verification successful (demo mode)',
                    'auto_sign_in': False
                }
            
            client_id = self.cognito_config.get('client_id')
            secret_hash = self._calculate_secret_hash(email)
            
            params = {
                'ClientId': client_id,
                'Username': email,
                'ConfirmationCode': confirmation_code
            }
            
            if secret_hash:
                params['SecretHash'] = secret_hash
            
            response = self.cognito_client.confirm_sign_up(**params)
            
            # Check if auto sign-in is enabled and attempt it
            auto_sign_in_result = None
            try:
                # Attempt auto sign-in after confirmation
                login_result = await self._attempt_auto_signin(email)
                if login_result and login_result.get('success'):
                    auto_sign_in_result = login_result
            except Exception as e:
                logger.warning(f"Auto sign-in failed after confirmation: {e}")
            
            return {
                'success': True,
                'message': 'Email verification successful',
                'auto_sign_in': auto_sign_in_result
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Confirm registration error: {error_code}")
            
            if error_code == 'CodeMismatchException':
                return {'success': False, 'error': 'Invalid verification code'}
            elif error_code == 'ExpiredCodeException':
                return {'success': False, 'error': 'Verification code has expired'}
            elif error_code == 'NotAuthorizedException':
                return {'success': False, 'error': 'User is already confirmed'}
            else:
                return {'success': False, 'error': 'Email verification failed'}
                
        except Exception as e:
            logger.error(f"Confirm registration error: {e}")
            return {'success': False, 'error': 'Email verification failed'}
    
    async def _attempt_auto_signin(self, email: str) -> Optional[Dict[str, Any]]:
        """Attempt auto sign-in after email confirmation."""
        try:
            # Get user from database to check if they exist
            from services.dynamodb_service import get_dynamodb_service
            db_service = get_dynamodb_service()
            user = await db_service.get_user_by_email(email)
            
            if not user:
                return None
            
            # Create a temporary session token for the confirmed user
            token_payload = {
                'user_id': user.user_id,
                'email': user.email,
                'role': user.role.value,
                'exp': datetime.utcnow() + timedelta(hours=self.settings.jwt_expiration_hours),
                'iat': datetime.utcnow(),
                'auto_signin': True
            }
            
            access_token = jwt.encode(
                token_payload,
                self.settings.jwt_secret_key,
                algorithm=self.settings.jwt_algorithm
            )
            
            # Update user verification status
            user.is_verified = True
            user.last_login = datetime.now()
            from models.user import UserUpdate
            await db_service.update_user(user.user_id, UserUpdate())
            
            return {
                'success': True,
                'access_token': access_token,
                'user': user.dict(),
                'expires_in': self.settings.jwt_expiration_hours * 3600
            }
            
        except Exception as e:
            logger.error(f"Auto sign-in error: {e}")
            return None
    
    async def resend_verification_code(self, email: str) -> Dict[str, Any]:
        """Resend verification code for email confirmation."""
        try:
            if not self.cognito_client or not self.cognito_config.get('enabled'):
                # Fallback for demo mode
                return {
                    'success': True,
                    'message': f'Verification code sent to {email} (demo mode)'
                }
            
            client_id = self.cognito_config.get('client_id')
            secret_hash = self._calculate_secret_hash(email)
            
            params = {
                'ClientId': client_id,
                'Username': email
            }
            
            if secret_hash:
                params['SecretHash'] = secret_hash
            
            self.cognito_client.resend_confirmation_code(**params)
            
            return {
                'success': True,
                'message': f'Verification code sent to {email}'
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Resend verification error: {error_code}")
            
            if error_code == 'UserNotFoundException':
                return {'success': False, 'error': 'User not found'}
            elif error_code == 'InvalidParameterException':
                return {'success': False, 'error': 'User is already confirmed'}
            else:
                return {'success': False, 'error': 'Failed to resend verification code'}
                
        except Exception as e:
            logger.error(f"Resend verification error: {e}")
            return {'success': False, 'error': 'Failed to resend verification code'}

    async def get_current_user(self, token: str) -> Optional[User]:
        """Get current user information from token."""
        try:
            token_data = await self.validate_token(token)
            if not token_data or not token_data.get('valid'):
                return None
            
            # Get user from database
            from services.dynamodb_service import get_dynamodb_service
            db_service = get_dynamodb_service()
            
            email = token_data.get('email')
            user_id = token_data.get('user_id')
            
            if user_id:
                return await db_service.get_user(user_id)
            elif email:
                return await db_service.get_user_by_email(email)
            
            return None
            
        except Exception as e:
            logger.error(f"Get current user error: {e}")
            return None
    
    def create_demo_token(self, user: User) -> str:
        """Create a demo JWT token for testing purposes."""
        try:
            token_payload = {
                'user_id': user.user_id,
                'email': user.email,
                'role': user.role.value,
                'name': user.full_name,
                'exp': datetime.utcnow() + timedelta(hours=self.settings.jwt_expiration_hours),
                'iat': datetime.utcnow(),
                'demo': True
            }
            
            return jwt.encode(
                token_payload,
                self.settings.jwt_secret_key,
                algorithm=self.settings.jwt_algorithm
            )
            
        except Exception as e:
            logger.error(f"Demo token creation error: {e}")
            return ""


# Global instance
auth_service = AuthService()


def get_auth_service() -> AuthService:
    """Get the global authentication service instance."""
    return auth_service


# Import fix - moved to avoid circular imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.user import UserCreate, UserUpdate
import { Amplify } from 'aws-amplify';
import { signUp, confirmSignUp, signIn as cognitoSignIn, signOut as cognitoSignOut } from 'aws-amplify/auth';
import { awsConfig } from '../aws-config';

// Configure Amplify
Amplify.configure({
  Auth: awsConfig
});

export const register = async (userData) => {
  try {
    const { isSignUpComplete, userId } = await signUp({
      username: userData.email,
      password: userData.password,
      options: {
        userAttributes: {
          email: userData.email,
          given_name: userData.firstName,
          family_name: userData.lastName,
          'custom:role': userData.role || 'patient'
        }
      }
    });

    return {
      success: true,
      message: isSignUpComplete ? 'Registration complete!' : 'Please check your email for verification code.',
      userId,
      confirmationRequired: !isSignUpComplete
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

export const confirmRegistration = async (email, code) => {
  try {
    await confirmSignUp({
      username: email,
      confirmationCode: code
    });

    return {
      success: true,
      message: 'Email verified successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Verification failed'
    };
  }
};

export const signIn = async (email, password) => {
  try {
    const { isSignedIn } = await cognitoSignIn({
      username: email,
      password: password
    });

    if (isSignedIn) {
      return {
        success: true,
        message: 'Login successful'
      };
    }
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await cognitoSignOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
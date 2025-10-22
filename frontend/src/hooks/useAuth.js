/
 * Custom React Hook for Authentication Management
 * Provides authentication state and methods throughout the application
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  initializeAuth, 
  checkAuthStatus, 
  login, 
  logout, 
  register, 
  confirmRegistration,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  refreshAccessToken,
  setupTokenRefresh,
  clearTokenRefresh,
  isAuthenticated as checkIsAuthenticated,
  getStoredUser,
} from '../utils/auth';

/
 * Authentication Hook
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /
   * Initialize authentication on component mount
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const authStatus = await initializeAuth();
        
        setIsAuthenticated(authStatus.authenticated);
        setUser(authStatus.user);
        
        console.log('Authentication initialized:', authStatus);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      clearTokenRefresh();
    };
  }, []);

  /
   * Login user
   */
  const loginUser = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await login(email, password);
      
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /
   * Register user
   */
  const registerUser = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await register(userData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /
   * Logout user
   */
  const logoutUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await logout();
      
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed');
      
      // Force clear local state even if logout fails
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /
   * Confirm email registration
   */
  const confirmEmail = useCallback(async (email, confirmationCode) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await confirmRegistration(email, confirmationCode);
      
      if (result.success) {
        // Check if auto sign-in was successful
        if (result.autoSignIn && result.autoSignIn.success) {
          setIsAuthenticated(true);
          setUser(result.autoSignIn.user);
        }
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Email confirmation error:', error);
      const errorMessage = 'Email verification failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await forgotPassword(email);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Password reset request error:', error);
      const errorMessage = 'Password reset request failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /
   * Reset password with confirmation code
   */
  const resetUserPassword = useCallback(async (email, confirmationCode, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await resetPassword(email, confirmationCode, newPassword);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = 'Password reset failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      return currentUser;
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  /
   * Check if user is currently authenticated
   */
  const checkAuth = useCallback(async () => {
    try {
      const authStatus = await checkAuthStatus();
      
      setIsAuthenticated(authStatus.authenticated);
      setUser(authStatus.user);
      
      return authStatus;
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      return { authenticated: false, user: null };
    }
  }, []);

  /
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Methods
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    confirmEmail,
    requestPasswordReset,
    resetPassword: resetUserPassword,
    refreshUser,
    checkAuth,
    clearError,
    
    // Utility methods
    isLoggedIn: isAuthenticated && user !== null,
    userRole: user?.role || null,
    userId: user?.user_id || null,
    userEmail: user?.email || null,
  };
};

export default useAuth;
/
 * React hook for handling token refresh events and notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { tokenEvents } from '../utils/auth';

/
 * Hook for managing token refresh state and notifications
 */
export const useTokenRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [expiryWarning, setExpiryWarning] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Clear error state
  const clearError = useCallback(() => {
    setRefreshError(null);
  }, []);

  // Clear expiry warning
  const clearWarning = useCallback(() => {
    setExpiryWarning(null);
  }, []);

  // Clear session expired state
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    // Token refresh start handler
    const handleRefreshStart = () => {
      setIsRefreshing(true);
      setRefreshError(null);
    };

    // Token refresh success handler
    const handleRefreshSuccess = (event) => {
      setIsRefreshing(false);
      setRefreshError(null);
      setExpiryWarning(null);
      
      console.log('Token refreshed successfully:', event.detail);
    };

    // Token refresh failed handler
    const handleRefreshFailed = (event) => {
      setIsRefreshing(false);
      setRefreshError({
        message: 'Failed to refresh your session',
        reason: event.detail?.reason || 'Unknown error',
        timestamp: new Date(),
      });
      
      console.error('Token refresh failed:', event.detail);
    };

    // Token expiring soon handler
    const handleTokenExpiringSoon = (event) => {
      const { timeUntilExpiry, timeUntilRefresh, message, critical } = event.detail;
      
      setExpiryWarning({
        message: message || 'Your session will expire soon',
        timeUntilExpiry,
        timeUntilRefresh,
        critical: critical || false,
        timestamp: new Date(),
      });
      
      console.warn('Token expiring soon:', event.detail);
    };

    // Session expired handler
    const handleSessionExpired = (event) => {
      setSessionExpired(true);
      setIsRefreshing(false);
      setRefreshError({
        message: 'Your session has expired',
        reason: event.detail?.reason || 'Session expired',
        timestamp: new Date(),
      });
      
      console.error('Session expired:', event.detail);
    };

    // Add event listeners
    tokenEvents.addEventListener(tokenEvents.EVENTS.TOKEN_REFRESH_START, handleRefreshStart);
    tokenEvents.addEventListener(tokenEvents.EVENTS.TOKEN_REFRESH_SUCCESS, handleRefreshSuccess);
    tokenEvents.addEventListener(tokenEvents.EVENTS.TOKEN_REFRESH_FAILED, handleRefreshFailed);
    tokenEvents.addEventListener(tokenEvents.EVENTS.TOKEN_EXPIRING_SOON, handleTokenExpiringSoon);
    tokenEvents.addEventListener(tokenEvents.EVENTS.SESSION_EXPIRED, handleSessionExpired);

    // Cleanup event listeners
    return () => {
      tokenEvents.removeEventListener(tokenEvents.EVENTS.TOKEN_REFRESH_START, handleRefreshStart);
      tokenEvents.removeEventListener(tokenEvents.EVENTS.TOKEN_REFRESH_SUCCESS, handleRefreshSuccess);
      tokenEvents.removeEventListener(tokenEvents.EVENTS.TOKEN_REFRESH_FAILED, handleRefreshFailed);
      tokenEvents.removeEventListener(tokenEvents.EVENTS.TOKEN_EXPIRING_SOON, handleTokenExpiringSoon);
      tokenEvents.removeEventListener(tokenEvents.EVENTS.SESSION_EXPIRED, handleSessionExpired);
    };
  }, []);

  return {
    isRefreshing,
    refreshError,
    expiryWarning,
    sessionExpired,
    clearError,
    clearWarning,
    clearSessionExpired,
  };
};

/
 * Hook for displaying token refresh notifications
 */
export const useTokenNotifications = () => {
  const {
    isRefreshing,
    refreshError,
    expiryWarning,
    sessionExpired,
    clearError,
    clearWarning,
    clearSessionExpired,
  } = useTokenRefresh();

  // Get notification message and type
  const getNotification = useCallback(() => {
    if (sessionExpired) {
      return {
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        persistent: true,
        action: {
          label: 'Log In',
          onClick: () => {
            clearSessionExpired();
            window.location.href = '/login';
          },
        },
      };
    }

    if (refreshError) {
      return {
        type: 'error',
        title: 'Session Refresh Failed',
        message: refreshError.message,
        persistent: false,
        action: {
          label: 'Dismiss',
          onClick: clearError,
        },
      };
    }

    if (expiryWarning) {
      return {
        type: expiryWarning.critical ? 'warning' : 'info',
        title: expiryWarning.critical ? 'Session Expiring Soon' : 'Session Update',
        message: expiryWarning.message,
        persistent: expiryWarning.critical,
        action: {
          label: 'Dismiss',
          onClick: clearWarning,
        },
      };
    }

    if (isRefreshing) {
      return {
        type: 'info',
        title: 'Refreshing Session',
        message: 'Updating your session...',
        persistent: false,
        showSpinner: true,
      };
    }

    return null;
  }, [isRefreshing, refreshError, expiryWarning, sessionExpired, clearError, clearWarning, clearSessionExpired]);

  return {
    notification: getNotification(),
    isRefreshing,
    hasError: !!refreshError,
    hasWarning: !!expiryWarning,
    isSessionExpired: sessionExpired,
  };
};

export default useTokenRefresh;
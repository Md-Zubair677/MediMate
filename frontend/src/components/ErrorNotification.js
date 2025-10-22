/*
 * Error notification components for displaying user-friendly error messages.
 * Integrates with the error handling system to show notifications and recovery options.
 */

import React, { useState, useEffect } from 'react';
import { errorNotificationManager, ERROR_SEVERITY } from '../utils/error_handler';

/*
 * Individual notification component
 */
const NotificationItem = ({ notification, onDismiss, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getSeverityStyles = () => {
    switch (notification.severity) {
      case ERROR_SEVERITY.CRITICAL:
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      case ERROR_SEVERITY.HIGH:
        return {
          container: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-400',
          title: 'text-orange-800',
          message: 'text-orange-700',
          button: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        };
      case ERROR_SEVERITY.MEDIUM:
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        };
      case ERROR_SEVERITY.LOW:
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
    }
  };

  const styles = getSeverityStyles();

  const getIcon = () => {
    switch (notification.severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return (
          <svg className={`h-5 w-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case ERROR_SEVERITY.MEDIUM:
        return (
          <svg className={`h-5 w-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case ERROR_SEVERITY.LOW:
      default:
        return (
          <svg className={`h-5 w-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full ${styles.container} border rounded-lg shadow-lg pointer-events-auto
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {notification.title && (
              <p className={`text-sm font-medium ${styles.title}`}>
                {notification.title}
              </p>
            )}
            
            <p className={`text-sm ${styles.message} ${notification.title ? 'mt-1' : ''}`}>
              {notification.message}
            </p>

            {/* Recovery Suggestions */}
            {notification.suggestions && notification.suggestions.length > 0 && (
              <div className="mt-3">
                <p className={`text-xs font-medium ${styles.title} mb-1`}>
                  Try these solutions:
                </p>
                <ul className={`text-xs ${styles.message} space-y-1`}>
                  {notification.suggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            {(notification.onRetry || notification.onAction) && (
              <div className="mt-3 flex space-x-2">
                {notification.onRetry && (
                  <button
                    onClick={() => {
                      notification.onRetry();
                      handleDismiss();
                    }}
                    className={`text-xs px-2 py-1 rounded ${styles.button} transition-colors`}
                  >
                    Try Again
                  </button>
                )}
                
                {notification.onAction && (
                  <button
                    onClick={() => {
                      notification.onAction();
                      handleDismiss();
                    }}
                    className={`text-xs px-2 py-1 rounded ${styles.button} transition-colors`}
                  >
                    {notification.actionLabel || 'Fix'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`inline-flex ${styles.message} hover:${styles.title} transition-colors`}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/*
 * Main notification container component
 */
const ErrorNotificationContainer = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to notification updates
    const handleNotificationUpdate = (updatedNotifications) => {
      setNotifications(updatedNotifications);
    };

    errorNotificationManager.addListener(handleNotificationUpdate);

    // Get initial notifications
    setNotifications(errorNotificationManager.getNotifications());

    return () => {
      errorNotificationManager.removeListener(handleNotificationUpdate);
    };
  }, []);

  const handleDismiss = (notificationId) => {
    errorNotificationManager.dismiss(notificationId);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

/*
 * Inline error message component for forms and specific areas
 */
export const InlineErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  showSuggestions = true 
}) => {
  if (!error) return null;

  const { type, severity } = error.category || { type: 'UNKNOWN_ERROR', severity: ERROR_SEVERITY.MEDIUM };
  
  const getSeverityStyles = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return 'bg-red-50 border-red-200 text-red-700';
      case ERROR_SEVERITY.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case ERROR_SEVERITY.LOW:
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className={`border rounded-md p-3 ${getSeverityStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            {error.message || 'An error occurred'}
          </p>
          
          {showSuggestions && error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Suggestions:</p>
              <ul className="text-xs space-y-1">
                {error.suggestions.slice(0, 2).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {onRetry && (
            <div className="mt-2">
              <button
                onClick={onRetry}
                className="text-xs underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <div className="ml-2 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="hover:opacity-75"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/*
 * Offline indicator component
 */
export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
        </svg>
        <span className="text-sm font-medium">
          You're offline. Some features may not be available.
        </span>
      </div>
    </div>
  );
};

/*
 * Loading error component for failed data fetches
 */
export const LoadingError = ({ 
  error, 
  onRetry, 
  title = "Failed to load data",
  description = "We couldn't load the requested information. Please try again.",
  className = ""
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {description}
      </p>
      
      {error && (
        <p className="text-sm text-red-600 mb-4">
          {error.message || 'Unknown error occurred'}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

/*
 * React hook for managing error notifications
 */
export const useErrorNotification = () => {
  const showError = (error, options = {}) => {
    return errorNotificationManager.notify(error, options);
  };

  const showSuccess = (message, options = {}) => {
    return errorNotificationManager.notify(
      { message },
      {
        severity: ERROR_SEVERITY.LOW,
        type: 'SUCCESS',
        ...options
      }
    );
  };

  const showWarning = (message, options = {}) => {
    return errorNotificationManager.notify(
      { message },
      {
        severity: ERROR_SEVERITY.MEDIUM,
        type: 'WARNING',
        ...options
      }
    );
  };

  const dismissNotification = (id) => {
    errorNotificationManager.dismiss(id);
  };

  const clearAll = () => {
    errorNotificationManager.clear();
  };

  return {
    showError,
    showSuccess,
    showWarning,
    dismissNotification,
    clearAll
  };
};

export default ErrorNotificationContainer;

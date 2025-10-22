/*
 * Frontend error handling utilities for MediMate platform.
 * Provides network error retry logic, user notifications, and error recovery.
 */

import React from 'react';
import axios from 'axios';

/*
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'AUTHZ_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/*
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/*
 * Network status detection
 */
class NetworkMonitor {
  constructor() {
    // Check if running in browser environment
    this.isOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = [];
    
    // Listen for online/offline events only in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners(true);
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners(false);
      });
    }
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notifyListeners(isOnline) {
    this.listeners.forEach(callback => callback(isOnline));
  }
  
  getStatus() {
    return this.isOnline;
  }
}

// Global network monitor instance
export const networkMonitor = new NetworkMonitor();

/*
 * Retry configuration for different error types
 */
const RETRY_CONFIG = {
  [ERROR_TYPES.NETWORK]: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true
  },
  [ERROR_TYPES.SERVER]: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffFactor: 2,
    jitter: true
  },
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: {
    maxRetries: 3,
    baseDelay: 5000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    maxRetries: 2,
    baseDelay: 10000,
    maxDelay: 60000,
    backoffFactor: 1.5,
    jitter: false
  }
};

/*
 * Categorize error based on response
 */
export const categorizeError = (error) => {
  if (!error.response) {
    // Network error (no response received)
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.MEDIUM };
    }
    if (error.code === 'ERR_NETWORK' || !networkMonitor.getStatus()) {
      return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.HIGH };
    }
    return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
  }
  
  const status = error.response.status;
  
  switch (status) {
    case 401:
      return { type: ERROR_TYPES.AUTHENTICATION, severity: ERROR_SEVERITY.HIGH };
    case 403:
      return { type: ERROR_TYPES.AUTHORIZATION, severity: ERROR_SEVERITY.HIGH };
    case 404:
      return { type: ERROR_TYPES.NOT_FOUND, severity: ERROR_SEVERITY.LOW };
    case 422:
      return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.LOW };
    case 429:
      return { type: ERROR_TYPES.RATE_LIMIT, severity: ERROR_SEVERITY.MEDIUM };
    case 500:
    case 502:
    case 503:
      return { type: ERROR_TYPES.SERVICE_UNAVAILABLE, severity: ERROR_SEVERITY.HIGH };
    case 504:
      return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.MEDIUM };
    default:
      if (status >= 400 && status < 500) {
        return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.LOW };
      }
      if (status >= 500) {
        return { type: ERROR_TYPES.SERVER, severity: ERROR_SEVERITY.HIGH };
      }
      return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
  }
};

/*
 * Calculate retry delay with exponential backoff and jitter
 */
const calculateRetryDelay = (attempt, config) => {
  const { baseDelay, maxDelay, backoffFactor, jitter } = config;
  
  let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  
  if (jitter) {
    // Add ±25% jitter to prevent thundering herd
    const jitterAmount = delay * 0.25;
    delay += (Math.random() - 0.5) * 2 * jitterAmount;
  }
  
  return Math.min(delay, maxDelay);
};

/*
 * Check if error should be retried
 */
const shouldRetry = (error, attempt, maxRetries) => {
  if (attempt >= maxRetries) {
    return false;
  }
  
  const { type } = categorizeError(error);
  
  // Don't retry authentication, authorization, or validation errors
  if ([ERROR_TYPES.AUTHENTICATION, ERROR_TYPES.AUTHORIZATION, ERROR_TYPES.VALIDATION, ERROR_TYPES.NOT_FOUND].includes(type)) {
    return false;
  }
  
  // Don't retry if offline
  if (!networkMonitor.getStatus()) {
    return false;
  }
  
  return true;
};

/*
 * Retry function with exponential backoff
 */
export const retryRequest = async (requestFn, options = {}) => {
  const { 
    maxRetries = 3, 
    onRetry = null, 
    onError = null,
    customRetryConfig = null 
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (!shouldRetry(error, attempt, maxRetries)) {
        break;
      }
      
      const { type } = categorizeError(error);
      const retryConfig = customRetryConfig || RETRY_CONFIG[type] || RETRY_CONFIG[ERROR_TYPES.NETWORK];
      
      const delay = calculateRetryDelay(attempt, retryConfig);
      
      console.warn(`Request failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
      
      if (onRetry) {
        onRetry(error, attempt, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  if (onError) {
    onError(lastError);
  }
  
  throw lastError;
};

/*
 * Enhanced axios instance with retry logic and token refresh support
 */
export const createRetryAxios = (baseConfig = {}) => {
  const instance = axios.create({
    timeout: 10000,
    ...baseConfig
  });
  
  // Import token utilities dynamically to avoid circular dependencies
  let getStoredToken, refreshAccessToken, logout;
  
  try {
    const authModule = require('./auth');
    getStoredToken = authModule.getStoredToken;
    refreshAccessToken = authModule.refreshAccessToken;
    logout = authModule.logout;
  } catch (error) {
    console.warn('Could not import auth utilities for retry axios instance');
  }
  
  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add auth token if available
      if (getStoredToken) {
        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      // Add request timestamp for performance monitoring
      config.metadata = { startTime: Date.now() };
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor with retry logic and token refresh
  instance.interceptors.response.use(
    (response) => {
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - response.config.metadata.startTime;
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
      }
      return response;
    },
    async (error) => {
      const { config } = error;
      
      // Handle token refresh for 401 errors
      if (error.response?.status === 401 && !config._tokenRefreshRetry && refreshAccessToken) {
        config._tokenRefreshRetry = true;
        
        try {
          const refreshed = await refreshAccessToken();
          if (refreshed && getStoredToken) {
            const newToken = getStoredToken();
            config.headers.Authorization = `Bearer ${newToken}`;
            return instance(config);
          }
        } catch (refreshError) {
          console.error('Token refresh failed in retry axios:', refreshError);
          if (logout) {
            await logout();
          }
        }
      }
      
      // Don't retry if already retried or retry is disabled
      if (config.__retryCount || config.disableRetry) {
        return Promise.reject(error);
      }
      
      const { type } = categorizeError(error);
      const retryConfig = RETRY_CONFIG[type];
      
      if (!retryConfig || !shouldRetry(error, 1, retryConfig.maxRetries)) {
        return Promise.reject(error);
      }
      
      // Initialize retry count
      config.__retryCount = 1;
      
      try {
        return await retryRequest(
          () => instance(config),
          {
            maxRetries: retryConfig.maxRetries - 1, // -1 because we already tried once
            customRetryConfig: retryConfig
          }
        );
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
  );
  
  return instance;
};

/*
 * User-friendly error messages
 */
export const getErrorMessage = (error) => {
  const { type, severity } = categorizeError(error);
  
  // Check for custom error message from backend
  const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;
  
  if (backendMessage && !backendMessage.includes('Internal') && !backendMessage.includes('Unexpected')) {
    return backendMessage;
  }
  
  // Default messages based on error type
  const messages = {
    [ERROR_TYPES.NETWORK]: (typeof window !== 'undefined' && networkMonitor.getStatus()) 
      ? "Connection problem. Please check your internet connection and try again."
      : "You appear to be offline. Please check your internet connection.",
    [ERROR_TYPES.AUTHENTICATION]: "Please log in to continue.",
    [ERROR_TYPES.AUTHORIZATION]: "You don't have permission to perform this action.",
    [ERROR_TYPES.VALIDATION]: "Please check your input and try again.",
    [ERROR_TYPES.NOT_FOUND]: "The requested information could not be found.",
    [ERROR_TYPES.SERVER]: "We're experiencing technical difficulties. Please try again in a few moments.",
    [ERROR_TYPES.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again later.",
    [ERROR_TYPES.RATE_LIMIT]: "Too many requests. Please wait a moment before trying again.",
    [ERROR_TYPES.UNKNOWN]: "Something went wrong. Please try again."
  };
  
  return messages[type] || messages[ERROR_TYPES.UNKNOWN];
};

/*
 * Get recovery suggestions for errors
 */
export const getRecoverySuggestions = (error) => {
  const { type } = categorizeError(error);
  
  const suggestions = {
    [ERROR_TYPES.NETWORK]: [
      "Check your internet connection",
      "Try refreshing the page",
      "Switch to a different network if available"
    ],
    [ERROR_TYPES.AUTHENTICATION]: [
      "Log in again",
      "Clear your browser cache and cookies",
      "Reset your password if needed"
    ],
    [ERROR_TYPES.AUTHORIZATION]: [
      "Contact your administrator for access",
      "Log in with a different account",
      "Check if your account has the required permissions"
    ],
    [ERROR_TYPES.VALIDATION]: [
      "Review the form for errors",
      "Check required fields",
      "Ensure data formats are correct"
    ],
    [ERROR_TYPES.NOT_FOUND]: [
      "Check the URL for typos",
      "Go back and try again",
      "Use the navigation menu to find what you're looking for"
    ],
    [ERROR_TYPES.SERVER]: [
      "Wait a few minutes and try again",
      "Refresh the page",
      "Contact support if the problem persists"
    ],
    [ERROR_TYPES.SERVICE_UNAVAILABLE]: [
      "Try again in a few minutes",
      "Check our status page for updates",
      "Contact support if urgent"
    ],
    [ERROR_TYPES.RATE_LIMIT]: [
      "Wait a moment before trying again",
      "Reduce the frequency of your requests",
      "Try again later"
    ],
    [ERROR_TYPES.UNKNOWN]: [
      "Refresh the page",
      "Try again in a few minutes",
      "Contact support if the problem continues"
    ]
  };
  
  return suggestions[type] || suggestions[ERROR_TYPES.UNKNOWN];
};

/*
 * Notification system for errors
 */
class ErrorNotificationManager {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.maxNotifications = 5;
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notify(error, options = {}) {
    const { type, severity } = categorizeError(error);
    
    const notification = {
      id: Date.now() + Math.random(),
      type,
      severity,
      message: getErrorMessage(error),
      suggestions: getRecoverySuggestions(error),
      timestamp: new Date(),
      dismissed: false,
      autoHide: options.autoHide !== false && severity !== ERROR_SEVERITY.CRITICAL,
      hideDelay: options.hideDelay || (severity === ERROR_SEVERITY.LOW ? 3000 : 5000),
      ...options
    };
    
    // Add notification
    this.notifications.unshift(notification);
    
    // Limit number of notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
    
    // Notify listeners
    this.listeners.forEach(callback => callback(this.notifications));
    
    // Auto-hide if configured
    if (notification.autoHide) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.hideDelay);
    }
    
    return notification.id;
  }
  
  dismiss(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications[index].dismissed = true;
      this.notifications.splice(index, 1);
      this.listeners.forEach(callback => callback(this.notifications));
    }
  }
  
  clear() {
    this.notifications = [];
    this.listeners.forEach(callback => callback(this.notifications));
  }
  
  getNotifications() {
    return this.notifications;
  }
}

// Global notification manager
export const errorNotificationManager = new ErrorNotificationManager();

/*
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = () => {
  // Only setup in browser environment
  if (typeof window === 'undefined') return;
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Try to extract error information
    const error = event.reason;
    
    if (error && (error.response || error.message)) {
      errorNotificationManager.notify(error, {
        title: 'Unexpected Error',
        autoHide: false
      });
    }
    
    // Prevent default browser error handling
    event.preventDefault();
  });
  
  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    
    // Only show notification for critical errors
    if (event.error && event.error.stack) {
      errorNotificationManager.notify(new Error(event.message), {
        title: 'Application Error',
        severity: ERROR_SEVERITY.HIGH,
        autoHide: false
      });
    }
  });
};

/*
 * Offline mode utilities
 */
export const offlineUtils = {
  /*
   * Check if currently offline
   */
  isOffline: () => !networkMonitor.getStatus(),
  
  /*
   * Get cached data for offline mode
   */
  getCachedData: (key) => {
    try {
      const cached = localStorage.getItem(`medimate_cache_${key}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.value;
        }
      }
    } catch (error) {
      console.warn('Error reading cached data:', error);
    }
    return null;
  },
  
  /*
   * Cache data for offline mode
   */
  setCachedData: (key, value) => {
    try {
      const data = {
        value,
        timestamp: Date.now()
      };
      localStorage.setItem(`medimate_cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Error caching data:', error);
    }
  },
  
  /*
   * Clear cached data
   */
  clearCache: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('medimate_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }
};

/*
 * React hook for error handling
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  const handleError = React.useCallback((error, options = {}) => {
    setError(error);
    
    if (options.showNotification !== false) {
      errorNotificationManager.notify(error, options);
    }
  }, []);
  
  const retry = React.useCallback(async (retryFn) => {
    if (!retryFn) return;
    
    setIsRetrying(true);
    try {
      await retryFn();
      setError(null);
    } catch (error) {
      handleError(error);
    } finally {
      setIsRetrying(false);
    }
  }, [handleError]);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError,
    errorMessage: error ? getErrorMessage(error) : null,
    recoverySuggestions: error ? getRecoverySuggestions(error) : []
  };
};

// Default export
export default {
  ERROR_TYPES,
  ERROR_SEVERITY,
  networkMonitor,
  categorizeError,
  retryRequest,
  createRetryAxios,
  getErrorMessage,
  getRecoverySuggestions,
  errorNotificationManager,
  setupGlobalErrorHandling,
  offlineUtils,
  useErrorHandler
};

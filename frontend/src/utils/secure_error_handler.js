/*
 * Secure error handler - Fixed code injection vulnerabilities
 */

import React from 'react';
import axios from 'axios';

// Secure error types
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

// Secure network monitor without browser-only APIs
class SecureNetworkMonitor {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
    
    // Only use browser APIs if available
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      
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
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notifyListeners(isOnline) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.warn('Error in network listener:', error);
      }
    });
  }
  
  getStatus() {
    return this.isOnline;
  }
}

export const networkMonitor = new SecureNetworkMonitor();

// Secure error categorization
export const categorizeError = (error) => {
  if (!error || typeof error !== 'object') {
    return { type: ERROR_TYPES.UNKNOWN, severity: 'medium' };
  }

  if (!error.response) {
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      return { type: ERROR_TYPES.NETWORK, severity: 'medium' };
    }
    if (error.code === 'ERR_NETWORK' || !networkMonitor.getStatus()) {
      return { type: ERROR_TYPES.NETWORK, severity: 'high' };
    }
    return { type: ERROR_TYPES.UNKNOWN, severity: 'medium' };
  }
  
  const status = error.response.status;
  
  switch (status) {
    case 401:
      return { type: ERROR_TYPES.AUTHENTICATION, severity: 'high' };
    case 403:
      return { type: ERROR_TYPES.AUTHORIZATION, severity: 'high' };
    case 404:
      return { type: ERROR_TYPES.NOT_FOUND, severity: 'low' };
    case 422:
      return { type: ERROR_TYPES.VALIDATION, severity: 'low' };
    case 429:
      return { type: ERROR_TYPES.RATE_LIMIT, severity: 'medium' };
    case 500:
    case 502:
    case 503:
      return { type: ERROR_TYPES.SERVICE_UNAVAILABLE, severity: 'high' };
    case 504:
      return { type: ERROR_TYPES.NETWORK, severity: 'medium' };
    default:
      if (status >= 400 && status < 500) {
        return { type: ERROR_TYPES.VALIDATION, severity: 'low' };
      }
      if (status >= 500) {
        return { type: ERROR_TYPES.SERVER, severity: 'high' };
      }
      return { type: ERROR_TYPES.UNKNOWN, severity: 'medium' };
  }
};

// Secure retry logic
export const retryRequest = async (requestFn, options = {}) => {
  const { maxRetries = 3, onRetry = null, onError = null } = options;
  
  if (typeof requestFn !== 'function') {
    throw new Error('Request function is required');
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      const { type } = categorizeError(error);
      
      // Don't retry certain error types
      if ([ERROR_TYPES.AUTHENTICATION, ERROR_TYPES.AUTHORIZATION, ERROR_TYPES.VALIDATION, ERROR_TYPES.NOT_FOUND].includes(type)) {
        break;
      }
      
      if (attempt > maxRetries) {
        break;
      }
      
      // Calculate delay with jitter
      const baseDelay = 1000 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = Math.min(baseDelay + jitter, 10000);
      
      console.warn(`Request failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms`);
      
      if (onRetry && typeof onRetry === 'function') {
        try {
          onRetry(error, attempt, delay);
        } catch (callbackError) {
          console.warn('Error in retry callback:', callbackError);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  if (onError && typeof onError === 'function') {
    try {
      onError(lastError);
    } catch (callbackError) {
      console.warn('Error in error callback:', callbackError);
    }
  }
  
  throw lastError;
};

// Secure axios instance
export const createSecureAxios = (baseConfig = {}) => {
  const instance = axios.create({
    timeout: 10000,
    ...baseConfig
  });
  
  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add timestamp for monitoring
      config.metadata = { startTime: Date.now() };
      
      // Validate URL to prevent SSRF
      if (config.url && typeof config.url === 'string') {
        const url = new URL(config.url, config.baseURL);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid URL protocol');
        }
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - response.config.metadata.startTime;
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
      }
      return response;
    },
    (error) => {
      const { config } = error;
      
      // Don't retry if already retried
      if (config.__retryCount) {
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// Secure error messages
export const getSecureErrorMessage = (error) => {
  const { type } = categorizeError(error);
  
  // Don't expose internal error details
  const messages = {
    [ERROR_TYPES.NETWORK]: "Connection problem. Please check your internet connection.",
    [ERROR_TYPES.AUTHENTICATION]: "Please log in to continue.",
    [ERROR_TYPES.AUTHORIZATION]: "You don't have permission to perform this action.",
    [ERROR_TYPES.VALIDATION]: "Please check your input and try again.",
    [ERROR_TYPES.NOT_FOUND]: "The requested information could not be found.",
    [ERROR_TYPES.SERVER]: "We're experiencing technical difficulties. Please try again later.",
    [ERROR_TYPES.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again later.",
    [ERROR_TYPES.RATE_LIMIT]: "Too many requests. Please wait a moment before trying again.",
    [ERROR_TYPES.UNKNOWN]: "Something went wrong. Please try again."
  };
  
  return messages[type] || messages[ERROR_TYPES.UNKNOWN];
};

// Secure React hook
export const useSecureErrorHandler = () => {
  const [error, setError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  const handleError = React.useCallback((error, options = {}) => {
    // Sanitize error before setting
    const sanitizedError = {
      message: getSecureErrorMessage(error),
      type: categorizeError(error).type,
      timestamp: new Date().toISOString()
    };
    
    setError(sanitizedError);
  }, []);
  
  const retry = React.useCallback(async (retryFn) => {
    if (typeof retryFn !== 'function') {
      return;
    }
    
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
    clearError
  };
};

export default {
  ERROR_TYPES,
  networkMonitor,
  categorizeError,
  retryRequest,
  createSecureAxios,
  getSecureErrorMessage,
  useSecureErrorHandler
};
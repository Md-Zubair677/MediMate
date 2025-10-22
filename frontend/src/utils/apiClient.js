/
 * Centralized API client with automatic token refresh handling
 * All API calls should use this client to ensure proper authentication
 */

import axios from 'axios';
import { getStoredToken, refreshAccessToken, logout } from './auth';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

/
 * Token refresh state management (shared with auth.js)
 */
let isRefreshing = false;
let refreshPromise = null;
let failedQueue = [];

/
 * Process failed queue after token refresh
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

/
 * Create the main API client instance
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

/
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for monitoring
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/
 * Response interceptor to handle token expiration and refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          } else {
            return Promise.reject(error);
          }
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      // Start refresh process
      isRefreshing = true;
      
      try {
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
          const newToken = getStoredToken();
          processQueue(null, newToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          // Refresh failed
          processQueue(error, null);
          
          console.log('Token refresh failed, redirecting to login');
          await logout();
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.error('Token refresh error in API client:', refreshError);
        
        await logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      const duration = error.config?.metadata?.startTime 
        ? Date.now() - error.config.metadata.startTime 
        : 0;
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`, error.message);
    }
    
    return Promise.reject(error);
  }
);

/
 * API endpoints organized by feature
 */
export const api = {
  // Authentication endpoints
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    register: (userData) => apiClient.post('/api/auth/register', userData),
    logout: () => apiClient.post('/api/auth/logout'),
    refreshToken: (refreshToken) => apiClient.post('/api/auth/refresh-token', { refresh_token: refreshToken }),
    validateToken: () => apiClient.post('/api/auth/validate-token'),
    forgotPassword: (email) => apiClient.post('/api/auth/forgot-password', { email }),
    resetPassword: (data) => apiClient.post('/api/auth/reset-password', data),
    confirmRegistration: (data) => apiClient.post('/api/auth/confirm-registration', data),
    resendVerification: (email) => apiClient.post('/api/auth/resend-verification', { email }),
    getProfile: () => apiClient.get('/api/auth/me'),
    updateProfile: (data) => apiClient.put('/api/auth/me', data),
  },
  
  // Chat/AI consultation endpoints
  chat: {
    sendMessage: (message, patientId) => apiClient.post('/api/chat', {
      message,
      patient_id: patientId,
    }),
    getHistory: (patientId) => apiClient.get(`/api/chat/history/${patientId}`),
  },
  
  // Appointment management endpoints
  appointments: {
    create: (appointmentData) => apiClient.post('/api/appointments', appointmentData),
    getByPatient: (patientId) => apiClient.get(`/api/appointments/${patientId}`),
    getAll: () => apiClient.get('/api/appointments'),
    update: (appointmentId, data) => apiClient.put(`/api/appointments/${appointmentId}`, data),
    cancel: (appointmentId) => apiClient.delete(`/api/appointments/${appointmentId}`),
    getDoctors: () => apiClient.get('/api/doctors'),
    getAvailableSlots: (doctorId, date) => apiClient.get(`/api/doctors/${doctorId}/slots`, {
      params: { date }
    }),
  },
  
  // Medical reports/document analysis endpoints
  reports: {
    analyze: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiClient.post('/api/reports/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file processing
      });
    },
    getHistory: (patientId) => apiClient.get(`/api/reports/history/${patientId}`),
    getReport: (reportId) => apiClient.get(`/api/reports/${reportId}`),
  },
  
  // Health check endpoint
  health: {
    check: () => apiClient.get('/api/health'),
  },
};

/
 * Utility functions for common API patterns
 */
export const apiUtils = {
  /
   * Handle API errors consistently
   */
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 
                     error.response.data?.detail || 
                     `Server error: ${error.response.status}`;
      return new Error(message);
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network error: Please check your internet connection');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  },
  
  /
   * Extract error message from API response
   */
  getErrorMessage: (error) => {
    return apiUtils.handleError(error).message;
  },
  
  /
   * Check if error is due to authentication
   */
  isAuthError: (error) => {
    return error.response?.status === 401;
  },
  
  /
   * Check if error is due to network issues
   */
  isNetworkError: (error) => {
    return !error.response && error.request;
  },
  
  /
   * Retry API call with exponential backoff
   */
  retryRequest: async (requestFn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry auth errors or client errors (4xx)
        if (apiUtils.isAuthError(error) || 
            (error.response?.status >= 400 && error.response?.status < 500)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`API request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  },
};

// Export the main client for direct use if needed
export default apiClient;
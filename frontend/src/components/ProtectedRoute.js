/
 * Protected Route component for MediMate frontend.
 * Handles authentication checks and redirects for protected pages.
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAuthStatus } from '../utils/auth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        
        setAuthState({
          loading: false,
          authenticated: authStatus.authenticated,
          user: authStatus.user,
        });
      } catch (error) {
        console.error('Auth verification error:', error);
        setAuthState({
          loading: false,
          authenticated: false,
          user: null,
        });
      }
    };

    verifyAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authState.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (requiredRole && authState.user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            This page requires {requiredRole} access. Your current role is {authState.user?.role}.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
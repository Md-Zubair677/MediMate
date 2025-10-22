/
 * Authentication Context Provider
 * Provides authentication state and methods to the entire application
 */

import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

// Create the authentication context
const AuthContext = createContext(null);

/
 * Authentication Context Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/
 * Higher-order component to protect routes that require authentication
 * @param {React.Component} Component - Component to protect
 * @returns {React.Component} Protected component
 */
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, user } = useAuthContext();
    
    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #f0fdfa 100%)',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              Initializing authentication...
            </p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated || !user) {
      // Redirect to login or show login component
      return null; // This should be handled by the main app routing
    }
    
    return <Component {...props} />;
  };
};

/
 * Component to show loading state during authentication initialization
 */
export const AuthLoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #f0fdfa 100%)',
      fontFamily: "'Inter', 'Poppins', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '1.5rem',
        padding: '3rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid #e5e7eb',
          borderTop: '6px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem',
        }} />
        
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem',
        }}>
          MediMate
        </h2>
        
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          marginBottom: '1rem',
        }}>
          Initializing secure authentication...
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3b82f6',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3b82f6',
            animation: 'pulse 1.5s ease-in-out infinite 0.2s',
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3b82f6',
            animation: 'pulse 1.5s ease-in-out infinite 0.4s',
          }} />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AuthContext;
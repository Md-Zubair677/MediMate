import React, { useState, useEffect } from 'react';
import { confirmRegistration, resendVerificationCode } from '../utils/auth';

const EmailVerificationForm = ({ 
  email, 
  onVerificationSuccess, 
  onBack, 
  darkMode = false 
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await confirmRegistration(email, verificationCode);
      
      if (result.success) {
        setSuccess(result.message);
        
        // Check if auto sign-in was successful
        if (result.autoSignIn && result.autoSignIn.success) {
          // User is automatically signed in, proceed to main app
          console.log('Auto sign-in successful after email verification');
          setTimeout(() => {
            onVerificationSuccess(result.autoSignIn.user);
          }, 1500);
        } else {
          // Email verified but not auto signed in, show success message
          setTimeout(() => {
            onBack();
          }, 2000);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError('Email verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await resendVerificationCode(email);
      
      if (result.success) {
        setSuccess(result.message);
        setResendCooldown(60); // 60 second cooldown
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError('');
  };

  return (
    <div style={{
      background: darkMode
        ? 'rgba(15, 23, 42, 0.25)'
        : 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(16px)',
      borderRadius: '2rem',
      boxShadow: darkMode
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      padding: '2rem',
      border: darkMode
        ? '1px solid rgba(255, 255, 255, 0.2)'
        : '1px solid rgba(255, 255, 255, 0.3)',
      maxWidth: '32rem',
      width: '100%'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          📧
        </div>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 'bold', 
          color: darkMode ? '#f8fafc' : '#1f2937', 
          marginBottom: '0.5rem' 
        }}>
          Verify Your Email
        </h2>
        <p style={{ 
          color: darkMode ? '#cbd5e1' : '#6b7280',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          We've sent a 6-digit verification code to
        </p>
        <p style={{ 
          color: darkMode ? '#f8fafc' : '#1f2937',
          fontWeight: '600',
          fontSize: '1.1rem',
          marginTop: '0.5rem'
        }}>
          {email}
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#dc2626',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#16a34a',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: darkMode ? '#e2e8f0' : '#374151',
            marginBottom: '0.5rem'
          }}>
            Verification Code
          </label>
          <input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={handleCodeChange}
            style={{
              width: '100%',
              padding: '1rem',
              border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '1rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              outline: 'none',
              background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
              color: darkMode ? '#f8fafc' : '#1f2937',
              transition: 'all 0.3s ease',
              fontFamily: 'monospace'
            }}
            required
            maxLength={6}
            autoComplete="one-time-code"
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <p style={{
            fontSize: '0.8rem',
            color: darkMode ? '#94a3b8' : '#6b7280',
            marginTop: '0.5rem',
            textAlign: 'center'
          }}>
            Enter the 6-digit code from your email
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || verificationCode.length < 6}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            background: isLoading || verificationCode.length < 6 
              ? 'rgba(156, 163, 175, 0.5)' 
              : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            color: 'white',
            borderRadius: '1rem',
            fontWeight: '600',
            border: 'none',
            cursor: isLoading || verificationCode.length < 6 ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            boxShadow: isLoading || verificationCode.length < 6 
              ? 'none' 
              : '0 10px 25px rgba(59, 130, 246, 0.3)',
            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && verificationCode.length >= 6) {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && verificationCode.length >= 6) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
            }
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Verifying...
            </div>
          ) : (
            'Verify Email'
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || resendCooldown > 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              color: resendCooldown > 0 ? '#9ca3af' : '#3b82f6',
              background: 'transparent',
              border: `1px solid ${resendCooldown > 0 ? '#d1d5db' : '#3b82f6'}`,
              borderRadius: '0.75rem',
              cursor: isLoading || resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && resendCooldown === 0) {
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && resendCooldown === 0) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            {resendCooldown > 0 
              ? `Resend code in ${resendCooldown}s` 
              : 'Resend verification code'
            }
          </button>
          
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '100%',
              padding: '0.75rem',
              color: darkMode ? '#94a3b8' : '#6b7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            Back to Login
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationForm;
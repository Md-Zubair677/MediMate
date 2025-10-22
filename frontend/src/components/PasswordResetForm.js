import React, { useState, useEffect } from 'react';
import { forgotPassword, resetPassword } from '../utils/auth';

const PasswordResetForm = ({ 
  onBack, 
  darkMode = false 
}) => {
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSuccess(result.message);
        setStep('reset');
        setResendCooldown(60); // 60 second cooldown
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetCode || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await resetPassword(email, resetCode, newPassword);
      
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Password reset failed. Please try again.');
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
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSuccess('Reset code sent to your email');
        setResendCooldown(60);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Resend reset code error:', error);
      setError('Failed to resend reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Very Weak', color: '#ef4444' };
      case 2: return { text: 'Weak', color: '#f97316' };
      case 3: return { text: 'Fair', color: '#eab308' };
      case 4: return { text: 'Good', color: '#22c55e' };
      case 5: return { text: 'Strong', color: '#16a34a' };
      default: return { text: 'Very Weak', color: '#ef4444' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

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
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {step === 'email' ? '🔐' : '🔑'}
        </div>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 'bold', 
          color: darkMode ? '#f8fafc' : '#1f2937', 
          marginBottom: '0.5rem' 
        }}>
          {step === 'email' ? 'Reset Password' : 'Create New Password'}
        </h2>
        <p style={{ 
          color: darkMode ? '#cbd5e1' : '#6b7280',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          {step === 'email' 
            ? 'Enter your email to receive reset instructions'
            : 'Enter the code from your email and create a new password'
          }
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

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: darkMode ? '#e2e8f0' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '1rem',
                fontSize: '1rem',
                outline: 'none',
                background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: darkMode ? '#f8fafc' : '#1f2937',
                transition: 'all 0.3s ease'
              }}
              required
              onFocus={(e) => {
                e.target.style.borderColor = '#f59e0b';
                e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              background: isLoading || !email 
                ? 'rgba(156, 163, 175, 0.5)' 
                : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              borderRadius: '1rem',
              fontWeight: '600',
              border: 'none',
              cursor: isLoading || !email ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: isLoading || !email 
                ? 'none' 
                : '0 10px 25px rgba(245, 158, 11, 0.3)',
              transform: isLoading ? 'scale(0.98)' : 'scale(1)'
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
                Sending...
              </div>
            ) : (
              'Send Reset Code'
            )}
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
        </form>
      ) : (
        <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: darkMode ? '#e2e8f0' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Reset Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={resetCode}
              onChange={(e) => {
                setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '1rem',
                fontSize: '1rem',
                outline: 'none',
                background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: darkMode ? '#f8fafc' : '#1f2937',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                letterSpacing: '0.2rem',
                fontFamily: 'monospace'
              }}
              required
              maxLength={6}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: darkMode ? '#e2e8f0' : '#374151',
              marginBottom: '0.5rem'
            }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '1rem',
                fontSize: '1rem',
                outline: 'none',
                background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: darkMode ? '#f8fafc' : '#1f2937',
                transition: 'all 0.3s ease'
              }}
              required
              minLength={8}
            />
            {newPassword && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ color: strengthInfo.color, fontWeight: '600' }}>
                    {strengthInfo.text}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      height: '100%',
                      background: strengthInfo.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: darkMode ? '#e2e8f0' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${
                  confirmPassword && newPassword !== confirmPassword 
                    ? '#ef4444' 
                    : darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }`,
                borderRadius: '1rem',
                fontSize: '1rem',
                outline: 'none',
                background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: darkMode ? '#f8fafc' : '#1f2937',
                transition: 'all 0.3s ease'
              }}
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{
                fontSize: '0.8rem',
                color: '#ef4444',
                marginTop: '0.5rem'
              }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !resetCode || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              background: isLoading || !resetCode || !newPassword || !confirmPassword || newPassword !== confirmPassword
                ? 'rgba(156, 163, 175, 0.5)' 
                : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              borderRadius: '1rem',
              fontWeight: '600',
              border: 'none',
              cursor: isLoading || !resetCode || !newPassword || !confirmPassword || newPassword !== confirmPassword ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: isLoading || !resetCode || !newPassword || !confirmPassword || newPassword !== confirmPassword
                ? 'none' 
                : '0 10px 25px rgba(245, 158, 11, 0.3)'
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
                Resetting...
              </div>
            ) : (
              'Reset Password'
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
                color: resendCooldown > 0 ? '#9ca3af' : '#f59e0b',
                background: 'transparent',
                border: `1px solid ${resendCooldown > 0 ? '#d1d5db' : '#f59e0b'}`,
                borderRadius: '0.75rem',
                cursor: isLoading || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              {resendCooldown > 0 
                ? `Resend code in ${resendCooldown}s` 
                : 'Resend reset code'
              }
            </button>
            
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setResetCode('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setSuccess('');
              }}
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
              Change Email
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PasswordResetForm;
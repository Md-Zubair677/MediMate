import React, { useState } from 'react';
import SignupPage from './SignupPage';
import { signIn } from '../utils/auth';

const LoginPageNew = ({ onNext }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [activeRole, setActiveRole] = useState('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    doctorId: '',
    adminKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  if (showSignup) {
    return <SignupPage onNext={onNext} onBack={() => setShowSignup(false)} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Please enter both email and password');
      return;
    }
    
    try {
      // Try Cognito authentication first
      const result = await signIn(formData.email, formData.password);
      
      onNext({
        id: result.username,
        name: result.attributes?.name || 'User',
        email: result.attributes?.email || formData.email,
        role: result.attributes?.['custom:role'] || activeRole,
        cognitoUser: result
      });
    } catch (error) {
      console.log('Authentication failed:', error);
      
      if (error.code === 'UserNotConfirmedException') {
        alert('Please check your email and confirm your account before logging in.');
      } else if (error.code === 'NotAuthorizedException') {
        alert('Invalid email or password. Please try again.');
      } else {
        alert('Login failed. Please check your credentials and try again.');
      }
    }
  };



  const handleSocialLogin = (provider) => {
    alert(`${provider} login integration would be implemented here`);
  };

  const handleEmergency = () => {
    window.open('tel:911', '_self');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="medimate-logo">🏥</div>
          <h1 className="auth-title">MediMate – Your AI Healthcare Companion</h1>
          <p className="auth-subtitle">Please login to continue</p>
        </div>

        <div className="auth-content">
          {/* Role Selection */}
          <div className="role-tabs">
            <div 
              className={`role-tab ${activeRole === 'patient' ? 'active' : ''}`}
              onClick={() => setActiveRole('patient')}
            >
              <div className="role-icon">👤</div>
              <div className="role-title">Patient Login</div>
            </div>
            <div 
              className={`role-tab ${activeRole === 'doctor' ? 'active' : ''}`}
              onClick={() => setActiveRole('doctor')}
            >
              <div className="role-icon">👨‍⚕️</div>
              <div className="role-title">Doctor Login</div>
            </div>
            <div 
              className={`role-tab ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              <div className="role-icon">🤖</div>
              <div className="role-title">AI Assistant</div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                className="form-input"
                placeholder={activeRole === 'patient' ? 'Email or Mobile' : 'Email Address'}
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              />
            </div>

            {/* Doctor ID Field (for doctors only) */}
            {activeRole === 'doctor' && (
              <div className="form-group">
                <span className="input-icon">🆔</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Doctor ID / License Number"
                  value={formData.doctorId}
                  onChange={(e) => setFormData(prev => ({...prev, doctorId: e.target.value}))}
                />
              </div>
            )}

            {/* Admin Key Field (for admin only) */}
            {activeRole === 'admin' && (
              <div className="form-group">
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Admin Access Key"
                  value={formData.adminKey}
                  onChange={(e) => setFormData(prev => ({...prev, adminKey: e.target.value}))}
                />
              </div>
            )}

            {/* Password Field */}
            <div className="form-group">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="forgot-password">
              <a href="#forgot">Forgot Password?</a>
            </div>

            {/* Login Button */}
            <button type="submit" className="auth-button">
              Login to MediMate
            </button>


          </form>

          {/* Signup Link */}
          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
            <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <button 
                onClick={() => setShowSignup(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#007BFF', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign up here
              </button>
            </p>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <div className="social-divider">
              <span>Or continue with</span>
            </div>
            <div className="social-buttons">
              <button 
                className="social-button google"
                onClick={() => handleSocialLogin('Google')}
              >
                <span>G</span>
                Google
              </button>
              <button 
                className="social-button microsoft"
                onClick={() => handleSocialLogin('Microsoft')}
              >
                <span>M</span>
                Microsoft
              </button>
            </div>
          </div>

          {/* Biometric Login */}
          <div className="biometric-section">
            <p>Biometric Login</p>
            <div className="biometric-buttons">
              <button className="biometric-button" onClick={() => alert('Face ID would be implemented')}>
                👤
              </button>
              <button className="biometric-button" onClick={() => alert('Touch ID would be implemented')}>
                👆
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="auth-footer">
          <div>HIPAA Compliant | AWS Secured | 256-bit Encryption</div>
          <div className="security-features">
            <div className="security-feature">
              <span>🔒</span>
              <span>SSL Secured</span>
            </div>
            <div className="security-feature">
              <span>🛡️</span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="security-feature">
              <span>☁️</span>
              <span>AWS Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Button */}
      <button className="emergency-button" onClick={handleEmergency}>
        🚨 Medical Emergency? Call 911
      </button>
    </div>
  );
};

export default LoginPageNew;
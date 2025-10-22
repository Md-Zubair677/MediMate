import React, { useState } from 'react';

const AuthPage = ({ onNext }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeRole, setActiveRole] = useState('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    doctorId: '',
    adminKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({
      id: 'demo_user',
      name: formData.name || 'Demo User',
      email: formData.email || 'demo@medimate.com',
      role: activeRole
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="medimate-logo">🏥</div>
          <h1 className="auth-title">MediMate – Your AI Healthcare Companion</h1>
          <p className="auth-subtitle">{isLogin ? 'Please login to continue' : 'Create your account'}</p>
        </div>

        <div className="auth-content">
          {/* Role Selection */}
          <div className="role-tabs">
            <div 
              className={`role-tab ${activeRole === 'patient' ? 'active' : ''}`}
              onClick={() => setActiveRole('patient')}
            >
              <div className="role-icon">👤</div>
              <div className="role-title">Patient</div>
            </div>
            <div 
              className={`role-tab ${activeRole === 'doctor' ? 'active' : ''}`}
              onClick={() => setActiveRole('doctor')}
            >
              <div className="role-icon">👨⚕️</div>
              <div className="role-title">Doctor</div>
            </div>
            <div 
              className={`role-tab ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              <div className="role-icon">🤖</div>
              <div className="role-title">AI Assistant</div>
            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
            )}

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

            {!isLogin && (
              <div className="form-group">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                />
              </div>
            )}

            {isLogin && (
              <div className="forgot-password">
                <a href="#forgot">Forgot Password?</a>
              </div>
            )}

            <button type="submit" className="auth-button">
              {isLogin ? 'Login to MediMate' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#007BFF', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isLogin ? 'Sign up here' : 'Login here'}
              </button>
            </p>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <div className="social-divider">
              <span>Or continue with</span>
            </div>
            <div className="social-buttons">
              <button className="social-button google">
                <span>G</span>
                Google
              </button>
              <button className="social-button microsoft">
                <span>M</span>
                Microsoft
              </button>
            </div>
          </div>

          {/* Biometric Login */}
          <div className="biometric-section">
            <p>Biometric Login</p>
            <div className="biometric-buttons">
              <button className="biometric-button">👤</button>
              <button className="biometric-button">👆</button>
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
      <button className="emergency-button" onClick={() => window.open('tel:911', '_self')}>
        🚨 Medical Emergency? Call 911
      </button>
    </div>
  );
};

export default AuthPage;
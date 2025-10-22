import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [confirmationData, setConfirmationData] = useState({
    email: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [demoRole, setDemoRole] = useState('patient');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleConfirmationChange = (e) => {
    setConfirmationData({
      ...confirmationData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const userRole = data.user?.role || 'patient';
        setMessage(`Login successful! Redirecting to ${userRole} dashboard...`);
        
        // Role-based redirection
        const roleRoutes = {
          'patient': '/',
          'doctor': '/doctor',
          'admin': '/admin'
        };
        
        setTimeout(() => navigate(roleRoutes[userRole] || '/'), 2000);
      } else if (data.error?.message?.includes('confirm your email')) {
        setMessage('Please confirm your email address first.');
        setConfirmationData({ ...confirmationData, email: formData.email });
        setShowConfirmation(true);
      } else if (data.error?.message?.includes('User not found')) {
        setMessage('User not found. Please register first or use demo login below.');
      } else {
        setMessage(data.error?.message || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const roleRoutes = {
      'patient': '/',
      'doctor': '/doctor', 
      'admin': '/admin'
    };
    
    setMessage(`Demo login as ${demoRole}! Redirecting to ${demoRole} dashboard...`);
    setTimeout(() => navigate(roleRoutes[demoRole]), 1500);
  };

  const handleConfirmEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/confirm-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: confirmationData.email,
          confirmation_code: confirmationData.code
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Email confirmed successfully! You can now login.');
        setTimeout(() => {
          setShowConfirmation(false);
          setMessage('Email confirmed. Please login with your credentials.');
        }, 2000);
      } else {
        setMessage(data.detail || 'Email confirmation failed. Please check your code.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: confirmationData.email
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('✅ New confirmation code sent to your email.');
      } else {
        setMessage('Failed to resend code. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">📧 Email Confirmation</h1>
            <p className="text-gray-600">Please check your email for a confirmation code</p>
          </div>

          <form onSubmit={handleConfirmEmail} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={confirmationData.email}
                onChange={handleConfirmationChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmation Code
              </label>
              <input
                type="text"
                name="code"
                value={confirmationData.code}
                onChange={handleConfirmationChange}
                placeholder="Enter 6-digit code from email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('successful') || message.includes('coming soon')
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Confirming...' : 'Confirm Email'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              className="w-full mt-2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Resend Code
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowConfirmation(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Login
            </button>
            <p className="mt-2 text-xs text-gray-500">
              For demo purposes, email confirmation is simulated
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">MediMate</h1>
          <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('successful') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3 text-center">Demo Login (Skip Authentication)</p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role for Demo
              </label>
              <select
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="patient">👤 Patient - Homepage with health features</option>
                <option value="doctor">👨‍⚕️ Doctor - Medical dashboard with tools</option>
                <option value="admin">👨‍💼 Admin - Management dashboard</option>
              </select>
            </div>
            
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              🎯 Demo Login as {demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign up here
            </button>
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Home
          </button>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              📧 Demo Note: New registrations require email confirmation (AWS Cognito). 
              Use "Demo Login" above to test different user roles, or register and confirm email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

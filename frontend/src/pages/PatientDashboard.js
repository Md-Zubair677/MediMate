import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const quickActions = [
    {
      icon: '📅',
      title: 'Book Appointment',
      description: 'Schedule with a specialist',
      action: () => navigate('/appointments')
    },
    {
      icon: '📊',
      title: 'Upload Report',
      description: 'Share lab results with AI',
      action: () => navigate('/reports')
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Get instant health advice',
      action: () => navigate('/chat')
    },
    {
      icon: '🩺',
      title: 'Symptom Checker',
      description: 'AI-powered symptom analysis',
      action: () => navigate('/symptom-checker')
    },
    {
      icon: '💊',
      title: 'Prescriptions',
      description: 'View medications & refills',
      action: () => setActiveSection('medications')
    }
  ];

  const navigationItems = [
    { icon: '🏠', label: 'Home', key: 'home' },
    { icon: '📅', label: 'Appointments', key: 'appointments', route: '/appointments' },
    { icon: '🧑⚕️', label: 'Consult Doctor', key: 'consult', route: '/chat' },
    { icon: '📊', label: 'Health Reports', key: 'reports', route: '/reports' },
    { icon: '💊', label: 'Medications', key: 'medications' },
    { icon: '🤖', label: 'AI Assistant', key: 'ai', route: '/chat' },
    { icon: '🩺', label: 'Symptom Checker', key: 'symptoms', route: '/symptom-checker' },
    { icon: '⚙️', label: 'Settings', key: 'settings' }
  ];

  const handleNavigation = (item) => {
    if (item.route) {
      navigate(item.route);
    } else {
      setActiveSection(item.key);
    }
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'medications':
        return (
          <div className="health-summary">
            <div className="summary-header">
              <h2 className="summary-title">💊 My Medications</h2>
            </div>
            <div className="summary-grid">
              <div className="summary-section">
                <h3 className="section-title">
                  <span>🔄</span>
                  Active Prescriptions
                </h3>
                <div className="summary-item">
                  <span className="item-label">Lisinopril 10mg</span>
                  <span className="item-value">Daily</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Metformin 500mg</span>
                  <span className="item-value">Twice daily</span>
                </div>
              </div>
              <div className="summary-section">
                <h3 className="section-title">
                  <span>⏰</span>
                  Upcoming Refills
                </h3>
                <div className="summary-item">
                  <span className="item-label">Lisinopril</span>
                  <span className="item-value">3 days</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="health-summary">
            <div className="summary-header">
              <h2 className="summary-title">⚙️ Account Settings</h2>
            </div>
            <div className="summary-grid">
              <div className="summary-section">
                <h3 className="section-title">
                  <span>👤</span>
                  Profile Information
                </h3>
                <div className="summary-item">
                  <span className="item-label">Name</span>
                  <span className="item-value">{user?.name || 'Demo User'}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Email</span>
                  <span className="item-value">{user?.email || 'demo@medimate.com'}</span>
                </div>
              </div>
              <div className="summary-section">
                <h3 className="section-title">
                  <span>🔔</span>
                  Notifications
                </h3>
                <div className="summary-item">
                  <span className="item-label">Appointment Reminders</span>
                  <span className="item-value">Enabled</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Medication Alerts</span>
                  <span className="item-value">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <>
            {/* Quick Actions */}
            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <div key={index} className="action-card" onClick={action.action}>
                  <div className="action-icon">{action.icon}</div>
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
              ))}
            </div>

            {/* Health Summary */}
            <div className="health-summary">
              <div className="summary-header">
                <h2 className="summary-title">📋 Health Overview</h2>
              </div>
              
              <div className="summary-grid">
                <div className="summary-section">
                  <h3 className="section-title">
                    <span>🩺</span>
                    Recent Visits
                  </h3>
                  <div className="summary-item">
                    <span className="item-label">Dr. Sarah Chen - Cardiology</span>
                    <span className="item-value">Dec 15, 2024</span>
                  </div>
                  <div className="summary-item">
                    <span className="item-label">Dr. Michael Rodriguez - Neurology</span>
                    <span className="item-value">Nov 28, 2024</span>
                  </div>
                </div>
                
                <div className="summary-section">
                  <h3 className="section-title">
                    <span>📊</span>
                    Latest Reports
                  </h3>
                  <div className="summary-item">
                    <span className="item-label">Blood Test Results</span>
                    <span className="item-value">Normal</span>
                  </div>
                  <div className="summary-item">
                    <span className="item-label">X-Ray Chest</span>
                    <span className="item-value">Clear</span>
                  </div>
                </div>
              </div>

              {/* AI Health Tips */}
              <div className="ai-tips">
                <h3 className="tips-title">
                  <span>🤖</span>
                  AI Health Tips for You
                </h3>
                <div className="tip-item">
                  💧 Stay hydrated - aim for 8 glasses of water daily
                </div>
                <div className="tip-item">
                  🚶‍♂️ Take a 10-minute walk after meals to improve digestion
                </div>
                <div className="tip-item">
                  😴 Maintain consistent sleep schedule for better health
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-page">
      {/* Top Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">🏥</div>
          <div className="navbar-greeting">
            Hi, {user?.name || 'Demo User'} 👋
          </div>
        </div>
        
        <div className="navbar-right">
          <button className="notifications-bell">
            🔔
            <span className="notification-badge">3</span>
          </button>
          
          <div className="profile-dropdown">
            <button 
              className="profile-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              👤 Profile ▼
            </button>
            {showProfileDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                marginTop: '8px'
              }}>
                <button 
                  onClick={() => setActiveSection('settings')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ Settings
                </button>
                <button 
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderTop: '1px solid #e5e7eb'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar">
          <nav>
            <ul className="sidebar-nav">
              {navigationItems.map((item) => (
                <li key={item.key} className="nav-item">
                  <button
                    className={`nav-link ${activeSection === item.key ? 'active' : ''}`}
                    onClick={() => handleNavigation(item)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left'
                    }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main" style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          <div className="dashboard-header">
            <h1 className="dashboard-title">Patient Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome to your personalized healthcare hub
            </p>
          </div>
          
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
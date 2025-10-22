import React, { useState, useEffect } from 'react';

export default function NotificationPage({ patientData, onNext }) {
  const [notifications, setNotifications] = useState([]);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    generateNotifications();
    sendNotifications();
  }, []);

  const generateNotifications = () => {
    const appointmentDate = new Date(patientData.appointmentDate);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);

    const notificationList = [
      {
        id: 1,
        type: 'confirmation',
        title: 'Appointment Confirmed',
        message: `Your appointment with ${patientData.doctorName} has been confirmed for ${appointmentDate.toLocaleDateString()} at ${patientData.appointmentTime}.`,
        icon: '✅',
        status: 'sent',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: 'reminder',
        title: 'Appointment Reminder',
        message: `Reminder: You have an appointment tomorrow with ${patientData.doctorName} at ${patientData.appointmentTime}.`,
        icon: '⏰',
        status: 'scheduled',
        scheduledFor: reminderDate.toISOString()
      },
      {
        id: 3,
        type: 'preparation',
        title: 'Appointment Preparation',
        message: 'Please bring your ID, insurance card, and any relevant medical records to your appointment.',
        icon: '📋',
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    ];

    if (patientData.severity === 'High') {
      notificationList.unshift({
        id: 0,
        type: 'urgent',
        title: 'Urgent Care Alert',
        message: 'Based on your symptoms, this appointment is marked as urgent. Please arrive 15 minutes early.',
        icon: '🚨',
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    }

    setNotifications(notificationList);
  };

  const sendNotifications = async () => {
    // Simulate sending email notification
    setTimeout(() => {
      setEmailSent(true);
    }, 1000);

    // Simulate sending SMS notification
    setTimeout(() => {
      setSmsSent(true);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'confirmation': return 'border-green-500 bg-green-50';
      case 'reminder': return 'border-blue-500 bg-blue-50';
      case 'preparation': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>🔔 Notifications & Reminders</h1>
          <p>We'll keep you informed about your appointment</p>
        </div>
        <div className="notifications-content">

          <div className="delivery-status-section">
            <h2>📱 Delivery Status</h2>
            <div className="delivery-methods">
              <div className="delivery-method">
                <div className="method-header">
                  <span className="method-icon">📧</span>
                  <span className="method-title">Email Notification</span>
                </div>
                <div className="method-details">{patientData.email || 'demo@medimate.com'}</div>
                <span className={`status-badge ${
                  emailSent ? 'status-sent' : 'status-na'
                }`}>
                  {emailSent ? '✅ Sent' : '⏳ Sending...'}
                </span>
              </div>

              <div className="delivery-method">
                <div className="method-header">
                  <span className="method-icon">📱</span>
                  <span className="method-title">SMS Notification</span>
                </div>
                <div className="method-details">{patientData.phone || 'Not provided'}</div>
                <span className={`status-badge ${
                  patientData.phone ? 'status-sent' : 'status-na'
                }`}>
                  {patientData.phone ? '✅ Sent' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="reminders-section">
            <h2>📅 Upcoming Reminders</h2>
            <div className="reminders-list">
              <ul>
                <li>• 24 hours before: Appointment reminder</li>
                <li>• 2 hours before: Final reminder with directions</li>
                <li>• After appointment: Follow-up care instructions</li>
              </ul>
            </div>
          </div>

          <div className="notifications-history-section">
            <h2>📋 All Notifications</h2>
            {notifications.map((notification) => (
              <div key={notification.id} className="notification-item">
                <div className="notification-header">
                  <div style={{display: 'flex', alignItems: 'flex-start'}}>
                    <span className="notification-icon">{notification.icon}</span>
                    <div>
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-meta">
                        {notification.scheduledFor && (
                          <span>Scheduled for: {new Date(notification.scheduledFor).toLocaleString()}</span>
                        )}
                        <span className={`status-badge status-${notification.status}`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="appointment-summary-section">
            <h2>📋 Appointment Summary</h2>
            <div className="summary-grid">
              <div className="summary-card">
                <h3>Patient Information</h3>
                <div className="summary-item">
                  <span className="summary-label">Name:</span>
                  <span className="summary-value">{patientData.name || 'Demo User'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Email:</span>
                  <span className="summary-value">{patientData.email || 'demo@medimate.com'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Phone:</span>
                  <span className="summary-value">{patientData.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="summary-card">
                <h3>Appointment Details</h3>
                <div className="summary-item">
                  <span className="summary-label">Doctor:</span>
                  <span className="summary-value">{patientData.doctorName || 'Dr. Emily Watson'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Specialty:</span>
                  <span className="summary-value">{patientData.specialty || 'Cardiology'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Date:</span>
                  <span className="summary-value">{patientData.appointmentDate || '2025-09-28'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Time:</span>
                  <span className="summary-value">{patientData.appointmentTime || '09:00'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => onNext()} className="continue-btn">
              Continue to Follow-up →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
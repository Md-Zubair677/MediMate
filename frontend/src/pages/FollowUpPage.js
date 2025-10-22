import React, { useState } from 'react';

export default function FollowUpPage({ patientData, onRestart }) {
  const [feedback, setFeedback] = useState({
    rating: 5,
    experience: '',
    symptoms: '',
    satisfied: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your feedback! Your healthcare journey is complete.');
    onRestart();
  };

  return (
    <div className="followup-page">
      <div className="followup-container">
        <div className="followup-header">
          <h1>📋 Follow-up & Feedback</h1>
          <p>How was your MediMate experience?</p>
        </div>
        <div className="followup-content">

          <div className="journey-section">
            <h2>🎯 Your Healthcare Journey</h2>
            <div className="journey-steps">
              <div className="journey-step">
                <span className="step-icon">✅</span>
                <div className="step-content">
                  <div className="step-title">Login Completed</div>
                  <div className="step-details">Patient information collected</div>
                </div>
              </div>
              
              <div className="journey-step">
                <span className="step-icon">✅</span>
                <div className="step-content">
                  <div className="step-title">AI Consultation</div>
                  <div className="step-details">Symptoms: {patientData?.symptoms || 'What should I know about high blood pressure?. headche. okay'}</div>
                </div>
              </div>
              
              <div className="journey-step">
                <span className="step-icon">✅</span>
                <div className="step-content">
                  <div className="step-title">Diagnosis Generated</div>
                  <div className="step-details">Severity: {patientData?.severity || 'Medium'}</div>
                </div>
              </div>
              
              <div className="journey-step">
                <span className="step-icon">✅</span>
                <div className="step-content">
                  <div className="step-title">Appointment Booked</div>
                  <div className="step-details">{patientData?.doctorName || 'Dr. Sarah Chen'} - {patientData?.appointmentDate || '2025-09-27'}</div>
                </div>
              </div>
              
              <div className="journey-step">
                <span className="step-icon">✅</span>
                <div className="step-content">
                  <div className="step-title">Notifications Sent</div>
                  <div className="step-details">Email and SMS confirmations</div>
                </div>
              </div>
            </div>
          </div>

          <div className="feedback-section">
            <h2>💬 Your Feedback</h2>
            
            <div className="rating-container">
              <div className="rating-label">Rate your experience (1-5 stars)</div>
              <div className="star-rating">
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    onClick={() => setFeedback(prev => ({...prev, rating: star}))}
                    className={`star ${star <= feedback.rating ? 'active' : ''}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label>How was your experience?</label>
                <textarea
                  value={feedback.experience}
                  onChange={(e) => setFeedback(prev => ({...prev, experience: e.target.value}))}
                  className="form-textarea"
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="form-group">
                <label>How are your symptoms now?</label>
                <select
                  value={feedback.symptoms}
                  onChange={(e) => setFeedback(prev => ({...prev, symptoms: e.target.value}))}
                  className="form-select"
                >
                  <option value="">Select status...</option>
                  <option value="improved">Much improved</option>
                  <option value="better">Somewhat better</option>
                  <option value="same">About the same</option>
                  <option value="worse">Worse</option>
                </select>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="satisfied"
                  checked={feedback.satisfied}
                  onChange={(e) => setFeedback(prev => ({...prev, satisfied: e.target.checked}))}
                />
                <label htmlFor="satisfied">
                  I would recommend MediMate to others
                </label>
              </div>

              <button type="submit" className="complete-btn">
                Complete Journey & Start New Session
              </button>
            </form>
          </div>

          <div className="next-steps-section">
            <h2>🔄 What's Next?</h2>
            <div className="next-steps-grid">
              <div className="next-step-card">
                <div className="next-step-icon">📅</div>
                <div className="next-step-title">Attend Appointment</div>
                <div className="next-step-description">Don't forget your scheduled appointment</div>
              </div>
              <div className="next-step-card">
                <div className="next-step-icon">💊</div>
                <div className="next-step-title">Follow Treatment</div>
                <div className="next-step-description">Follow doctor's recommendations</div>
              </div>
              <div className="next-step-card">
                <div className="next-step-icon">🔄</div>
                <div className="next-step-title">Return Anytime</div>
                <div className="next-step-description">MediMate is always here to help</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
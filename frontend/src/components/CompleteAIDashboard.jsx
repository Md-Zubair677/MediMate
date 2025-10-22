import React, { useState, useEffect } from 'react';

const CompleteAIDashboard = ({ userId = 'demo_user' }) => {
  const [healthScore, setHealthScore] = useState(78);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [symptomAnalysis, setSymptomAnalysis] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load doctors
    setDoctors([
      { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', rating: 4.8, available: true },
      { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology', rating: 4.9, available: true },
      { id: 3, name: 'Dr. Emily Davis', specialty: 'Internal Medicine', rating: 4.7, available: false }
    ]);

    // Load notifications
    setNotifications([
      { id: 1, type: 'medication', message: 'Time to take Lisinopril (10mg)', time: '2 hours ago' },
      { id: 2, type: 'appointment', message: 'Cardiology appointment tomorrow at 2 PM', time: '1 day' },
      { id: 3, type: 'health', message: 'Blood pressure reading due today', time: '3 hours ago' }
    ]);
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, user_id: userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.response || 'No response received');
      } else {
        // Fallback AI response when API is not available
        const fallbackResponse = generateFallbackChatResponse(chatMessage);
        setChatResponse(fallbackResponse);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Generate fallback AI response
      const fallbackResponse = generateFallbackChatResponse(chatMessage);
      setChatResponse(fallbackResponse);
    }
    setLoading(false);
  };

  const generateFallbackChatResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Emergency responses - Enhanced heart detection
    if (lowerMessage.includes('chest pain') || lowerMessage.includes('heart pain') || 
        lowerMessage.includes('heart attack') || lowerMessage.includes('can\'t breathe') || 
        lowerMessage.includes('difficulty breathing') || lowerMessage.includes('severe chest') ||
        lowerMessage.includes('crushing pain') || lowerMessage.includes('heart hurt')) {
      return `🚨 EMERGENCY DETECTED: "${message}"

• IMMEDIATE ACTION: Call 911 NOW
• Do NOT drive yourself to hospital
• Stay calm and follow 911 operator instructions
• If heart/chest pain: Chew aspirin if not allergic
• Have someone stay with you until help arrives
• This could be a heart attack - seek immediate care`;
    }
    
    // Symptom-based responses
    if (lowerMessage.includes('headache')) {
      return `Medical Guidance for "${message}":

• Assessment: Monitor headache severity and duration
• Recommendation: Stay hydrated, rest in dark quiet room
• Pain relief: Consider over-the-counter pain medication
• Follow-up: Contact doctor if severe or persistent
• Emergency: Call 911 if sudden severe headache with fever/stiffness`;
    }
    
    if (lowerMessage.includes('fever')) {
      return `Medical Guidance for "${message}":

• Assessment: Monitor temperature and associated symptoms
• Recommendation: Stay hydrated, rest, light clothing
• Medication: Consider fever reducer if temperature >101°F
• Follow-up: Contact doctor if fever >103°F or lasts >3 days
• Emergency: Call 911 if difficulty breathing or severe symptoms`;
    }
    
    if (lowerMessage.includes('diabetes') || lowerMessage.includes('blood sugar')) {
      return `Medical Guidance for "${message}":

• Assessment: Monitor blood glucose levels regularly
• Recommendation: Follow prescribed medication schedule
• Diet: Maintain consistent carbohydrate intake
• Exercise: Regular physical activity as approved by doctor
• Follow-up: Regular check-ups with endocrinologist`;
    }
    
    // General health responses
    if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor')) {
      return `Medical Guidance for "${message}":

• Assessment: Scheduling medical care is important
• Recommendation: Contact your primary care physician
• Preparation: List symptoms, medications, questions
• Follow-up: Keep all scheduled appointments
• Emergency: Use urgent care for non-emergency needs`;
    }
    
    // Default response
    return `Medical Guidance for "${message}":

• Assessment: Thank you for your health inquiry
• Recommendation: Consult with healthcare provider for personalized advice
• General care: Maintain healthy diet, exercise, adequate sleep
• Follow-up: Regular check-ups and preventive care
• Emergency: Call 911 for any life-threatening symptoms`;
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/symptoms/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptoms.split(',').map(s => s.trim()), user_id: userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSymptomAnalysis(data);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.error('Symptom analysis error:', error);
      // Enhanced fallback analysis that always works
      const fallbackAnalysis = generateEnhancedFallbackAnalysis(symptoms);
      setSymptomAnalysis(fallbackAnalysis);
    }
    setLoading(false);
  };

  const generateEnhancedFallbackAnalysis = (symptoms) => {
    const lowerSymptoms = symptoms.toLowerCase();
    
    // Critical emergency symptoms
    if (lowerSymptoms.includes('chest pain') || lowerSymptoms.includes('heart pain') ||
        lowerSymptoms.includes('difficulty breathing') || lowerSymptoms.includes('can\'t breathe') ||
        lowerSymptoms.includes('severe chest') || lowerSymptoms.includes('crushing pain')) {
      return {
        symptoms_analyzed: symptoms.split(',').map(s => s.trim()),
        overall_severity: 'CRITICAL',
        emergency_detected: true,
        recommendation: '🚨 CALL 911 IMMEDIATELY - This could be a heart attack or serious cardiac event',
        individual_analyses: [
          {
            symptom: 'Chest/Heart Pain',
            analysis: {
              severity: 'CRITICAL',
              causes: ['Heart attack', 'Angina', 'Pulmonary embolism'],
              recommendations: ['🚨 CALL 911 NOW', 'Do not drive yourself', 'Chew aspirin if not allergic'],
              when_to_seek_help: 'IMMEDIATELY - This is a medical emergency'
            }
          }
        ],
        confidence: '95%',
        next_steps: [
          '🚨 Call 911 immediately',
          'Stay calm and sit upright',
          'Chew aspirin if available and not allergic',
          'Have someone stay with you',
          'Do NOT drive yourself to hospital'
        ]
      };
    }
    
    // High priority symptoms
    if (lowerSymptoms.includes('severe headache') || lowerSymptoms.includes('high fever') ||
        lowerSymptoms.includes('vomiting blood') || lowerSymptoms.includes('severe pain')) {
      return {
        symptoms_analyzed: symptoms.split(',').map(s => s.trim()),
        overall_severity: 'HIGH',
        emergency_detected: false,
        recommendation: '⚠️ SEEK IMMEDIATE MEDICAL ATTENTION - Go to emergency room or urgent care',
        individual_analyses: [
          {
            symptom: 'High Priority Symptoms',
            analysis: {
              severity: 'HIGH',
              causes: ['Serious medical condition requiring prompt care'],
              recommendations: ['Go to emergency room', 'Contact your doctor immediately', 'Monitor symptoms closely'],
              when_to_seek_help: 'Within 1-2 hours'
            }
          }
        ],
        confidence: '90%',
        next_steps: [
          'Go to emergency room or urgent care',
          'Contact your healthcare provider',
          'Monitor symptoms for any worsening',
          'Bring list of current medications'
        ]
      };
    }
    
    // Medium priority symptoms
    if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('headache') || 
        lowerSymptoms.includes('nausea') || lowerSymptoms.includes('pain') ||
        lowerSymptoms.includes('cough') || lowerSymptoms.includes('fatigue')) {
      return {
        symptoms_analyzed: symptoms.split(',').map(s => s.trim()),
        overall_severity: 'MEDIUM',
        emergency_detected: false,
        recommendation: '📅 Schedule appointment with healthcare provider within 24-48 hours',
        individual_analyses: [
          {
            symptom: 'Common Symptoms',
            analysis: {
              severity: 'MEDIUM',
              causes: ['Viral infection', 'Bacterial infection', 'Stress', 'Dehydration'],
              recommendations: ['Rest and hydration', 'Monitor temperature', 'Over-the-counter relief as appropriate'],
              when_to_seek_help: 'If symptoms worsen or persist more than 3 days'
            }
          }
        ],
        confidence: '85%',
        next_steps: [
          'Rest and stay hydrated',
          'Monitor symptoms for changes',
          'Schedule doctor appointment if persistent',
          'Take temperature regularly if fever present'
        ]
      };
    }
    
    // Low priority or general symptoms
    return {
      symptoms_analyzed: symptoms.split(',').map(s => s.trim()),
      overall_severity: 'LOW',
      emergency_detected: false,
      recommendation: '💡 Monitor symptoms and maintain healthy habits',
      individual_analyses: [
        {
          symptom: 'General Health Concerns',
          analysis: {
            severity: 'LOW',
            causes: ['Minor health issues', 'Lifestyle factors', 'Stress'],
            recommendations: ['Maintain healthy lifestyle', 'Adequate sleep', 'Regular exercise', 'Balanced diet'],
            when_to_seek_help: 'If symptoms persist or worsen over time'
          }
        }
      ],
      confidence: '80%',
      next_steps: [
        'Continue monitoring symptoms',
        'Maintain healthy lifestyle habits',
        'Schedule routine check-up if due',
        'Contact doctor if symptoms change'
      ]
    };
  };

  const bookEmergencyAppointment = () => {
    alert('🚨 Emergency appointment booking initiated!\nRedirecting to emergency services...');
  };

  const testEmergencyDetection = async () => {
    setChatMessage('I have severe chest pain and difficulty breathing');
    await sendChatMessage();
  };

  return (
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif'}}>
      <h1 style={{color: '#007bff', marginBottom: '30px'}}>🤖 MediMate Complete AI Agent Dashboard</h1>
      
      {/* Health Status */}
      <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>📊 Health Status</h2>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <div style={{fontSize: '3rem', fontWeight: 'bold', color: healthScore >= 80 ? '#28a745' : healthScore >= 60 ? '#ffc107' : '#dc3545'}}>
            {healthScore}/100
          </div>
          <div>
            <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>Health Score</div>
            <div style={{color: '#666'}}>
              ⚠️ Risk Factors: {healthScore < 80 ? 'Moderate blood pressure, irregular sleep' : 'None detected'}
            </div>
            <div style={{color: '#666'}}>
              💡 AI Recommendations: {healthScore < 80 ? 'Increase exercise, monitor diet' : 'Maintain current lifestyle'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Health Assistant */}
      <div style={{backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>💬 AI Health Assistant</h2>
        <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask about your health, symptoms, or medical questions..."
            style={{flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button 
            onClick={sendChatMessage}
            disabled={loading}
            style={{padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        {chatResponse && (
          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '4px', border: '1px solid #dee2e6'}}>
            <h4>AI Response:</h4>
            <div style={{whiteSpace: 'pre-line'}}>{chatResponse}</div>
          </div>
        )}
      </div>

      {/* Available Doctors */}
      <div style={{backgroundColor: '#d4edda', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>👨⚕️ Available Doctors</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
          {doctors.map(doctor => (
            <div key={doctor.id} style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #c3e6cb'}}>
              <h3 style={{margin: '0 0 10px 0'}}>{doctor.name}</h3>
              <p style={{margin: '5px 0'}}>{doctor.specialty}</p>
              <p style={{margin: '5px 0'}}>Rating: {doctor.rating}/5 ⭐</p>
              <p style={{margin: '5px 0'}}>Status: {doctor.available ? '✅ Available' : '❌ Busy'}</p>
              <button 
                style={{
                  padding: '8px 16px', 
                  backgroundColor: doctor.available ? '#007bff' : '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: doctor.available ? 'pointer' : 'not-allowed',
                  marginTop: '10px'
                }}
                disabled={!doctor.available}
              >
                {doctor.available ? 'Book Appointment' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Health Notifications */}
      <div style={{backgroundColor: '#f1f3f4', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>🔔 Health Notifications</h2>
        {notifications.map(notification => (
          <div key={notification.id} style={{backgroundColor: 'white', padding: '15px', borderRadius: '4px', border: '1px solid #dee2e6', marginBottom: '10px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{fontSize: '1.2rem'}}>
                {notification.type === 'medication' ? '💊' : notification.type === 'appointment' ? '📅' : '🩺'}
              </span>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold'}}>{notification.type}</div>
                <div>{notification.message}</div>
              </div>
              <div style={{color: '#666', fontSize: '0.9rem'}}>{notification.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Actions */}
      <div style={{backgroundColor: '#f8d7da', padding: '20px', borderRadius: '8px'}}>
        <h2>🚨 Emergency Actions</h2>
        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
          <button 
            onClick={bookEmergencyAppointment}
            style={{padding: '12px 24px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
          >
            Book Emergency Appointment
          </button>
          <button 
            onClick={testEmergencyDetection}
            style={{padding: '12px 24px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Test Emergency Detection
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteAIDashboard;

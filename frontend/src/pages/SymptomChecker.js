import React, { useState } from 'react';

const SymptomChecker = ({ user }) => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clarificationNeeded, setClarificationNeeded] = useState(null);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      alert('Please describe your symptoms');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/symptoms/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user?.id || 'demo_patient',
          symptoms_text: symptoms
        })
      });

      const result = await response.json();
      
      if (result.status === 'needs_clarification') {
        setClarificationNeeded(result);
      } else {
        setAnalysis(result.analysis);
        setClarificationNeeded(null);
      }
    } catch (error) {
      alert('Error analyzing symptoms: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (doctor) => {
    try {
      const response = await fetch('http://localhost:8000/api/symptoms/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user?.id || 'demo_patient',
          doctor_id: doctor.doctor_id,
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '14:00',
          reason: symptoms,
          symptoms: [symptoms]
        })
      });

      const result = await response.json();
      if (result.status === 'appointment_booked') {
        alert('Appointment booked successfully!');
      }
    } catch (error) {
      alert('Error booking appointment: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#007BFF', marginBottom: '1rem' }}>🩺 AI Symptom Checker</h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Describe any symptoms or health concerns - our AI will provide personalized guidance and connect you with the right specialists.
      </p>
      
      {/* Quick Examples */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#007BFF', marginBottom: '1rem' }}>Quick Examples (Click to Use)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
          {[
            "I have a headache and mild fever",
            "What should I know about high blood pressure?",
            "I'm feeling anxious lately",
            "How can I improve my sleep quality?"
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setSymptoms(example)}
              style={{
                padding: '0.8rem',
                border: '1px solid #007BFF',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#007BFF',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Describe your symptoms or health concerns:
        </label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Type your own symptoms here... (e.g., 'I have chest pain when I exercise', 'My knee has been swollen for 3 days', 'I can't sleep and feel stressed')"
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '1rem',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
          💡 You can describe any symptoms, ask health questions, or use the quick examples above
        </div>
      </div>

      <button
        onClick={analyzeSymptoms}
        disabled={loading}
        style={{
          backgroundColor: '#007BFF',
          color: 'white',
          padding: '1rem 2rem',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '2rem'
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Symptoms'}
      </button>

      {/* Emergency Alert */}
      {analysis?.triage === 'emergency' && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h2>⚠️ MEDICAL EMERGENCY</h2>
          <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>{analysis.message}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {analysis.emergency_actions?.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.action.startsWith('tel:')) {
                    window.open(action.action, '_self');
                  }
                }}
                style={{
                  backgroundColor: 'white',
                  color: '#ff4444',
                  padding: '0.8rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && analysis.triage !== 'emergency' && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#007BFF', marginBottom: '1rem' }}>
            🩺 Analysis Results - {analysis.triage === 'urgent' ? 'Needs Attention' : 'Routine Care'}
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <strong>Triage Level: </strong>
            <span style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              backgroundColor: analysis.triage === 'urgent' ? '#ffc107' : '#28a745',
              color: 'white'
            }}>
              {analysis.triage.toUpperCase()}
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong>Recommended Specialties: </strong>
            {analysis.specialties?.join(', ').replace(/_/g, ' ')}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong>AI Guidance: </strong>
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{analysis.explanation}</div>
          </div>
          
          {analysis.appointment_prompt && (
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              border: '1px solid #2196f3'
            }}>
              <strong>👩‍⚕️ {analysis.appointment_prompt}</strong>
            </div>
          )}
          
          {analysis.privacy_note && (
            <div style={{
              fontSize: '0.85rem',
              color: '#666',
              fontStyle: 'italic',
              marginBottom: '1rem'
            }}>
              🔒 {analysis.privacy_note}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <strong>Next Steps:</strong>
            <ul>
              {analysis.next_steps?.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Doctor Suggestions */}
      {analysis?.doctor_suggestions && analysis.doctor_suggestions.length > 0 && (
        <div>
          <h2 style={{ color: '#007BFF', marginBottom: '1rem' }}>Recommended Doctors</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {analysis.doctor_suggestions.map((doctor, index) => (
              <div
                key={index}
                style={{
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{doctor.name}</h3>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Specialty:</strong> {doctor.specialty?.replace(/_/g, ' ')}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Hospital:</strong> {doctor.hospital}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Rating:</strong> ⭐ {doctor.rating}/5.0
                    </p>
                    <div style={{ marginTop: '0.5rem' }}>
                      {doctor.available_today && (
                        <span style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          marginRight: '0.5rem'
                        }}>
                          Available Today
                        </span>
                      )}
                      {doctor.telemedicine && (
                        <span style={{
                          backgroundColor: '#007BFF',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          Telemedicine
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => bookAppointment(doctor)}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '0.8rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        padding: '1rem',
        borderRadius: '6px',
        marginTop: '2rem',
        fontSize: '0.9rem',
        color: '#856404'
      }}>
        <strong>⚠️ Medical Disclaimer:</strong> This AI symptom checker provides preliminary guidance only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for proper medical evaluation and care.
      </div>
    </div>
  );
};

export default SymptomChecker;
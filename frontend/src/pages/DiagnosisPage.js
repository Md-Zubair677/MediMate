import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DiagnosisPage({ patientData, onNext }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [severity, setSeverity] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateDiagnosis();
  }, []);

  const generateDiagnosis = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        patient_id: patientData.id,
        symptoms: `Please provide a medical assessment for: ${patientData.symptoms}. Patient details: Age ${patientData.age}, Gender ${patientData.gender}. Provide: 1) Possible diagnosis 2) Severity level (Low/Medium/High) 3) Recommendations 4) Whether doctor visit is needed.`,
        medical_history: ''
      });

      const aiResponse = response.data.response;
      
      // Parse AI response for structured data
      setDiagnosis(aiResponse);
      
      // Determine severity based on keywords
      const severityLevel = aiResponse.toLowerCase().includes('urgent') || aiResponse.toLowerCase().includes('serious') 
        ? 'High' 
        : aiResponse.toLowerCase().includes('moderate') || aiResponse.toLowerCase().includes('concern')
          ? 'Medium'
          : 'Low';
      
      setSeverity(severityLevel);
      
      // Extract recommendations
      const recs = [
        'Monitor symptoms closely',
        'Stay hydrated and rest',
        'Follow up if symptoms worsen',
        severityLevel === 'High' ? 'Seek immediate medical attention' : 'Consider scheduling a doctor visit'
      ];
      
      setRecommendations(recs);
      
    } catch (error) {
      setDiagnosis('Unable to generate diagnosis at this time. Please consult with a healthcare professional.');
      setSeverity('Medium');
      setRecommendations(['Consult with a healthcare professional', 'Monitor symptoms', 'Seek medical attention if needed']);
    }
    setLoading(false);
  };

  const handleProceed = () => {
    onNext({
      diagnosis: diagnosis,
      severity: severity,
      recommendations: recommendations,
      needsAppointment: severity === 'High' || severity === 'Medium'
    });
  };

  const getSeverityColor = (level) => {
    switch(level) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="diagnosis-page">
      <div className="diagnosis-container">
        <div className="diagnosis-header">
          <h1>🩺 AI Diagnosis & Assessment</h1>
          <p>Based on your symptoms: "{patientData.symptoms}"</p>
        </div>
        <div className="diagnosis-content">

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">AI is analyzing your symptoms...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Severity Level */}
          <div className="severity-section">
            <h3>Severity Assessment</h3>
            <div className="severity-badge">
              {severity} Priority
            </div>
          </div>

          {/* AI Diagnosis */}
          <div className="analysis-section">
            <h3>🤖 AI Analysis</h3>
            <div className="analysis-text">
              {diagnosis}
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations-section">
            <h3>📋 Recommendations</h3>
            <ul className="recommendations-list">
              {recommendations.map((rec, index) => (
                <li key={index}>
                  <span>✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="next-steps-section">
            <h3>Next Steps</h3>
            <div className="consultation-card">
              {severity === 'Medium' && (
                <>
                  <h4>⚡ Doctor Consultation Recommended</h4>
                  <p>Consider scheduling an appointment for proper evaluation.</p>
                </>
              )}
            </div>
            <button onClick={handleProceed} className="book-appointment-btn">
              Book Appointment →
            </button>
          </div>

          {/* Medical Disclaimer */}
          <div className="medical-disclaimer">
            <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only. 
            Always consult with qualified healthcare professionals for proper medical diagnosis and treatment.
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
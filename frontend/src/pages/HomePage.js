import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedDoctor, setSuggestedDoctor] = useState(null);

  const specialistMapping = {
    'heart': { specialty: 'Cardiology', doctor: 'Dr. Sarah Johnson', icon: '❤️' },
    'chest': { specialty: 'Cardiology', doctor: 'Dr. Sarah Johnson', icon: '❤️' },
    'blood pressure': { specialty: 'Cardiology', doctor: 'Dr. Sarah Johnson', icon: '❤️' },
    'skin': { specialty: 'Dermatology', doctor: 'Dr. Emily Chen', icon: '🧴' },
    'rash': { specialty: 'Dermatology', doctor: 'Dr. Emily Chen', icon: '🧴' },
    'acne': { specialty: 'Dermatology', doctor: 'Dr. Emily Chen', icon: '🧴' },
    'diabetes': { specialty: 'Endocrinology', doctor: 'Dr. Michael Rodriguez', icon: '🩺' },
    'thyroid': { specialty: 'Endocrinology', doctor: 'Dr. Michael Rodriguez', icon: '🩺' },
    'sugar': { specialty: 'Endocrinology', doctor: 'Dr. Michael Rodriguez', icon: '🩺' },
    'stomach': { specialty: 'Gastroenterology', doctor: 'Dr. Lisa Wang', icon: '🫃' },
    'digestive': { specialty: 'Gastroenterology', doctor: 'Dr. Lisa Wang', icon: '🫃' },
    'nausea': { specialty: 'Gastroenterology', doctor: 'Dr. Lisa Wang', icon: '🫃' },
    'bone': { specialty: 'Orthopedics', doctor: 'Dr. James Miller', icon: '🦴' },
    'joint': { specialty: 'Orthopedics', doctor: 'Dr. James Miller', icon: '🦴' },
    'back pain': { specialty: 'Orthopedics', doctor: 'Dr. James Miller', icon: '🦴' },
    'headache': { specialty: 'Neurology', doctor: 'Dr. Anna Thompson', icon: '🧠' },
    'migraine': { specialty: 'Neurology', doctor: 'Dr. Anna Thompson', icon: '🧠' },
    'dizziness': { specialty: 'Neurology', doctor: 'Dr. Anna Thompson', icon: '🧠' }
  };

  const findSpecialist = (symptomText) => {
    const text = symptomText.toLowerCase();
    for (const [keyword, specialist] of Object.entries(specialistMapping)) {
      if (text.includes(keyword)) {
        return specialist;
      }
    }
    return { specialty: 'General Medicine', doctor: 'Dr. Robert Smith', icon: '👨‍⚕️' };
  };

  const handleSymptomSubmit = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    const userMessage = { type: 'user', content: symptoms };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Get AI analysis
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Analyze these symptoms and suggest appropriate medical specialty: ${symptoms}` })
      });

      const data = await response.json();
      
      // Find specialist based on symptoms
      const specialist = findSpecialist(symptoms);
      setSuggestedDoctor(specialist);

      const aiMessage = {
        type: 'ai',
        content: `Based on your symptoms, I recommend seeing a ${specialist.specialty} specialist.\n\n${data.response}\n\nSuggested Doctor: ${specialist.doctor}\n\nWould you like to book an appointment?`
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: 'I apologize, but I\'m having trouble analyzing your symptoms right now. For immediate concerns, please consult a healthcare professional.'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
    setSymptoms('');
  };

  const bookAppointment = () => {
    // Redirect to appointments page with pre-filled data
    const appointmentData = {
      specialty: suggestedDoctor.specialty,
      doctor: suggestedDoctor.doctor,
      symptoms: chatMessages[0]?.content || ''
    };
    
    localStorage.setItem('appointmentData', JSON.stringify(appointmentData));
    window.location.href = '/appointments';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to MediMate 🏥
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your AI-powered healthcare assistant for consultations, appointments, and medical document analysis
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <Link to="/chat" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2">AI Health Chat</h3>
          <p className="text-gray-600">
            Get instant health guidance powered by Claude 3.5 Sonnet AI
          </p>
        </Link>

        <div 
          onClick={() => setShowSymptomModal(true)}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">Book Appointments</h3>
          <p className="text-gray-600">
            Describe symptoms & get doctor suggestions with AI-powered matching
          </p>
        </div>

        <Link to="/reports" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">Analyze Reports</h3>
          <p className="text-gray-600">
            Upload and get AI analysis of your medical documents
          </p>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-bold text-blue-600">13</div>
            <div className="text-gray-600">AWS Services</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">22+</div>
            <div className="text-gray-600">Medical Specialties</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">24/7</div>
            <div className="text-gray-600">AI Availability</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">100%</div>
            <div className="text-gray-600">HIPAA Compliant</div>
          </div>
        </div>
      </div>

      {/* Symptom Finder Modal */}
      {showSymptomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">🩺 AI Symptom Finder</h2>
                <button 
                  onClick={() => setShowSymptomModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="mt-2 opacity-90">Describe your symptoms and get personalized doctor recommendations</p>
            </div>

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto p-4 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <p>Hi! I'm here to help you find the right doctor.</p>
                  <p className="text-sm mt-2">Describe your symptoms below and I'll suggest the best specialist for you.</p>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br>') }} />
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="text-left mb-4">
                  <div className="inline-block p-3 rounded-lg bg-white border shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>Analyzing symptoms...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Section */}
            <div className="p-4 border-t">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms (e.g., headache, fever, stomach pain...)"
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSymptomSubmit()}
                />
                <button
                  onClick={handleSymptomSubmit}
                  disabled={loading || !symptoms.trim()}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze
                </button>
              </div>
            </div>

            {/* Doctor Suggestion & Booking */}
            {suggestedDoctor && (
              <div className="p-4 bg-green-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{suggestedDoctor.icon}</div>
                    <div>
                      <h3 className="font-semibold text-green-800">{suggestedDoctor.doctor}</h3>
                      <p className="text-green-600">{suggestedDoctor.specialty} Specialist</p>
                    </div>
                  </div>
                  <button
                    onClick={bookAppointment}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

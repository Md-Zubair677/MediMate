import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Building, Clock, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BloodDonation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    email: '',
    phone: '',
    location: ''
  });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [eligibilityScore, setEligibilityScore] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [assignedHospital, setAssignedHospital] = useState(null);
  const [pickupTime, setPickupTime] = useState('');
  const [donorId, setDonorId] = useState('');

  const criticalQuestions = [1, 2, 3, 4, 7, 12]; // Updated to include bleeding disorders
  
  const getEligibilityQuestions = () => {
    const baseQuestions = [
      { id: 1, question: "Are you between 18–65 years of age?", correctAnswer: "yes", critical: true },
      { id: 2, question: "Do you weigh at least 45 kg?", correctAnswer: "yes", critical: true },
      { id: 3, question: "Is your hemoglobin above 12.5 g/dL?", correctAnswer: "yes", critical: true },
      { id: 4, question: "Are you free from fever, cold, or infection today?", correctAnswer: "yes", critical: true },
      { id: 5, question: formData.gender === 'male' ? "Have you donated blood in the last 3 months?" : "Have you donated blood in the last 4 months?", correctAnswer: "no", critical: false },
      { id: 6, question: "Have you had tattoos, piercings, or surgeries in the last 6 months?", correctAnswer: "no", critical: false },
      { id: 7, question: "Do you have HIV, Hepatitis, cancer, diabetes (on insulin), or heart disease?", correctAnswer: "no", critical: true },
      { id: 9, question: "Have you had malaria, typhoid, or tuberculosis recently?", correctAnswer: "no", critical: false },
      { id: 10, question: "Are you currently taking antibiotics or any major medication?", correctAnswer: "no", critical: false },
      { id: 11, question: "Have you consumed alcohol in the last 24 hours?", correctAnswer: "no", critical: false },
      { id: 12, question: "Do you have any bleeding disorders or take blood thinners?", correctAnswer: "no", critical: true }
    ];

    // Add gender-specific questions
    if (formData.gender === 'female') {
      baseQuestions.splice(7, 0, { id: 8, question: "Are you currently pregnant or recently delivered a baby?", correctAnswer: "no", critical: false });
    }

    return baseQuestions;
  };

  const eligibilityQuestions = getEligibilityQuestions();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('quiz');
    }
  };

  const validateForm = () => {
    const { fullName, gender, age, email, phone } = formData;
    return fullName && gender && age >= 18 && age <= 65 && email && phone.length === 10;
  };

  const handleQuizSubmit = async () => {
    let criticalPass = true;
    let totalScore = 0;
    
    criticalQuestions.forEach(qId => {
      if (quizAnswers[qId] !== eligibilityQuestions.find(q => q.id === qId).correctAnswer) {
        criticalPass = false;
      }
    });

    eligibilityQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        totalScore += 1;
      }
    });

    setEligibilityScore(totalScore);
    const eligible = criticalPass && totalScore >= 8;
    setIsEligible(eligible);
    
    if (eligible) {
      await processEligibleDonor();
    }
    
    setStep('result');
  };

  const processEligibleDonor = async () => {
    try {
      const response = await fetch('/api/blood-donation/process-eligible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eligibilityScore,
          quizAnswers
        })
      });

      const data = await response.json();
      if (data.success) {
        setAssignedHospital(data.hospital);
        setPickupTime(data.pickupTime);
        setDonorId(data.donorId);
      }
    } catch (error) {
      console.error('Failed to process eligible donor:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          location: `${position.coords.latitude}, ${position.coords.longitude}`
        }));
      });
    }
  };

  const getRetryGuidance = () => {
    const failedCritical = criticalQuestions.some(qId => 
      quizAnswers[qId] !== eligibilityQuestions.find(q => q.id === qId).correctAnswer
    );

    if (failedCritical) {
      return "Please consult with a healthcare provider before attempting to donate again. Ensure you meet all health requirements.";
    } else {
      return "You can retry in 3-6 months. Focus on maintaining good health, proper nutrition, and adequate rest.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-red-600 flex items-center">
            🩸 Blood Donation
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Donor Registration</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email ID *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Pincode or GPS coordinates"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700"
                    >
                      <MapPin size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Continue to Eligibility Test
              </button>
            </form>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Eligibility Test</h2>
            <p className="text-gray-600 mb-8">Please answer honestly. All critical criteria must pass and you need 8/{eligibilityQuestions.length} correct answers to be eligible.</p>
            
            <div className="space-y-6">
              {eligibilityQuestions.map((q, index) => (
                <div key={q.id} className={`p-4 border rounded-lg ${q.critical ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                  <p className="font-medium text-gray-800 mb-3">
                    {index + 1}. {q.question}
                    {q.critical && <span className="text-red-600 text-sm ml-2">(Critical)</span>}
                  </p>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value="yes"
                        onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="mr-2 text-red-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value="no"
                        onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="mr-2 text-red-600"
                      />
                      No
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length < eligibilityQuestions.length}
              className="w-full mt-8 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400"
            >
              Submit Eligibility Test
            </button>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            {isEligible ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-semibold text-green-600 mb-4">You are eligible to donate blood!</h2>
                <p className="text-gray-600 mb-6">Score: {eligibilityScore}/{eligibilityQuestions.length} - All critical criteria passed</p>
                
                {assignedHospital && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
                    <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                      <Building className="mr-2" size={20} />
                      Hospital Assignment Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Building size={16} className="text-green-600 mr-2" />
                        <span className="font-medium">Hospital:</span>
                        <span className="ml-2">{assignedHospital.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin size={16} className="text-green-600 mr-2" />
                        <span className="font-medium">Address:</span>
                        <span className="ml-2">{assignedHospital.address}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock size={16} className="text-green-600 mr-2" />
                        <span className="font-medium">Scheduled Pickup:</span>
                        <span className="ml-2">{pickupTime}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Phone size={16} className="text-green-600 mr-2" />
                        <span className="font-medium">Contact:</span>
                        <span className="ml-2">{assignedHospital.contact}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <User size={16} className="text-green-600 mr-2" />
                        <span className="font-medium">Donor ID:</span>
                        <span className="ml-2">{donorId}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    <strong>{assignedHospital?.name || 'Hospital'} team will visit your location at {pickupTime}.</strong><br/>
                    A confirmation email and SMS have been sent to you. Please stay hydrated and be ready at the scheduled time.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-semibold text-orange-600 mb-4">Currently not eligible</h2>
                <p className="text-gray-600 mb-6">Score: {eligibilityScore}/{eligibilityQuestions.length} - Some critical criteria were not met</p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-orange-800 text-sm">
                    <strong>When to try again:</strong><br/>
                    {getRetryGuidance()}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Home
              </button>
              {!isEligible && (
                <button
                  onClick={() => setStep('quiz')}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retake Test
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BloodDonation;

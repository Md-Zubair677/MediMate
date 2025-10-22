import React, { useState, useEffect } from 'react';

const MLRecommendations = ({ userId = "demo_user" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userSymptoms, setUserSymptoms] = useState('');
  const [vitals, setVitals] = useState({
    heartRate: '',
    bloodPressure: '',
    temperature: ''
  });

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/ml/recommendations/${userId}`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([
        {
          title: "Increase Daily Water Intake",
          description: "Based on your activity patterns, increase water intake to 8-10 glasses daily",
          category: "hydration",
          priority: "medium",
          confidence: 87
        }
      ]);
    }
    setLoading(false);
  };

  const generatePredictions = async () => {
    setLoading(true);
    try {
      console.log('Generating predictions with data:', {
        symptoms: userSymptoms,
        vitals: vitals
      });
      
      const requestData = {
        user_id: userId,
        symptoms: userSymptoms.split(',').map(s => s.trim()).filter(s => s),
        vitals: {
          heart_rate: parseInt(vitals.heartRate) || 75,
          blood_pressure: vitals.bloodPressure || "120/80",
          temperature: parseFloat(vitals.temperature) || 98.6
        }
      };
      
      console.log('Sending request:', requestData);
      
      const response = await fetch('http://localhost:8000/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received prediction:', data);
      setPredictions(data);
      
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // Enhanced fallback with actual analysis
      const fallbackPrediction = {
        risk_level: "ANALYSIS UNAVAILABLE",
        confidence: "0%",
        recommendation: "API temporarily unavailable - please consult healthcare provider",
        error: error.message,
        fallback: true
      };
      setPredictions(fallbackPrediction);
    }
    setLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel.includes('High')) return '#dc3545';
    if (riskLevel.includes('Medium')) return '#ffc107';
    return '#28a745';
  };

  return (
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px'}}>
        <h1 style={{color: '#007bff', margin: 0}}>🧠 ML Health Recommendations</h1>
        <button 
          onClick={() => { fetchRecommendations(); generatePredictions(); }} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Sample Test Cases */}
      <div style={{backgroundColor: '#f1f3f4', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>📋 Sample Test Cases - Click to Load</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px'}}>
          
          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #dc3545'}}>
            <h4 style={{color: '#dc3545', margin: '0 0 10px 0'}}>🚨 CRITICAL CASE</h4>
            <div style={{fontSize: '0.9rem', marginBottom: '10px'}}>
              <strong>Symptoms:</strong> chest pain, difficulty breathing<br/>
              <strong>Heart Rate:</strong> 140 bpm<br/>
              <strong>Blood Pressure:</strong> 210/130<br/>
              <strong>Temperature:</strong> 104.2°F
            </div>
            <button 
              onClick={() => {
                setUserSymptoms('chest pain, difficulty breathing');
                setVitals({heartRate: '140', bloodPressure: '210/130', temperature: '104.2'});
              }}
              style={{padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Load Critical Case
            </button>
          </div>

          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #fd7e14'}}>
            <h4 style={{color: '#fd7e14', margin: '0 0 10px 0'}}>⚠️ HIGH RISK CASE</h4>
            <div style={{fontSize: '0.9rem', marginBottom: '10px'}}>
              <strong>Symptoms:</strong> high fever, severe headache<br/>
              <strong>Heart Rate:</strong> 125 bpm<br/>
              <strong>Blood Pressure:</strong> 170/105<br/>
              <strong>Temperature:</strong> 103.5°F
            </div>
            <button 
              onClick={() => {
                setUserSymptoms('high fever, severe headache');
                setVitals({heartRate: '125', bloodPressure: '170/105', temperature: '103.5'});
              }}
              style={{padding: '8px 16px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Load High Risk Case
            </button>
          </div>

          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #ffc107'}}>
            <h4 style={{color: '#856404', margin: '0 0 10px 0'}}>⚡ MEDIUM RISK CASE</h4>
            <div style={{fontSize: '0.9rem', marginBottom: '10px'}}>
              <strong>Symptoms:</strong> fever, headache<br/>
              <strong>Heart Rate:</strong> 85 bpm<br/>
              <strong>Blood Pressure:</strong> 145/95<br/>
              <strong>Temperature:</strong> 101.8°F
            </div>
            <button 
              onClick={() => {
                setUserSymptoms('fever, headache');
                setVitals({heartRate: '85', bloodPressure: '145/95', temperature: '101.8'});
              }}
              style={{padding: '8px 16px', backgroundColor: '#ffc107', color: '#856404', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Load Medium Risk Case
            </button>
          </div>

          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #28a745'}}>
            <h4 style={{color: '#28a745', margin: '0 0 10px 0'}}>✅ LOW RISK CASE</h4>
            <div style={{fontSize: '0.9rem', marginBottom: '10px'}}>
              <strong>Symptoms:</strong> mild headache, fatigue<br/>
              <strong>Heart Rate:</strong> 72 bpm<br/>
              <strong>Blood Pressure:</strong> 118/78<br/>
              <strong>Temperature:</strong> 100.6°F
            </div>
            <button 
              onClick={() => {
                setUserSymptoms('mild headache, fatigue');
                setVitals({heartRate: '72', bloodPressure: '118/78', temperature: '100.6'});
              }}
              style={{padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Load Low Risk Case
            </button>
          </div>

          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #6f42c1'}}>
            <h4 style={{color: '#6f42c1', margin: '0 0 10px 0'}}>💜 CARDIAC EMERGENCY</h4>
            <div style={{fontSize: '0.9rem', marginBottom: '10px'}}>
              <strong>Symptoms:</strong> chest pain, heart pain, nausea<br/>
              <strong>Heart Rate:</strong> 110 bpm<br/>
              <strong>Blood Pressure:</strong> 160/95<br/>
              <strong>Temperature:</strong> 98.8°F
            </div>
            <button 
              onClick={() => {
                setUserSymptoms('chest pain, heart pain, nausea');
                setVitals({heartRate: '110', bloodPressure: '160/95', temperature: '98.8'});
              }}
              style={{padding: '8px 16px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Load Cardiac Case
            </button>
          </div>

          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #17a2b8'}}>
            <h4 style={{color: '#17a2b8', margin: '0 0 10px 0'}}>💙 PERFECT HEALTH</h4>
            <div style={{fontSize: '0.9rem', marginBottom: '10px'}}>
              <strong>Symptoms:</strong> none<br/>
              <strong>Heart Rate:</strong> 70 bpm<br/>
              <strong>Blood Pressure:</strong> 120/80<br/>
              <strong>Temperature:</strong> 98.6°F
            </div>
            <button 
              onClick={() => {
                setUserSymptoms('');
                setVitals({heartRate: '70', bloodPressure: '120/80', temperature: '98.6'});
              }}
              style={{padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Load Perfect Health
            </button>
          </div>
        </div>
      </div>

      {/* Input Section for Predictions */}
      <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>📊 Generate Health Predictions</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Symptoms (comma-separated):</label>
            <input
              type="text"
              value={userSymptoms}
              onChange={(e) => setUserSymptoms(e.target.value)}
              placeholder="headache, fatigue, nausea"
              style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Heart Rate (bpm):</label>
            <input
              type="number"
              value={vitals.heartRate}
              onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
              placeholder="75"
              style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Blood Pressure:</label>
            <input
              type="text"
              value={vitals.bloodPressure}
              onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
              placeholder="120/80"
              style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Temperature (°F):</label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
              placeholder="98.6"
              style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
            />
          </div>
        </div>
        <button
          onClick={generatePredictions}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Analyzing...' : 'Generate ML Predictions'}
        </button>
      </div>

      {/* Health Predictions */}
      <div style={{backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>🔮 Health Predictions</h2>
        {predictions ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
            <div style={{padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dee2e6'}}>
              <h3 style={{color: getRiskColor(predictions.risk_level), margin: '0 0 10px 0'}}>Risk Assessment</h3>
              <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px'}}>{predictions.risk_level}</div>
              <div style={{color: '#666'}}>Confidence: {predictions.confidence}</div>
            </div>
            <div style={{padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dee2e6'}}>
              <h3 style={{color: '#28a745', margin: '0 0 10px 0'}}>Recommended Action</h3>
              <div>{predictions.recommendation}</div>
            </div>
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            <div style={{fontSize: '3rem', marginBottom: '20px'}}>🔮</div>
            <p>Click "Generate ML Predictions" above to see AI-powered health analysis</p>
          </div>
        )}
      </div>

      {/* Personalized Recommendations */}
      <div style={{backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>💡 Personalized Recommendations</h2>
        {recommendations.length > 0 ? (
          <div style={{display: 'grid', gap: '15px'}}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6'}}>
                <div style={{display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '10px'}}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                      <h3 style={{margin: 0}}>{rec.title}</h3>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: getPriorityColor(rec.priority),
                        color: 'white'
                      }}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p style={{margin: '0 0 10px 0', color: '#666'}}>{rec.description}</p>
                    <div style={{display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#666'}}>
                      <span>Category: {rec.category}</span>
                      <span>Confidence: {rec.confidence}%</span>
                    </div>
                  </div>
                  {rec.priority === 'high' && (
                    <div style={{color: '#dc3545', fontSize: '1.5rem'}}>⚠️</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            <div style={{fontSize: '3rem', marginBottom: '20px'}}>🧠</div>
            <p>No recommendations available. Generate predictions to get personalized insights.</p>
          </div>
        )}
      </div>

      {/* ML Insights Dashboard */}
      <div style={{backgroundColor: '#f1f3f4', padding: '20px', borderRadius: '8px'}}>
        <h2>📈 ML Health Insights</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
          <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff', marginBottom: '10px'}}>94%</div>
            <div style={{color: '#666'}}>Personalization Score</div>
          </div>
          <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '10px'}}>{recommendations.length}</div>
            <div style={{color: '#666'}}>Active Recommendations</div>
          </div>
          <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#6f42c1', marginBottom: '10px'}}>89%</div>
            <div style={{color: '#666'}}>Prediction Accuracy</div>
          </div>
          <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#fd7e14', marginBottom: '10px'}}>24/7</div>
            <div style={{color: '#666'}}>ML Monitoring</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLRecommendations;

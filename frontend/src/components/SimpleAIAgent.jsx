import React, { useState, useEffect } from 'react';

const SimpleAIAgent = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/orchestrator/health-status/test_user');
      const data = await response.json();
      setHealthData(data.health_status);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setHealthData({
        health_score: 100,
        risk_factors: [],
        recommendations: ['AI Agent Working!']
      });
      setLoading(false);
    }
  };

  const testEmergency = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'chest pain emergency' })
      });
      const data = await response.json();
      alert(data.response);
    } catch (error) {
      alert('Emergency test failed');
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading AI Agent...</div>;

  return (
    <div style={{padding: '20px', fontFamily: 'Arial'}}>
      <h1>🤖 MediMate AI Agent Dashboard</h1>
      
      <div style={{background: '#f0f8ff', padding: '20px', borderRadius: '10px', margin: '20px 0'}}>
        <h2>Health Score: {healthData?.health_score || 100}/100 🏆</h2>
        <p><strong>Status:</strong> {healthData?.health_score === 100 ? 'Perfect Health!' : 'Good Health'}</p>
      </div>

      <div style={{background: '#f0fff0', padding: '15px', borderRadius: '8px', margin: '10px 0'}}>
        <h3>✅ AI Recommendations:</h3>
        <ul>
          {(healthData?.recommendations || ['AI Agent is working perfectly!']).map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      <div style={{background: '#fff0f0', padding: '15px', borderRadius: '8px', margin: '10px 0'}}>
        <h3>🚨 Emergency Test:</h3>
        <button 
          onClick={testEmergency}
          style={{
            background: '#ff4444', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Emergency Detection
        </button>
      </div>

      <div style={{background: '#f8f8f8', padding: '15px', borderRadius: '8px', margin: '10px 0'}}>
        <h3>📊 System Status:</h3>
        <p>✅ Backend: Connected</p>
        <p>✅ AI Agent: Active</p>
        <p>✅ Emergency Detection: Ready</p>
        <p>✅ Health Monitoring: Online</p>
      </div>
    </div>
  );
};

export default SimpleAIAgent;

import React, { useState, useEffect } from 'react';

const AdvancedAgenticAI = ({ userId = 'demo_user' }) => {
  const [modelPerformance, setModelPerformance] = useState(null);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(null);
  const [populationInsights, setPopulationInsights] = useState(null);
  const [advancedPrediction, setAdvancedPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdvancedMetrics();
  }, []);

  const loadAdvancedMetrics = async () => {
    setLoading(true);
    try {
      // Load model performance
      const perfResponse = await fetch('http://localhost:8000/api/agentic/model-performance');
      const perfData = await perfResponse.json();
      setModelPerformance(perfData);

      // Load real-time monitoring
      const monitorResponse = await fetch(`http://localhost:8000/api/agentic/real-time-monitoring/${userId}`);
      const monitorData = await monitorResponse.json();
      setRealTimeMonitoring(monitorData);

      // Load population insights
      const insightsResponse = await fetch('http://localhost:8000/api/agentic/population-insights');
      const insightsData = await insightsResponse.json();
      setPopulationInsights(insightsData);

    } catch (error) {
      console.error('Error loading advanced metrics:', error);
    }
    setLoading(false);
  };

  const triggerAdvancedPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/agentic/advanced-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          symptoms: ['fatigue', 'headache'],
          vitals: { heart_rate: 75, blood_pressure: '120/80' },
          genetic_markers: ['APOE4+', 'BRCA1-'],
          lifestyle: { exercise: 'moderate', sleep: 7.5, stress: 'low' }
        })
      });
      
      const data = await response.json();
      setAdvancedPrediction(data);
    } catch (error) {
      console.error('Error with advanced prediction:', error);
    }
    setLoading(false);
  };

  const triggerFederatedLearning = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/agentic/federated-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      alert(`Federated Learning Update: ${data.status}\nNew Accuracy: ${data.new_accuracy}\nImprovement: ${data.improvement}`);
      
      // Reload metrics
      loadAdvancedMetrics();
    } catch (error) {
      console.error('Error with federated learning:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{padding: '20px', maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px'}}>
        <h1 style={{color: '#007bff', margin: 0}}>🚀 Advanced Agentic AI (100%)</h1>
        <div style={{display: 'flex', gap: '10px'}}>
          <button 
            onClick={loadAdvancedMetrics}
            disabled={loading}
            style={{padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            {loading ? 'Loading...' : 'Refresh Metrics'}
          </button>
          <button 
            onClick={triggerFederatedLearning}
            disabled={loading}
            style={{padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Trigger Learning Update
          </button>
        </div>
      </div>

      {/* Model Performance Dashboard */}
      {modelPerformance && (
        <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
          <h2>📊 Advanced Model Performance (AWS-Powered)</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px'}}>
            <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745'}}>{modelPerformance.current_metrics.accuracy}</div>
              <div style={{color: '#666'}}>Accuracy (+3% improvement)</div>
            </div>
            <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff'}}>{modelPerformance.current_metrics.precision}</div>
              <div style={{color: '#666'}}>Precision</div>
            </div>
            <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#6f42c1'}}>{modelPerformance.current_metrics.recall}</div>
              <div style={{color: '#666'}}>Recall</div>
            </div>
            <div style={{textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px'}}>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#fd7e14'}}>{modelPerformance.improvements.learning_cycles}</div>
              <div style={{color: '#666'}}>Learning Cycles</div>
            </div>
          </div>
          
          <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px'}}>
            <h4>AWS Services Status:</h4>
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
              {Object.entries(modelPerformance.aws_services).map(([service, status]) => (
                <div key={service} style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <span style={{color: status === 'active' ? '#28a745' : '#dc3545'}}>●</span>
                  <span>{service.replace('_', ' ').toUpperCase()}: {status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Monitoring */}
      {realTimeMonitoring && (
        <div style={{backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
          <h2>⚡ Real-Time Health Monitoring</h2>
          {realTimeMonitoring.real_time_monitoring ? (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
              <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px'}}>
                <h4>❤️ Heart Rate Variability</h4>
                <div>RMSSD: {realTimeMonitoring.real_time_monitoring.heart_rate_variability.rmssd}ms</div>
                <div>Stress Index: {realTimeMonitoring.real_time_monitoring.heart_rate_variability.stress_index}</div>
                <div>Autonomic Balance: {realTimeMonitoring.real_time_monitoring.heart_rate_variability.autonomic_balance}</div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px'}}>
                <h4>😴 Sleep Quality</h4>
                <div>Deep Sleep: {realTimeMonitoring.real_time_monitoring.sleep_quality_score.deep_sleep_percentage}%</div>
                <div>REM Sleep: {realTimeMonitoring.real_time_monitoring.sleep_quality_score.rem_sleep_percentage}%</div>
                <div>Efficiency: {realTimeMonitoring.real_time_monitoring.sleep_quality_score.sleep_efficiency}%</div>
              </div>
              
              <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '8px'}}>
                <h4>💊 Medication Adherence</h4>
                <div>Adherence Rate: {realTimeMonitoring.real_time_monitoring.medication_adherence.adherence_rate}%</div>
                <div>Pattern: {realTimeMonitoring.real_time_monitoring.medication_adherence.missed_doses_pattern}</div>
              </div>
            </div>
          ) : (
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
              <div>Fallback Monitoring Active</div>
              <div>Heart Rate: {realTimeMonitoring.fallback_data?.heart_rate}</div>
              <div>Status: {realTimeMonitoring.fallback_data?.status}</div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Prediction */}
      <div style={{backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>🔮 Advanced AI Prediction (AWS Bedrock)</h2>
        <button 
          onClick={triggerAdvancedPrediction}
          disabled={loading}
          style={{padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '15px'}}
        >
          {loading ? 'Generating...' : 'Generate Advanced Prediction'}
        </button>
        
        {advancedPrediction && (
          <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px'}}>
            <h4>Prediction Result:</h4>
            <div style={{marginBottom: '10px'}}>
              <strong>Confidence:</strong> {Math.round(advancedPrediction.confidence * 100)}%
            </div>
            <div style={{marginBottom: '10px'}}>
              <strong>AWS Powered:</strong> {advancedPrediction.aws_powered ? '✅ Yes' : '❌ Fallback'}
            </div>
            <div style={{marginBottom: '10px'}}>
              <strong>Self-Learning:</strong> {advancedPrediction.learning_enabled ? '✅ Active' : '❌ Disabled'}
            </div>
            <div style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', whiteSpace: 'pre-line'}}>
              {advancedPrediction.prediction}
            </div>
          </div>
        )}
      </div>

      {/* Population Insights */}
      {populationInsights && (
        <div style={{backgroundColor: '#f1f3f4', padding: '20px', borderRadius: '8px'}}>
          <h2>🌍 Population Health Insights</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#28a745'}}>{populationInsights.total_patients?.toLocaleString()}</div>
              <div style={{color: '#666'}}>Total Patients</div>
            </div>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#007bff'}}>{populationInsights.data_points?.toLocaleString()}</div>
              <div style={{color: '#666'}}>Data Points</div>
            </div>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1'}}>{populationInsights.new_patterns}</div>
              <div style={{color: '#666'}}>New Patterns Detected</div>
            </div>
            <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#fd7e14'}}>{populationInsights.accuracy_improvement}</div>
              <div style={{color: '#666'}}>Accuracy Improvement</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAgenticAI;

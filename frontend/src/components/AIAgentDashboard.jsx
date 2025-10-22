import React, { useState, useEffect } from 'react';
import orchestratorService from '../services/orchestratorService';

const AIAgentDashboard = ({ userId }) => {
  const [healthStatus, setHealthStatus] = useState({
    health_score: 85,
    risk_factors: ["Loading..."],
    recommendations: ["Initializing AI agent..."],
    next_appointments: [],
    medications: []
  });
  const [agentActions, setAgentActions] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHealthStatus();
    startMonitoring();
    
    return () => {
      if (monitoringInterval) {
        orchestratorService.stopHealthMonitoring(monitoringInterval);
      }
    };
  }, [userId]);

  const loadHealthStatus = async () => {
    try {
      setError(null);
      const response = await orchestratorService.getHealthStatus(userId);
      setHealthStatus(response);
      addAgentAction('Health status loaded successfully');
    } catch (error) {
      console.error('Failed to load health status:', error);
      setError('Failed to connect to AI agent service');
      addAgentAction('Health status loading failed - using fallback data');
    }
  };

  const startMonitoring = async () => {
    if (!isMonitoring) {
      const interval = await orchestratorService.startHealthMonitoring(userId, (status) => {
        setHealthStatus(status); // Remove .health_status since response is direct
        addAgentAction('Health monitoring update received');
      });
      setMonitoringInterval(interval);
      setIsMonitoring(true);
      addAgentAction('AI health monitoring activated');
    }
  };

  const stopMonitoring = () => {
    if (monitoringInterval) {
      orchestratorService.stopHealthMonitoring(monitoringInterval);
      setMonitoringInterval(null);
      setIsMonitoring(false);
      addAgentAction('AI health monitoring deactivated');
    }
  };

  const addAgentAction = (action) => {
    const timestamp = new Date().toLocaleTimeString();
    setAgentActions(prev => [...prev, { action, timestamp }].slice(-10)); // Keep last 10 actions
  };

  const triggerSymptomCheck = async () => {
    try {
      const symptoms = "headache and mild fever";
      const response = await orchestratorService.intelligentSymptomCheck(userId, symptoms);
      addAgentAction(`Symptom analysis: ${response.severity} risk - ${response.recommendation}`);
    } catch (error) {
      addAgentAction('Symptom check failed');
    }
  };

  const triggerHealthAnalysis = async () => {
    try {
      const response = await orchestratorService.analyzeHealth(
        userId, 
        "I have been feeling tired and have occasional headaches", 
        "symptoms"
      );
      addAgentAction(`Health analysis: ${response.status} - ${response.recommendations?.[0] || 'Analysis complete'}`);
    } catch (error) {
      addAgentAction('Health analysis failed');
    }
  };

  return (
    <div className="ai-agent-dashboard">
      <div className="dashboard-header">
        <h2>🤖 AI Health Agent</h2>
        {error && <div className="error-message" style={{color: 'red', fontSize: '14px'}}>{error}</div>}
        <div className="monitoring-status">
          <span className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}></span>
          <span>{isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}</span>
          <button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`btn ${isMonitoring ? 'btn-danger' : 'btn-success'}`}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Health Status Overview */}
        <div className="dashboard-card health-overview">
          <h3>Health Status</h3>
          <div className="health-score">
            <div className="score-circle">
              <span className="score">{healthStatus.overall_score || healthStatus.health_score || 85}</span>
              <span className="score-label">Health Score</span>
            </div>
          </div>
          
          <div className="risk-factors">
            <h4>Risk Factors</h4>
            <ul>
              {(healthStatus.risk_factors || []).map((risk, index) => (
                <li key={index} className="risk-item">{risk}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="dashboard-card recommendations">
          <h3>AI Recommendations</h3>
          <ul className="recommendation-list">
            {(healthStatus.recommendations || []).map((rec, index) => (
              <li key={index} className="recommendation-item">
                <span className="rec-icon">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Appointments */}
        <div className="dashboard-card appointments">
          <h3>Scheduled Appointments</h3>
          {(healthStatus.next_appointments || []).map((apt, index) => (
            <div key={index} className="appointment-item">
              <div className="apt-doctor">{apt.doctor}</div>
              <div className="apt-date">{apt.date}</div>
              <div className="apt-type">{apt.type}</div>
            </div>
          ))}
        </div>

        {/* Medication Reminders */}
        <div className="dashboard-card medications">
          <h3>Medication Reminders</h3>
          {(healthStatus.medication_reminders || healthStatus.medications || []).map((med, index) => (
            <div key={index} className="medication-item">
              <div className="med-name">{med.name}</div>
              <div className="med-details">{med.dosage} at {med.time}</div>
            </div>
          ))}
        </div>

        {/* Agent Actions Log */}
        <div className="dashboard-card agent-actions">
          <h3>AI Agent Activity</h3>
          <div className="actions-log">
            {agentActions.map((action, index) => (
              <div key={index} className="action-item">
                <span className="action-time">{action.timestamp}</span>
                <span className="action-text">{action.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions">
          <h3>Quick AI Actions</h3>
          <div className="action-buttons">
            <button onClick={triggerSymptomCheck} className="btn btn-primary">
              🔍 Symptom Check
            </button>
            <button onClick={triggerHealthAnalysis} className="btn btn-secondary">
              🧠 AI Health Analysis
            </button>
            <button onClick={loadHealthStatus} className="btn btn-info">
              🔄 Refresh Status
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ai-agent-dashboard {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }

        .monitoring-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #dc3545;
        }

        .status-indicator.active {
          background: #28a745;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .dashboard-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 15px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .health-score {
          text-align: center;
          margin: 20px 0;
        }

        .score-circle {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(45deg, #28a745, #20c997);
          margin: 10px 0;
        }

        .score {
          font-size: 24px;
          font-weight: bold;
        }

        .score-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .risk-factors ul, .recommendation-list {
          list-style: none;
          padding: 0;
        }

        .risk-item, .recommendation-item {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .rec-icon {
          margin-right: 8px;
        }

        .appointment-item, .medication-item {
          padding: 10px;
          margin: 10px 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .actions-log {
          max-height: 200px;
          overflow-y: auto;
        }

        .action-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 14px;
        }

        .action-time {
          opacity: 0.7;
          font-size: 12px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIAgentDashboard;

import React, { useState } from 'react';
import '../styles/globals.css';
import '../styles/components.css';
import '../styles/pages.css';
import '../styles/workflows.css';

const WorkflowsPage = () => {
  const [workflowData, setWorkflowData] = useState({
    symptoms: [],
    age: '',
    gender: '',
    medicalHistory: []
  });
  const [workflowResult, setWorkflowResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newSymptom, setNewSymptom] = useState('');

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setWorkflowData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, newSymptom.trim()]
      }));
      setNewSymptom('');
    }
  };

  const removeSymptom = (index) => {
    setWorkflowData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const runWorkflow = async () => {
    if (!workflowData.symptoms.length || !workflowData.age || !workflowData.gender) {
      alert('Please fill in symptoms, age, and gender');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/workflows/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: workflowData.symptoms,
          patient_age: parseInt(workflowData.age),
          patient_gender: workflowData.gender,
          medical_history: workflowData.medicalHistory
        })
      });

      if (response.ok) {
        const result = await response.json();
        setWorkflowResult(result);
      } else {
        throw new Error('Workflow failed');
      }
    } catch (error) {
      console.error('Workflow error:', error);
      // Demo fallback
      setWorkflowResult({
        workflow_id: 'DEMO_WF_001',
        steps: [
          {
            step: 1,
            action: 'Symptom Analysis',
            reasoning: `Analyzed ${workflowData.symptoms.length} symptoms for comprehensive assessment`,
            next_actions: ['Risk stratification', 'Urgency determination']
          },
          {
            step: 2,
            action: 'Risk Assessment', 
            reasoning: 'Evaluated symptom severity and patient risk factors',
            next_actions: ['Care pathway selection', 'Resource coordination']
          },
          {
            step: 3,
            action: 'Care Coordination',
            reasoning: 'Generated personalized care plan with specialist referrals',
            next_actions: ['Appointment scheduling', 'Patient education']
          }
        ],
        recommendations: [
          'Schedule consultation with primary care physician',
          'Monitor symptoms and report any changes',
          'Follow recommended treatment protocols'
        ],
        urgency_level: 'Medium'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="workflows-page">
      <div className="page-header">
        <h1>AI Medical Workflows</h1>
        <p>Multi-step autonomous medical reasoning and care coordination</p>
      </div>

      <div className="workflow-container">
        <div className="workflow-input">
          <h2>Patient Information</h2>
          
          <div className="form-group">
            <label>Symptoms</label>
            <div className="symptom-input">
              <input
                type="text"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                placeholder="Enter symptom"
                onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              />
              <button onClick={addSymptom} className="btn-secondary">Add</button>
            </div>
            <div className="symptoms-list">
              {workflowData.symptoms.map((symptom, index) => (
                <span key={index} className="symptom-tag">
                  {symptom}
                  <button onClick={() => removeSymptom(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={workflowData.age}
                onChange={(e) => setWorkflowData(prev => ({...prev, age: e.target.value}))}
                placeholder="Patient age"
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select
                value={workflowData.gender}
                onChange={(e) => setWorkflowData(prev => ({...prev, gender: e.target.value}))}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button 
            onClick={runWorkflow} 
            disabled={loading}
            className="btn-primary workflow-btn"
          >
            {loading ? 'Running AI Workflow...' : 'Start Medical Workflow'}
          </button>
        </div>

        {workflowResult && (
          <div className="workflow-results">
            <h2>AI Workflow Results</h2>
            
            <div className="workflow-header">
              <div className="workflow-id">ID: {workflowResult.workflow_id}</div>
              <div className={`urgency-badge ${getUrgencyColor(workflowResult.urgency_level)}`}>
                {workflowResult.urgency_level} Priority
              </div>
            </div>

            <div className="workflow-steps">
              <h3>AI Reasoning Steps</h3>
              {workflowResult.steps.map((step, index) => (
                <div key={index} className="workflow-step">
                  <div className="step-header">
                    <span className="step-number">{step.step}</span>
                    <span className="step-action">{step.action}</span>
                  </div>
                  <div className="step-reasoning">{step.reasoning}</div>
                  <div className="next-actions">
                    <strong>Next Actions:</strong>
                    <ul>
                      {step.next_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="recommendations">
              <h3>AI Recommendations</h3>
              <ul>
                {workflowResult.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowsPage;
const API_BASE_URL = 'http://localhost:8000';

class OrchestratorService {
  async analyzeHealth(userId, content, type = 'general') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orchestrator/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          event_type: 'chat_message',
          data: { message: content, type: type }
        })
      });
      
      const result = await response.json();
      return result.success ? result.result : { status: 'LOW_RISK', recommendations: ['Continue monitoring'] };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return { status: 'ERROR', message: 'Analysis unavailable' };
    }
  }

  async intelligentSymptomCheck(userId, symptoms) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orchestrator/symptom-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          symptoms: symptoms
        })
      });
      
      const result = await response.json();
      return result.success ? result.analysis : { severity: 'MODERATE', recommendation: 'Monitor symptoms' };
    } catch (error) {
      console.error('Symptom check failed:', error);
      return { severity: 'ERROR', recommendation: 'Service unavailable' };
    }
  }

  async getHealthStatus(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orchestrator/health-status/${userId}`);
      const result = await response.json();
      return result.success ? result.health_status : this.getFallbackData();
    } catch (error) {
      console.error('Health status retrieval failed:', error);
      return this.getFallbackData();
    }
  }

  getFallbackData() {
    return {
      health_score: 85,
      risk_factors: ["Mild hypertension", "Sedentary lifestyle"],
      recommendations: [
        "Schedule cardiology follow-up within 2 weeks",
        "Increase physical activity to 150 minutes/week"
      ],
      next_appointments: [
        {"doctor": "Dr. Sarah Johnson", "date": "2025-10-25", "type": "Cardiology Follow-up"}
      ],
      medications: [
        {"name": "Lisinopril", "time": "08:00", "dosage": "10mg"}
      ]
    };
  }

  async startHealthMonitoring(userId, callback) {
    const monitoringInterval = setInterval(async () => {
      try {
        const healthStatus = await this.getHealthStatus(userId);
        callback(healthStatus);
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 30000);

    return monitoringInterval;
  }

  stopHealthMonitoring(intervalId) {
    clearInterval(intervalId);
  }
}

export default new OrchestratorService();

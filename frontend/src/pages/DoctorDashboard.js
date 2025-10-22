import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Sample data for realistic dashboard
  const samplePatients = [
    { id: 1, name: "Sarah Johnson", age: 34, condition: "Hypertension", lastVisit: "2025-10-18", status: "Stable", priority: "Normal" },
    { id: 2, name: "Michael Chen", age: 45, condition: "Diabetes Type 2", lastVisit: "2025-10-20", status: "Monitoring", priority: "High" },
    { id: 3, name: "Emma Davis", age: 28, condition: "Anxiety Disorder", lastVisit: "2025-10-19", status: "Improving", priority: "Normal" },
    { id: 4, name: "Robert Wilson", age: 67, condition: "Heart Disease", lastVisit: "2025-10-17", status: "Critical", priority: "Urgent" }
  ];

  const todayAppointments = [
    { time: "09:00 AM", patient: "John Smith", type: "Consultation", duration: "30 min", status: "Confirmed" },
    { time: "10:30 AM", patient: "Lisa Brown", type: "Follow-up", duration: "15 min", status: "Confirmed" },
    { time: "02:00 PM", patient: "David Wilson", type: "Check-up", duration: "45 min", status: "Pending" },
    { time: "03:30 PM", patient: "Maria Garcia", type: "Consultation", duration: "30 min", status: "Confirmed" }
  ];

  const recentPrescriptions = [
    { patient: "Sarah Johnson", medication: "Lisinopril 10mg", date: "2025-10-20", status: "Active" },
    { patient: "Michael Chen", medication: "Metformin 500mg", date: "2025-10-19", status: "Active" },
    { patient: "Emma Davis", medication: "Sertraline 50mg", date: "2025-10-18", status: "Active" }
  ];

  const labResults = [
    { patient: "Robert Wilson", test: "Cardiac Enzymes", date: "2025-10-20", status: "Critical", result: "Elevated" },
    { patient: "Michael Chen", test: "HbA1c", date: "2025-10-19", status: "Normal", result: "7.2%" },
    { patient: "Sarah Johnson", test: "Blood Pressure", date: "2025-10-18", status: "Improved", result: "130/85" }
  ];

  const quickActions = [
    {
      icon: '👤',
      title: 'View Patients',
      description: 'Access patient records and history',
      action: () => setActiveSection('patients'),
      color: 'blue'
    },
    {
      icon: '📝',
      title: 'Write Prescription',
      description: 'Create digital prescriptions',
      action: () => setActiveSection('prescriptions'),
      color: 'purple'
    },
    {
      icon: '🎥',
      title: 'Start Consultation',
      description: 'Video/chat with patients',
      action: () => navigate('/chat'),
      color: 'green'
    },
    {
      icon: '📊',
      title: 'Lab Reports',
      description: 'Review test results',
      action: () => setActiveSection('labs'),
      color: 'orange'
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500">Total Patients</h3>
              <p className="text-2xl font-bold text-blue-600">127</p>
            </div>
            <div className="text-blue-500 text-2xl">👥</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500">Today's Appointments</h3>
              <p className="text-2xl font-bold text-green-600">{todayAppointments.length}</p>
            </div>
            <div className="text-green-500 text-2xl">📅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500">Pending Reports</h3>
              <p className="text-2xl font-bold text-yellow-600">8</p>
            </div>
            <div className="text-yellow-500 text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500">Active Prescriptions</h3>
              <p className="text-2xl font-bold text-purple-600">23</p>
            </div>
            <div className="text-purple-500 text-2xl">💊</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
            <div className="text-center">
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className={`text-lg font-semibold mb-2 text-${action.color}-600`}>{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">📅 Today's Schedule</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {todayAppointments.map((apt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{apt.time}</p>
                    <p className="text-sm text-gray-600">{apt.patient}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{apt.type}</p>
                    <p className="text-xs text-gray-500">{apt.duration}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              View Full Schedule
            </button>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">👥 Recent Patients</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {samplePatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{patient.name}</p>
                    <p className="text-sm text-gray-600">Age {patient.age} • {patient.condition}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{patient.lastVisit}</p>
                    <div className="flex gap-1 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        patient.status === 'Stable' ? 'bg-green-100 text-green-800' :
                        patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        patient.status === 'Monitoring' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {patient.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        patient.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        patient.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
              View All Patients
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lab Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">🔬 Recent Lab Results</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {labResults.map((lab, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{lab.patient}</p>
                    <p className="text-sm text-gray-600">{lab.test}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{lab.result}</p>
                    <p className="text-xs text-gray-500">{lab.date}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lab.status === 'Critical' ? 'bg-red-100 text-red-800' :
                      lab.status === 'Normal' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lab.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
              Review All Results
            </button>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">💊 Recent Prescriptions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentPrescriptions.map((prescription, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{prescription.patient}</p>
                    <p className="text-sm text-gray-600">{prescription.medication}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{prescription.date}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      {prescription.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600">
              Create New Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">👨‍⚕️ Dr. Smith's Dashboard</h1>
            <p className="text-gray-600">Internal Medicine • MediMate Hospital</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today: {new Date().toLocaleDateString()}</p>
              <p className="text-sm font-medium text-green-600">{todayAppointments.length} appointments scheduled</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b px-6">
        <div className="flex space-x-8">
          {['dashboard', 'patients', 'appointments', 'prescriptions', 'labs'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeSection === section
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'patients' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Patient Management</h2>
            <p className="text-gray-600">Patient management interface would be implemented here.</p>
          </div>
        )}
        {activeSection === 'appointments' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Appointment Management</h2>
            <p className="text-gray-600">Appointment scheduling interface would be implemented here.</p>
          </div>
        )}
        {activeSection === 'prescriptions' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Prescription Management</h2>
            <p className="text-gray-600">Digital prescription interface would be implemented here.</p>
          </div>
        )}
        {activeSection === 'labs' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Laboratory Results</h2>
            <p className="text-gray-600">Lab results analysis interface would be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import ChatPage from './pages/ChatPage';
import BloodDonation from './pages/BloodDonation';
import Appointments from './pages/Appointments';
import Profile from './pages/Profile';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompleteAIDashboard from './components/CompleteAIDashboard';
import DocumentUpload from './components/DocumentUpload';
import PersonalizedAI from './components/PersonalizedAI';
import MLRecommendations from './components/MLRecommendations';
import AINavigation from './components/AINavigation';
import AdvancedAgenticAI from './components/AdvancedAgenticAI';
import './index.css';

// Simple Doctor Dashboard
const DoctorInterface = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-600">👨‍⚕️ Doctor Dashboard</h1>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">👤 My Patients</h3>
            <p className="text-gray-600 mb-4">View and manage patient records</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">View Patients</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">📅 Appointments</h3>
            <p className="text-gray-600 mb-4">Manage your schedule</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded">View Schedule</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">📝 Prescriptions</h3>
            <p className="text-gray-600 mb-4">Write digital prescriptions</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded">New Prescription</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Admin Dashboard
const AdminInterface = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-600">🔧 Admin Dashboard</h1>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">🏥 System Management</h3>
            <p className="text-gray-600 mb-4">Manage platform settings</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">System Settings</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">👥 User Management</h3>
            <p className="text-gray-600 mb-4">Manage all users</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded">Manage Users</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">📊 Analytics</h3>
            <p className="text-gray-600 mb-4">Platform statistics</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded">View Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const mockUser = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    role: 'patient'
  };

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div style={{ minHeight: '100vh' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Role-based Interfaces */}
          <Route path="/patient" element={<Homepage />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Advanced Agentic AI (100%) */}
          <Route path="/advanced-ai" element={<AdvancedAgenticAI userId="demo_user" />} />
          
          {/* AI Navigation Hub */}
          <Route path="/ai" element={<AINavigation />} />
          
          {/* AI Agent Dashboard */}
          <Route path="/ai-agent" element={<CompleteAIDashboard userId="demo_user" />} />
          
          {/* Personalized AI */}
          <Route path="/personalized" element={<PersonalizedAI userId="demo_user" />} />
          
          {/* ML Recommendations */}
          <Route path="/ml" element={<MLRecommendations userId="demo_user" />} />
          
          {/* Document Upload */}
          <Route path="/documents" element={<DocumentUpload userId="demo_user" />} />
          
          {/* Feature Routes */}
          <Route path="/chat" element={<ChatPage user={mockUser} />} />
          <Route path="/blood-donation" element={<BloodDonation />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

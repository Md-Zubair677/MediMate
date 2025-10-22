import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Sample data for realistic admin dashboard
  const systemStats = {
    totalUsers: 1247,
    totalDoctors: 89,
    totalPatients: 1158,
    activeAppointments: 156,
    systemUptime: "99.8%",
    serverLoad: "23%"
  };

  const recentUsers = [
    { id: 1, name: "Dr. Sarah Wilson", role: "Doctor", specialty: "Cardiology", joinDate: "2024-10-20", status: "Active" },
    { id: 2, name: "John Patient", role: "Patient", age: 45, joinDate: "2024-10-19", status: "Active" },
    { id: 3, name: "Dr. Michael Chen", role: "Doctor", specialty: "Internal Medicine", joinDate: "2024-10-18", status: "Pending" },
    { id: 4, name: "Emma Johnson", role: "Patient", age: 32, joinDate: "2024-10-17", status: "Active" }
  ];

  const systemAlerts = [
    { type: "Critical", message: "Server CPU usage above 80%", time: "2 min ago", severity: "high" },
    { type: "Warning", message: "Database backup completed with warnings", time: "15 min ago", severity: "medium" },
    { type: "Info", message: "New doctor registration pending approval", time: "1 hour ago", severity: "low" },
    { type: "Success", message: "System security scan completed", time: "2 hours ago", severity: "success" }
  ];

  const hospitalStats = [
    { name: "MediMate Central", doctors: 25, patients: 450, status: "Operational", load: "High" },
    { name: "MediMate North", doctors: 18, patients: 320, status: "Operational", load: "Medium" },
    { name: "MediMate South", doctors: 22, patients: 388, status: "Maintenance", load: "Low" },
    { name: "MediMate East", doctors: 24, patients: 400, status: "Operational", load: "High" }
  ];

  const recentActivities = [
    { action: "User Registration", user: "Emma Davis", details: "New patient registered", time: "5 min ago" },
    { action: "Doctor Approval", user: "Dr. Robert Kim", details: "Cardiology specialist approved", time: "12 min ago" },
    { action: "System Backup", user: "System", details: "Daily backup completed", time: "1 hour ago" },
    { action: "Security Update", user: "Admin", details: "Security patches applied", time: "3 hours ago" }
  ];

  const quickActions = [
    {
      icon: '👥',
      title: 'User Management',
      description: 'Manage doctors and patients',
      action: () => setActiveSection('users'),
      color: 'blue'
    },
    {
      icon: '🏥',
      title: 'Hospital Network',
      description: 'Monitor hospital branches',
      action: () => setActiveSection('hospitals'),
      color: 'green'
    },
    {
      icon: '📊',
      title: 'System Analytics',
      description: 'View system performance',
      action: () => setActiveSection('analytics'),
      color: 'purple'
    },
    {
      icon: '⚙️',
      title: 'System Settings',
      description: 'Configure system parameters',
      action: () => setActiveSection('settings'),
      color: 'orange'
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Doctors</h3>
          <p className="text-2xl font-bold text-green-600">{systemStats.totalDoctors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Patients</h3>
          <p className="text-2xl font-bold text-purple-600">{systemStats.totalPatients}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500">Active Appointments</h3>
          <p className="text-2xl font-bold text-yellow-600">{systemStats.activeAppointments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-gray-500">System Uptime</h3>
          <p className="text-2xl font-bold text-indigo-600">{systemStats.systemUptime}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Server Load</h3>
          <p className="text-2xl font-bold text-red-600">{systemStats.serverLoad}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">🚨 System Alerts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{alert.type}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{alert.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      alert.severity === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
              View All Alerts
            </button>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">👤 Recent Users</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-600">
                      {user.role} {user.specialty && `• ${user.specialty}`} {user.age && `• Age ${user.age}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{user.joinDate}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' :
                      user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              Manage All Users
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Network & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Network Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">🏥 Hospital Network</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {hospitalStats.map((hospital, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{hospital.name}</p>
                    <p className="text-sm text-gray-600">{hospital.doctors} doctors • {hospital.patients} patients</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      hospital.status === 'Operational' ? 'bg-green-100 text-green-800' :
                      hospital.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {hospital.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Load: {hospital.load}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
              Monitor Network
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">📋 Recent Activities</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.user} • {activity.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600">
              View Activity Log
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
            <h1 className="text-2xl font-bold text-blue-600">🔧 Admin Control Center</h1>
            <p className="text-gray-600">System Administrator • MediMate Healthcare Network</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">System Status: <span className="text-green-600 font-medium">Operational</span></p>
              <p className="text-sm text-gray-500">Last Login: {new Date().toLocaleDateString()}</p>
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
          {['dashboard', 'users', 'hospitals', 'analytics', 'settings', 'security'].map((section) => (
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
        {activeSection === 'users' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <p className="text-gray-600">User management interface with doctor approvals, patient records, and role assignments would be implemented here.</p>
          </div>
        )}
        {activeSection === 'hospitals' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Hospital Network Management</h2>
            <p className="text-gray-600">Hospital network monitoring, resource allocation, and branch management interface would be implemented here.</p>
          </div>
        )}
        {activeSection === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">System Analytics</h2>
            <p className="text-gray-600">Comprehensive analytics dashboard with usage statistics, performance metrics, and reporting tools would be implemented here.</p>
          </div>
        )}
        {activeSection === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">System Settings</h2>
            <p className="text-gray-600">System configuration, feature toggles, and administrative settings interface would be implemented here.</p>
          </div>
        )}
        {activeSection === 'security' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Security Management</h2>
            <p className="text-gray-600">Security monitoring, access controls, audit logs, and compliance management interface would be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

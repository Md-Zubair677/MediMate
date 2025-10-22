import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Activity, TrendingUp, AlertTriangle, 
  Clock, CheckCircle, BarChart3, PieChart 
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard-summary');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-500`} />
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor platform performance and user insights</p>
          
          {/* Period Selector */}
          <div className="mt-4 flex space-x-2">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={dashboardData?.users?.total?.toLocaleString() || '0'}
            change={dashboardData?.users?.growth_rate}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Today"
            value={dashboardData?.users?.active_today || '0'}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Health Predictions"
            value={dashboardData?.health?.predictions_today || '0'}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="High Risk Alerts"
            value={dashboardData?.health?.high_risk_alerts || '0'}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="User Engagement Trends">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Engagement chart visualization</p>
                <p className="text-sm text-gray-400">Daily active users: {dashboardData?.users?.active_today}</p>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Health Risk Distribution">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Risk distribution chart</p>
                <p className="text-sm text-gray-400">Avg risk score: {dashboardData?.health?.avg_risk_score}</p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* System Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="System Uptime"
            value={dashboardData?.system?.uptime || '99.9%'}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Response Time"
            value={dashboardData?.system?.response_time || '250ms'}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Error Rate"
            value={dashboardData?.system?.error_rate || '0.5%'}
            icon={AlertTriangle}
            color="yellow"
          />
        </div>

        {/* Appointments Overview */}
        <ChartCard title="Appointments Overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {dashboardData?.appointments?.booked_today || '0'}
              </p>
              <p className="text-sm text-blue-700">Booked Today</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {dashboardData?.appointments?.pending || '0'}
              </p>
              <p className="text-sm text-yellow-700">Pending</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {dashboardData?.appointments?.completed_this_week || '0'}
              </p>
              <p className="text-sm text-green-700">Completed This Week</p>
            </div>
          </div>
        </ChartCard>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900">Generate Report</h4>
              <p className="text-sm text-gray-600">Create comprehensive analytics report</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900">Export Data</h4>
              <p className="text-sm text-gray-600">Download analytics data as CSV</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900">Set Alerts</h4>
              <p className="text-sm text-gray-600">Configure performance alerts</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

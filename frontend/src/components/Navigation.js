import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout, getCurrentUser, isAuthenticated, demoAuth } from '../utils/auth';

export default function Navigation({ user, onLogout }) {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Update user state when prop changes
  useEffect(() => {
    setCurrentUser(user);
    setIsDemoMode(demoAuth.isDemoMode());
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setShowUserMenu(false);
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still proceed with logout even if backend call fails
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (isAuthenticated()) {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  // Refresh user data on mount
  useEffect(() => {
    refreshUserData();
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/chat', label: 'AI Chat', icon: '💬' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/reports', label: 'Reports', icon: '📋' },
    { path: '/workflows', label: 'AI Workflows', icon: '🔄' },
    { path: '/agent', label: 'AI Agent', icon: '🤖' },
    { path: '/hospitals', label: 'Hospitals', icon: '🏥' }
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-bold">MediMate</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <span className="text-lg">{currentUser?.role === 'doctor' ? '👨‍⚕️' : '👤'}</span>
                <span>{currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser?.name || 'User'}</span>
                {isDemoMode && <span className="text-xs bg-yellow-500 text-black px-1 rounded">DEMO</span>}
                <span className="text-xs">▼</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">
                      {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">{currentUser?.email}</div>
                    <div className="text-xs text-blue-600 capitalize">{currentUser?.role}</div>
                    {isDemoMode && (
                      <div className="text-xs text-yellow-600 font-medium mt-1">
                        🧪 Demo Mode Active
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={refreshUserData}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    🔄 Refresh Profile
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </nav>
  );
}
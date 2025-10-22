import React from 'react';
import { MessageCircle, Droplet, CalendarDays, User } from 'lucide-react';

const HomepageSimple = () => {
  const handleNavigation = (page) => {
    alert(`Navigating to ${page}`);
  };

  const iconButtons = [
    { icon: MessageCircle, label: 'Chat Page', action: () => handleNavigation('Chat Page') },
    { icon: Droplet, label: 'Blood Donation', action: () => handleNavigation('Blood Donation') },
    { icon: CalendarDays, label: 'Book Appointments', action: () => handleNavigation('Book Appointments') },
    { icon: User, label: 'Profile / Health Record', action: () => handleNavigation('Profile / Health Record') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-blue-600">MediMate</h1>

          {/* Navigation Icons */}
          <div className="hidden md:flex space-x-8">
            {iconButtons.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors transform hover:scale-110"
              >
                <item.icon size={24} />
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-600">
              <User size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Welcome Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="font-sans text-xl md:text-2xl text-gray-700 mb-12">
            Welcome to MediMate — Your AI-powered health companion.
          </h2>

          {/* Main Action Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            {iconButtons.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 group"
              >
                <div className="text-blue-600 group-hover:text-blue-700 mb-2">
                  <item.icon size={32} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="text-center text-sm text-gray-500">
          © 2025 MediMate — All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomepageSimple;

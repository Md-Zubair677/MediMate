import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, CalendarDays, User, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BloodDropIcon = ({ size = 32, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M12 2C12 2 6 8 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 8 12 2 12 2Z" 
      fill="currentColor"
      stroke="#3B82F6"
      strokeWidth="2"
    />
  </svg>
);

const Homepage = () => {
  const navigate = useNavigate();

  const handleNavigation = (page) => {
    if (page === 'Chat Page') {
      navigate('/chat');
    } else if (page === 'Blood Donation') {
      navigate('/blood-donation');
    } else if (page === 'My Appointments') {
      navigate('/appointments');
    } else if (page === 'Profile / Health Record') {
      navigate('/profile');
    } else if (page === 'AI Platform') {
      navigate('/ai');
    } else {
      alert(`Navigating to ${page}`);
    }
  };

  const iconButtons = [
    { icon: MessageCircle, label: 'Chat Page', action: () => handleNavigation('Chat Page') },
    { icon: BloodDropIcon, label: 'Blood Donation', action: () => handleNavigation('Blood Donation') },
    { icon: CalendarDays, label: 'My Appointments', action: () => handleNavigation('My Appointments') },
    { icon: User, label: 'Profile / Health Record', action: () => handleNavigation('Profile / Health Record') },
    { icon: () => <span>🤖</span>, label: 'AI Platform', action: () => handleNavigation('AI Platform') }
  ];

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <motion.h1 
            className="text-2xl font-bold text-blue-600"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            MediMate
          </motion.h1>

          {/* Navigation Icons */}
          <div className="hidden md:flex space-x-4">
            <motion.button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <LogIn size={20} />
              <span className="text-sm font-medium">Login</span>
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/signup')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <UserPlus size={20} />
              <span className="text-sm font-medium">Sign Up</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              className="p-2 text-gray-600"
              whileTap={{ scale: 0.95 }}
            >
              <User size={24} />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Welcome Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="font-sans text-xl md:text-2xl text-gray-700 mb-12">
            Welcome to MediMate — Your AI-powered health companion.
          </h2>

          {/* Main Action Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            {iconButtons.map((item, index) => (
              <motion.button
                key={index}
                onClick={item.action}
                className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 + 0.1 * index }}
              >
                <motion.div
                  className="text-blue-600 group-hover:text-blue-700 mb-2"
                  whileHover={{ scale: 1.1 }}
                >
                  {item.icon === BloodDropIcon ? (
                    <BloodDropIcon size={32} className="text-red-600 group-hover:text-red-700" />
                  ) : (
                    <item.icon size={32} />
                  )}
                </motion.div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <motion.div 
          className="text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          © 2025 MediMate — All Rights Reserved.
        </motion.div>
      </footer>
    </motion.div>
  );
};

export default Homepage;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, MapPin, X, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([
    {
      id: 'APT-001',
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      date: '2025-10-25',
      time: '10:00 AM',
      location: 'MediMate Clinic - Room 201',
      status: 'Booked'
    },
    {
      id: 'APT-002', 
      doctor: 'Dr. Michael Chen',
      specialty: 'General Medicine',
      date: '2025-10-28',
      time: '2:30 PM',
      location: 'MediMate Clinic - Room 105',
      status: 'Booked'
    }
  ]);
  const [donations, setDonations] = useState([
    {
      id: 'DON-001',
      date: '2025-10-30',
      time: '11:00 AM',
      location: 'City Blood Bank - Main Center',
      status: 'Scheduled'
    }
  ]);

  useEffect(() => {
    // Only show sample appointments, no API calls
  }, []);

  // Sample appointments only - no API calls

  const cancelAppointment = async (appointmentId) => {
    // Immediately remove from list
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
  };

  const cancelDonation = async (donationId) => {
    // Immediately remove from list
    setDonations(prev => prev.filter(don => don.id !== donationId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-blue-600 flex items-center">
            📅 My Appointments & Donations
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Appointments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2" size={24} />
            Medical Appointments
          </h2>
          
          <div className="grid gap-4">
            {appointments.filter(appointment => 
              appointment.status === 'Booked' || 
              appointment.status === 'Confirmed' || 
              !appointment.status
            ).map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <User className="mr-2 text-blue-600" size={20} />
                        <h3 className="font-semibold text-gray-800">{appointment.doctor}</h3>
                      </div>
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 text-gray-500" size={16} />
                        <span className="text-gray-600">{appointment.date}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Clock className="mr-2 text-gray-500" size={16} />
                        <span className="text-gray-600">{appointment.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 text-gray-500" size={16} />
                        <span className="text-gray-600">{appointment.location || 'MediMate Clinic'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelAppointment(appointment.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
                    >
                      <X size={16} className="mr-1" />
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
        </div>

        {/* Blood Donations Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="mr-2 text-red-500" size={24} />
            Blood Donation Appointments
          </h2>
          
          <div className="grid gap-4">
            {donations.filter(donation => 
              donation.status === 'Scheduled' || 
              donation.status === 'Confirmed' || 
              !donation.status
            ).map((donation) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Heart className="mr-2 text-red-500" size={20} />
                        <h3 className="font-semibold text-gray-800">Blood Donation</h3>
                      </div>
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 text-gray-500" size={16} />
                        <span className="text-gray-600">{donation.date}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Clock className="mr-2 text-gray-500" size={16} />
                        <span className="text-gray-600">{donation.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 text-gray-500" size={16} />
                        <span className="text-gray-600">{donation.location}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelDonation(donation.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
                    >
                      <X size={16} className="mr-1" />
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;

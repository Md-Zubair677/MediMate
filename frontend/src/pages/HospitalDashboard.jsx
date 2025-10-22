import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, User, Clock, MapPin, Phone, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await fetch('/api/blood-donation/hospitals');
      const data = await response.json();
      setHospitals(data.hospitals);
      if (data.hospitals.length > 0) {
        setSelectedHospital(data.hospitals[0]);
        fetchHospitalDonors(data.hospitals[0].hospital_id);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalDonors = async (hospitalId) => {
    try {
      const response = await fetch(`/api/blood-donation/hospital/${hospitalId}/donors`);
      const data = await response.json();
      setDonors(data.donors);
    } catch (error) {
      console.error('Failed to fetch donors:', error);
    }
  };

  const updateDonationStatus = async (donorId, status) => {
    try {
      const response = await fetch(`/api/blood-donation/donor/${donorId}/status?status=${status}`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        // Refresh donors list
        fetchHospitalDonors(selectedHospital.hospital_id);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center">
          <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-red-600 flex items-center">
            🏥 Hospital Blood Donation Dashboard
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Hospital Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Hospital</h2>
              <div className="space-y-3">
                {hospitals.map((hospital) => (
                  <button
                    key={hospital.hospital_id}
                    onClick={() => {
                      setSelectedHospital(hospital);
                      fetchHospitalDonors(hospital.hospital_id);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedHospital?.hospital_id === hospital.hospital_id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Building size={16} className="text-red-600 mr-2" />
                      <div>
                        <p className="font-medium text-sm">{hospital.name}</p>
                        <p className="text-xs text-gray-500">{hospital.assigned_donors.length} donors</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Donors List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Assigned Donors - {selectedHospital?.name}
                </h2>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {donors.length} Total
                </span>
              </div>

              {donors.length === 0 ? (
                <div className="text-center py-12">
                  <User size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No donors assigned to this hospital</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donors.map((donor) => (
                    <motion.div
                      key={donor.donor_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              donor.donation_status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : donor.donation_status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {donor.donation_status}
                            </span>
                            <span className="text-sm text-gray-500">ID: {donor.donor_id}</span>
                            <span className="text-sm text-gray-500">Score: {donor.eligibility_score}/10</span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <User size={16} className="text-gray-400" />
                              <span className="font-medium">{donor.name}</span>
                              <span className="text-sm text-gray-500">({donor.age}y, {donor.gender})</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-sm">{formatDateTime(donor.pickup_time)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Phone size={16} className="text-gray-400" />
                              <span className="text-sm">{donor.phone}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <MapPin size={16} className="text-gray-400" />
                              <span className="text-sm">{donor.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        {donor.donation_status === 'Pending' && (
                          <button
                            onClick={() => updateDonationStatus(donor.donor_id, 'Completed')}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Mark Complete</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;

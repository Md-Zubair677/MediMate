import React, { useState, useEffect } from 'react';
import { createRetryAxios, useErrorHandler, offlineUtils } from '../utils/error_handler';
import { InlineErrorMessage, LoadingError } from '../components/ErrorNotification';
import { PageErrorBoundary, FormErrorBoundary, DataErrorBoundary } from '../components/ErrorBoundary';

const AppointmentsPage = ({ patientData, onNext }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [message, setMessage] = useState('');
  
  // Enhanced error handling
  const { 
    error: formError, 
    handleError: handleFormError, 
    retry: retryForm, 
    clearError: clearFormError 
  } = useErrorHandler();
  
  const { 
    error: doctorsError, 
    handleError: handleDoctorsError, 
    retry: retryDoctors, 
    clearError: clearDoctorsError 
  } = useErrorHandler();
  
  const { 
    error: appointmentsError, 
    handleError: handleAppointmentsError, 
    retry: retryAppointments, 
    clearError: clearAppointmentsError 
  } = useErrorHandler();
  
  // Create axios instance with retry logic
  const api = createRetryAxios({
    baseURL: 'http://localhost:8000',
    timeout: 10000
  });

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, []);

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    clearDoctorsError();
    
    try {
      // Try to get cached data if offline
      if (offlineUtils.isOffline()) {
        const cachedDoctors = offlineUtils.getCachedData('doctors');
        if (cachedDoctors) {
          setDoctors(cachedDoctors);
          setLoadingDoctors(false);
          return;
        }
      }
      
      const response = await api.get('/api/doctors');
      const doctorsData = Array.isArray(response.data) ? response.data : response.data.doctors || [];
      setDoctors(doctorsData);
      
      // Cache data for offline use
      offlineUtils.setCachedData('doctors', doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      handleDoctorsError(error, { showNotification: true });
      
      // Try to use cached data as fallback
      const cachedDoctors = offlineUtils.getCachedData('doctors');
      if (cachedDoctors) {
        setDoctors(cachedDoctors);
      }
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    clearAppointmentsError();
    
    try {
      // Try to get cached data if offline
      if (offlineUtils.isOffline()) {
        const cachedAppointments = offlineUtils.getCachedData('appointments');
        if (cachedAppointments) {
          setAppointments(cachedAppointments);
          setLoadingAppointments(false);
          return;
        }
      }
      
      const response = await api.get(`/api/appointments/${patientData?.id || 'demo_user'}`);
      const appointmentsData = Array.isArray(response.data) ? response.data : response.data.appointments || [];
      setAppointments(appointmentsData);
      
      // Cache data for offline use
      offlineUtils.setCachedData('appointments', appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      handleAppointmentsError(error, { showNotification: true });
      
      // Try to use cached data as fallback
      const cachedAppointments = offlineUtils.getCachedData('appointments');
      if (cachedAppointments) {
        setAppointments(cachedAppointments);
      }
    } finally {
      setLoadingAppointments(false);
    }
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    clearFormError();
    setMessage('');
    
    try {
      const doctor = doctors.find(d => d.id === selectedDoctor);
      const response = await api.post('/api/appointments', {
        patient_id: patientData?.id || 'demo_user',
        doctor_id: selectedDoctor,
        doctor_name: doctor?.name || 'Unknown Doctor',
        specialty: doctor?.specialty || 'General',
        date: appointmentDate,
        time: appointmentTime
      });
      
      // Pass appointment data to next step
      if (onNext) {
        onNext({
          appointmentId: response.data.appointment_id || 'demo-123',
          doctorId: selectedDoctor,
          doctorName: doctor?.name || 'Unknown Doctor',
          specialty: doctor?.specialty || 'General',
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime
        });
        return;
      }

      setMessage('Appointment booked successfully!');
      setSelectedDoctor('');
      setAppointmentDate('');
      setAppointmentTime('');
      
      // Refresh appointments list
      await loadAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      handleFormError(error, { showNotification: true });
      setMessage('Error booking appointment. Please try again.');
    }
    setLoading(false);
  };

  const retryBooking = async () => {
    await retryForm(bookAppointment);
  };

  return (
    <PageErrorBoundary pageName="Appointments">
      <div className="appointments-page">
        <div className="appointments-container">
          <div className="appointments-header">
            <h2>📅 Book Appointment</h2>
          </div>
          
          <div className="appointments-grid">
            {/* Booking Form */}
            <FormErrorBoundary formName="Appointment Booking">
              <div className="booking-form-section">
                <h3>📝 Schedule New Appointment</h3>
              
              {/* Form Error Display */}
              {formError && (
                <div className="mb-4">
                  <InlineErrorMessage
                    error={formError}
                    onRetry={retryBooking}
                    onDismiss={clearFormError}
                  />
                </div>
              )}
              
              <form onSubmit={bookAppointment} className="space-y-4">
                <div className="form-group">
                  <label>
                    Select Doctor
                  </label>
                  
                  {loadingDoctors ? (
                    <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading doctors...</span>
                      </div>
                    </div>
                  ) : doctorsError ? (
                    <div className="w-full p-3 border border-red-300 rounded-md bg-red-50">
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 text-sm">Failed to load doctors</span>
                        <button
                          type="button"
                          onClick={() => retryDoctors(loadDoctors)}
                          className="text-red-600 hover:text-red-800 text-sm underline"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="form-select"
                      disabled={doctors.length === 0}
                    >
                      <option value="">
                        {doctors.length === 0 ? 'No doctors available' : 'Choose a doctor...'}
                      </option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
            
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Time</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="form-select"
                  >
                <option value="">Select time...</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
              </select>
            </div>
            
                <button
                  type="submit"
                  disabled={loading || loadingDoctors || doctors.length === 0}
                  className="book-btn"
                >
                  {loading ? 'Booking...' : '📅 Book Appointment'}
                </button>
              </form>
              
                {message && (
                  <div className={message.includes('success') ? 'success-message' : 'error-message'}>
                    {message}
                  </div>
                )}
            </div>
          </FormErrorBoundary>
          
            {/* Appointments List */}
            <DataErrorBoundary dataType="Appointments">
              <div className="appointments-list-section">
                <h3>📅 Your Appointments</h3>
              
              {loadingAppointments ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              ) : appointmentsError ? (
                <LoadingError
                  error={appointmentsError}
                  onRetry={() => retryAppointments(loadAppointments)}
                  title="Failed to load appointments"
                  description="We couldn't load your appointments. Please try again."
                />
              ) : appointments.length === 0 ? (
                <div className="empty-appointments">
                  <div className="empty-appointments-icon">
                    📅
                  </div>
                  <p>No appointments scheduled</p>
                  <p>Book your first appointment using the form</p>
                </div>
              ) : (
                <div>
                  {appointments.map(appointment => (
                    <div key={appointment.id} className="appointment-card">
                      <div className="appointment-header">
                        <div>
                          <div className="doctor-name">{appointment.doctor_name || appointment.doctor}</div>
                          <div className="specialty">{appointment.specialty}</div>
                          <div className="appointment-time">
                            {appointment.date} at {appointment.time}
                          </div>
                        </div>
                        <span className={`status-badge ${
                          appointment.status === 'confirmed' 
                            ? 'status-confirmed' 
                            : 'status-pending'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </DataErrorBoundary>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default AppointmentsPage;
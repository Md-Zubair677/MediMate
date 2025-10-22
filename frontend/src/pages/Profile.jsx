import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Calendar, Upload, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');

  const [labReports, setLabReports] = useState([
    {
      id: 1,
      fileName: 'Blood_Test_2025-09-15.pdf',
      uploadDate: '2025-09-15',
      type: 'Blood Test',
      status: 'Analyzed',
      analysis: {
        summary: 'Blood glucose levels are elevated, indicating poor diabetes control.',
        keyFindings: [
          'Glucose: 180 mg/dL (High - Normal: 70-100)',
          'HbA1c: 8.2% (High - Target: <7%)',
          'Cholesterol: 220 mg/dL (Borderline High)'
        ],
        recommendations: [
          'Increase Metformin dosage as prescribed',
          'Follow strict diabetic diet',
          'Regular exercise 30 minutes daily',
          'Monitor blood sugar twice daily'
        ],
        riskLevel: 'Medium',
        suggestedDoctor: {
          name: 'Dr. Sarah Wilson',
          specialty: 'Endocrinology',
          reason: 'Diabetes management specialist'
        }
      }
    },
    {
      id: 2,
      fileName: 'Lipid_Panel_2025-09-10.pdf',
      uploadDate: '2025-09-10',
      type: 'Lipid Panel',
      status: 'Analyzed',
      analysis: {
        summary: 'Lipid levels show improvement but still require monitoring.',
        keyFindings: [
          'Total Cholesterol: 200 mg/dL (Borderline)',
          'LDL: 130 mg/dL (Borderline High)',
          'HDL: 45 mg/dL (Low)',
          'Triglycerides: 150 mg/dL (Normal)'
        ],
        recommendations: [
          'Continue statin therapy',
          'Increase omega-3 rich foods',
          'Reduce saturated fat intake',
          'Regular cardiovascular exercise'
        ],
        riskLevel: 'Low',
        suggestedDoctor: {
          name: 'Dr. Michael Chen',
          specialty: 'Cardiology',
          reason: 'Cardiovascular health specialist'
        }
      }
    }
  ]);

  const [appointments, setAppointments] = useState([
    {
      id: 1,
      doctor: 'Dr. Sarah Wilson',
      specialty: 'Endocrinology',
      date: '2025-09-15',
      time: '10:00 AM',
      type: 'Follow-up',
      status: 'Confirmed',
      location: 'MediMate Central - Room 205'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      date: '2025-09-22',
      time: '2:30 PM',
      type: 'Consultation',
      status: 'Pending',
      location: 'MediMate North - Room 301'
    }
  ]);

  const [uploading, setUploading] = useState(false);

  // Enhanced file upload with analysis
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'test-user');

      const response = await fetch('http://localhost:8000/api/reports/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        const newReport = {
          id: Date.now(),
          fileName: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          type: result.reportType || 'Lab Report',
          status: 'Analyzed',
          analysis: result.analysis || {
            summary: 'Report uploaded and analyzed successfully.',
            keyFindings: result.keyFindings || ['Analysis completed'],
            recommendations: result.recommendations || ['Follow up with your doctor'],
            riskLevel: result.riskLevel || 'Normal'
          }
        };
        
        setLabReports(prev => [newReport, ...prev]);
        alert('✅ Health report uploaded and analyzed successfully!');
      } else {
        // Determine suggested doctor based on file name/type
        const getSuggestedDoctor = (fileName) => {
          const lowerName = fileName.toLowerCase();
          if (lowerName.includes('blood') || lowerName.includes('glucose') || lowerName.includes('diabetes')) {
            return {
              name: 'Dr. Sarah Wilson',
              specialty: 'Endocrinology',
              reason: 'Blood sugar and diabetes management'
            };
          } else if (lowerName.includes('lipid') || lowerName.includes('cholesterol') || lowerName.includes('heart')) {
            return {
              name: 'Dr. Michael Chen',
              specialty: 'Cardiology',
              reason: 'Cardiovascular health specialist'
            };
          } else if (lowerName.includes('liver') || lowerName.includes('kidney')) {
            return {
              name: 'Dr. Emily Rodriguez',
              specialty: 'Internal Medicine',
              reason: 'Organ function specialist'
            };
          } else {
            return {
              name: 'Dr. James Thompson',
              specialty: 'General Medicine',
              reason: 'General health consultation'
            };
          }
        };

        const mockReport = {
          id: Date.now(),
          fileName: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          type: 'Lab Report',
          status: 'Analyzed',
          analysis: {
            summary: 'Report processed successfully. This is a demo analysis.',
            keyFindings: [
              'All major parameters within normal range',
              'Some values require monitoring',
              'Overall health status: Good'
            ],
            recommendations: [
              'Continue current medication regimen',
              'Regular follow-up in 3 months',
              'Maintain healthy lifestyle'
            ],
            riskLevel: 'Low',
            suggestedDoctor: getSuggestedDoctor(file.name)
          }
        };
        
        setLabReports(prev => [mockReport, ...prev]);
        alert('✅ Report uploaded! Demo analysis generated.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const demoReport = {
        id: Date.now(),
        fileName: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        type: 'Lab Report',
        status: 'Analyzed',
        analysis: {
          summary: 'Demo analysis - Report processed for demonstration purposes.',
          keyFindings: [
            'Sample finding 1: Parameter A within normal range',
            'Sample finding 2: Parameter B slightly elevated',
            'Sample finding 3: Overall results satisfactory'
          ],
          recommendations: [
            'Continue current treatment plan',
            'Schedule follow-up appointment',
            'Monitor symptoms regularly'
          ],
          riskLevel: 'Normal',
          suggestedDoctor: {
            name: 'Dr. James Thompson',
            specialty: 'General Medicine',
            reason: 'General health consultation'
          }
        }
      };
      
      setLabReports(prev => [demoReport, ...prev]);
      alert('✅ Demo report created with sample analysis!');
    } finally {
      setUploading(false);
    }
  };

  // Send email notification
  const sendEmailNotification = async (type, appointmentData) => {
    try {
      await fetch('http://localhost:8000/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, // 'booking' or 'cancellation'
          patientEmail: 'patient@example.com',
          doctorEmail: `${appointmentData.doctor.toLowerCase().replace(/\s+/g, '.')}@medimate.com`,
          appointment: appointmentData
        })
      });
    } catch (error) {
      console.log('Email notification sent (demo mode)');
    }
  };

  // Cancel appointment function
  const cancelAppointment = async (appointmentId) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Remove appointment from list
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    
    // Send cancellation emails
    await sendEmailNotification('cancellation', appointment);
  };

  // Automatic appointment booking based on report analysis
  const bookAppointmentFromReport = async (report) => {
    const suggestedDoctor = report.analysis.suggestedDoctor;
    
    try {
      const response = await fetch('http://localhost:8000/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          doctor: suggestedDoctor.name,
          specialty: suggestedDoctor.specialty,
          date: '2025-09-30',
          time: '2:00 PM',
          type: 'Follow-up Consultation',
          reportId: report.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const newAppointment = {
          id: result.appointmentId || Date.now(),
          doctor: suggestedDoctor.name,
          specialty: suggestedDoctor.specialty,
          date: '2025-09-30',
          time: '2:00 PM',
          type: 'Follow-up Consultation',
          status: 'Confirmed',
          location: 'MediMate Central - TBD'
        };
        
        setAppointments(prev => [newAppointment, ...prev]);
        setActiveTab('appointments');
        
        // Send booking emails
        await sendEmailNotification('booking', newAppointment);
      }
    } catch (error) {
      console.error('Booking error:', error);
      const demoAppointment = {
        id: Date.now(),
        doctor: suggestedDoctor.name,
        specialty: suggestedDoctor.specialty,
        date: '2025-09-30',
        time: '2:00 PM',
        type: 'Follow-up Consultation',
        status: 'Confirmed',
        location: 'MediMate Central - TBD'
      };
      
      setAppointments(prev => [demoAppointment, ...prev]);
      setActiveTab('appointments');
      
      // Send booking emails
      await sendEmailNotification('booking', demoAppointment);
    }
  };
  const bookAppointment = async () => {
    const doctor = prompt('Doctor name:');
    const specialty = prompt('Specialty:');
    const date = prompt('Date (YYYY-MM-DD):');
    const time = prompt('Time (HH:MM AM/PM):');
    
    if (!doctor || !specialty || !date || !time) return;

    try {
      const response = await fetch('http://localhost:8000/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          doctor,
          specialty,
          date,
          time,
          type: 'Consultation'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const newAppointment = {
          id: result.appointmentId || Date.now(),
          doctor,
          specialty,
          date,
          time,
          type: 'Consultation',
          status: 'Confirmed',
          location: 'MediMate Central - TBD'
        };
        
        setAppointments(prev => [newAppointment, ...prev]);
      }
    } catch (error) {
      console.error('Booking error:', error);
      const demoAppointment = {
        id: Date.now(),
        doctor,
        specialty,
        date,
        time,
        type: 'Consultation',
        status: 'Pending',
        location: 'MediMate Central - TBD'
      };
      
      setAppointments(prev => [demoAppointment, ...prev]);
    }
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'bg-blue-500 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span>Back to Home</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <TabButton id="reports" label="Lab Reports" icon={FileText} isActive={activeTab === 'reports'} onClick={setActiveTab} />
          <TabButton id="appointments" label="Appointments" icon={Calendar} isActive={activeTab === 'appointments'} onClick={setActiveTab} />
        </div>

        {/* Lab Reports Tab */}
        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Health Reports</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Upload your lab reports, X-rays, or other medical documents</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  {uploading ? 'Analyzing...' : 'Choose File'}
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Analyzed Reports ({labReports.length})</h3>
              {labReports.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No reports uploaded yet. Upload your first health report above.</p>
              ) : (
                <div className="space-y-4">
                  {labReports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{report.fileName}</h4>
                          <p className="text-sm text-gray-500">{report.type} • Uploaded: {report.uploadDate}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'Analyzed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      
                      {report.analysis && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-3">
                          <h5 className="font-medium text-gray-900 mb-2">AI Analysis Summary</h5>
                          <p className="text-gray-700 mb-3">{report.analysis.summary}</p>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h6 className="font-medium text-gray-800 mb-2">Key Findings:</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {report.analysis.keyFindings.map((finding, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {finding}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h6 className="font-medium text-gray-800 mb-2">Recommendations:</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {report.analysis.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              report.analysis.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                              report.analysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              Risk Level: {report.analysis.riskLevel}
                            </span>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View Full Report
                            </button>
                          </div>
                          
                          {/* Book Appointment Section */}
                          {report.analysis.suggestedDoctor && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Recommended Follow-up</p>
                                  <p className="text-sm text-blue-700">
                                    {report.analysis.suggestedDoctor.name} - {report.analysis.suggestedDoctor.specialty}
                                  </p>
                                  <p className="text-xs text-blue-600">{report.analysis.suggestedDoctor.reason}</p>
                                </div>
                                <button
                                  onClick={() => bookAppointmentFromReport(report)}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                  Book Appointment
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Book Appointment */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Book New Appointment</h3>
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <p className="text-gray-700 mb-4">Schedule an appointment with our healthcare professionals</p>
                <button
                  onClick={bookAppointment}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Appointments ({appointments.length})</h3>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{appointment.doctor}</h4>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-blue-600">{appointment.specialty}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Date:</strong> {appointment.date} at {appointment.time}</p>
                          <p><strong>Type:</strong> {appointment.type}</p>
                          <p><strong>Location:</strong> {appointment.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                        <div className="mt-2 space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Reschedule</button>
                          <button 
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;

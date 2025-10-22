import React, { useState, useEffect } from 'react';
import '../styles/globals.css';
import '../styles/components.css';
import '../styles/pages.css';
import '../styles/hospitals.css';

const HospitalsPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const specialties = [
    'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Surgery',
    'Emergency Medicine', 'Internal Medicine', 'Orthopedics', 'Dermatology'
  ];

  useEffect(() => {
    fetchAllHospitals();
    getUserLocation();
  }, []);

  const fetchAllHospitals = async () => {
    try {
      const response = await fetch('/api/hospitals');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, using default location');
          // Default to New York coordinates
          setUserLocation({
            latitude: 40.7589,
            longitude: -73.9851
          });
        }
      );
    }
  };

  const findNearbyHospitals = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const response = await fetch('/api/hospitals/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          max_distance_km: 50.0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNearbyHospitals(data);
      }
    } catch (error) {
      console.error('Failed to find nearby hospitals:', error);
      // Fallback to showing all hospitals
      setNearbyHospitals(hospitals.map(h => ({ hospital: h, distance_km: 'N/A' })));
    } finally {
      setLoading(false);
    }
  };

  const bookLocationBasedAppointment = async (specialty) => {
    if (!userLocation) {
      alert('Location access required for nearby appointments');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/appointments/location-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_latitude: userLocation.latitude,
          patient_longitude: userLocation.longitude,
          specialty_needed: specialty,
          max_distance_km: 25.0
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Found ${specialty} specialist at ${data.recommended_hospital.name} (${data.distance_km}km away)`);
      } else {
        throw new Error('No nearby hospitals found');
      }
    } catch (error) {
      alert(`No ${specialty} specialists found within 25km`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospitals-page">
      <div className="page-header">
        <h1>Hospital Locator</h1>
        <p>Find nearby hospitals and book appointments based on your location</p>
      </div>

      <div className="location-section">
        <div className="location-controls">
          <button 
            onClick={findNearbyHospitals} 
            disabled={loading || !userLocation}
            className="btn-primary"
          >
            {loading ? 'Finding Hospitals...' : 'Find Nearby Hospitals'}
          </button>
          
          <div className="specialty-selector">
            <select 
              value={selectedSpecialty} 
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">Select Specialty</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
            
            {selectedSpecialty && (
              <button 
                onClick={() => bookLocationBasedAppointment(selectedSpecialty)}
                className="btn-secondary"
                disabled={loading}
              >
                Book Nearest {selectedSpecialty}
              </button>
            )}
          </div>
        </div>

        {userLocation && (
          <div className="location-info">
            📍 Your Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </div>
        )}
      </div>

      <div className="hospitals-grid">
        {(nearbyHospitals.length > 0 ? nearbyHospitals : hospitals.map(h => ({ hospital: h, distance_km: 'N/A' }))).map((item, index) => (
          <div key={index} className="hospital-card">
            <div className="hospital-header">
              <h3>{item.hospital.name}</h3>
              <div className="hospital-type">{item.hospital.type}</div>
              {item.distance_km !== 'N/A' && (
                <div className="distance">📍 {item.distance_km} km away</div>
              )}
            </div>
            
            <div className="hospital-details">
              <div className="address">
                📍 {item.hospital.address}, {item.hospital.city}, {item.hospital.state}
              </div>
              <div className="contact">📞 {item.hospital.phone}</div>
              <div className="rating">⭐ {item.hospital.rating}/5.0</div>
              
              <div className="specialties">
                <strong>Specialties:</strong>
                <div className="specialty-tags">
                  {item.hospital.specialties.map((specialty, i) => (
                    <span key={i} className="specialty-tag">{specialty}</span>
                  ))}
                </div>
              </div>
              
              <div className="doctors-info">
                <strong>Available Doctors:</strong> {item.hospital.doctor_ids.length}
              </div>
              
              {item.hospital.emergency_services && (
                <div className="emergency-badge">🚨 Emergency Services Available</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {nearbyHospitals.length === 0 && !loading && (
        <div className="no-results">
          <p>Click "Find Nearby Hospitals" to see hospitals near your location</p>
        </div>
      )}
    </div>
  );
};

export default HospitalsPage;
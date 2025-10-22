import React, { useState, useEffect } from 'react';

export default function LoginPage({ onNext }) {
  const [selectedRole, setSelectedRole] = useState('');

  const startDemo = () => {
    const demoData = {
      id: 'demo_user',
      name: 'Demo User',
      email: 'demo@medimate.com',
      role: 'patient',
      userType: 'patient'
    };
    onNext(demoData);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 25%, #10b981 50%, #ffffff 75%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      
      {/* Logo */}
      <div style={{
        width: '8rem',
        height: '8rem',
        background: 'linear-gradient(135deg, #60a5fa, #a855f7, #2dd4bf)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <span style={{ color: 'white', fontSize: '3.5rem' }}>💓</span>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '4rem',
        fontWeight: '900',
        background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6, #10b981)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 1rem 0',
        textAlign: 'center'
      }}>
        🩺 MediMate
      </h1>

      <p style={{
        fontSize: '1.5rem',
        color: '#374151',
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        Your AI Healthcare Companion
      </p>

      {/* Demo Button */}
      <button
        onClick={startDemo}
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #ef4444)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '50px',
          fontWeight: '700',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        🚀 Try Demo Now
      </button>

      {/* Stats */}
      <div style={{
        marginTop: '3rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '2rem',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>60,000+</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active Patients</div>
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>1,400+</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Verified Doctors</div>
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>99.2%</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>AI Accuracy</div>
        </div>
      </div>
    </div>
  );
}
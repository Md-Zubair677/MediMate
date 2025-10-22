import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Simple test components
const HomePage = () => <div><h1>Home Page</h1><p>Welcome to MediMate!</p></div>;
const ChatPage = () => <div><h1>Chat Page</h1><p>Chat functionality coming soon!</p></div>;

function SimpleApp() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <nav style={{ marginBottom: '20px' }}>
          <a href="/" style={{ marginRight: '10px' }}>Home</a>
          <a href="/chat">Chat</a>
        </nav>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default SimpleApp;
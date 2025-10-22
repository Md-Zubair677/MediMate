import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatPageFixed = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: `Hi there! 👋 I'm MediMate, your friendly health assistant.

How can I help you today? 🤔

Got questions about:
• 💊 Symptoms & Health Issues
• 📅 Book Appointments  
• 🚨 Emergency Help
• 💡 Health Tips & Nutrition
• 🏥 Find Doctors & Hospitals

I'm here to chat. What's on your mind?`
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Check for appointment booking intent
      if (userMessage.toLowerCase().includes('appointment') || 
          userMessage.toLowerCase().includes('book') ||
          userMessage.toLowerCase().includes('schedule')) {
        
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: `🏥 I'd be happy to help you book an appointment!

Let me guide you through our simple booking process:

📋 **What we'll need:**
• Your basic information
• Preferred date and time
• Reason for visit
• Hospital preference

Would you like to start booking now?`,
          suggestions: ['Start Booking', 'View Doctors', 'Hospital Locations', 'Emergency Booking']
        }]);
        setLoading(false);
        return;
      }

      // Check for emergency intent
      if (userMessage.toLowerCase().includes('emergency') || 
          userMessage.toLowerCase().includes('urgent') ||
          userMessage.toLowerCase().includes('911') ||
          userMessage.toLowerCase().includes('critical')) {
        
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: `🚨 **EMERGENCY ASSISTANCE**

If this is a life-threatening emergency:
• 🚨 **CALL 911 IMMEDIATELY**
• 🏥 Go to nearest emergency room

For urgent but non-life-threatening issues:
• Use our emergency detection system
• Book emergency appointment
• Contact your healthcare provider

**Are you experiencing a medical emergency right now?**`,
          suggestions: ['🚨 Call 911', 'Emergency Detection', 'Urgent Appointment', 'Find Hospital']
        }]);
        setLoading(false);
        return;
      }

      // Regular chat API call with fallback for AWS throttling
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          user_id: 'chat_user_' + Date.now() 
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Enhanced response with appointment booking integration
        let enhancedResponse = data.response;
        let suggestions = data.suggestions || [];

        // Add appointment booking suggestion for symptom-related queries
        if (userMessage.toLowerCase().includes('symptom') || 
            userMessage.toLowerCase().includes('pain') ||
            userMessage.toLowerCase().includes('fever') ||
            userMessage.toLowerCase().includes('sick')) {
          
          enhancedResponse += `\n\n📅 **Would you like to book an appointment?**\nBased on your symptoms, I recommend seeing a doctor for proper evaluation and treatment.`;
          suggestions = ['Book Appointment', 'Emergency Detection', 'Symptom Checker', ...suggestions];
        }

        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: enhancedResponse,
          suggestions: suggestions
        }]);
      } else {
        throw new Error('Chat service unavailable');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response with appointment booking
      let fallbackResponse = `I'm having trouble connecting to my advanced AI right now, but I'm still here to help! 

**For your message: "${userMessage}"**

Here's what I can help you with:
• 📅 **Book an appointment** - Get professional medical care
• 🚨 **Emergency help** - If this is urgent
• 💊 **Symptom guidance** - Basic health information
• 🏥 **Find doctors** - Locate healthcare providers

What would you like to do?`;

      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: fallbackResponse,
        suggestions: ['Book Appointment', 'Emergency Help', 'Find Doctors', 'Health Tips']
      }]);
    }

    setLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion === 'Start Booking' || suggestion === 'Book Appointment') {
      // Navigate to appointment booking or trigger booking flow
      window.open('http://localhost:8000/docs#/default/multi_step_booking_api_appointment_book_post', '_blank');
    } else if (suggestion === 'Emergency Detection' || suggestion === '🚨 Call 911') {
      alert('🚨 EMERGENCY: If this is a life-threatening emergency, call 911 immediately!');
    } else if (suggestion === 'Find Doctors' || suggestion === 'View Doctors') {
      setCurrentMessage('show me available doctors');
      handleSendMessage();
    } else if (suggestion === 'Hospital Locations' || suggestion === 'Find Hospital') {
      setCurrentMessage('show me hospital locations');
      handleSendMessage();
    } else {
      setCurrentMessage(suggestion.toLowerCase());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#007bff', 
        color: 'white',
        borderRadius: '0 0 10px 10px'
      }}>
        <h2 style={{ margin: 0 }}>🤖 MediMate AI Assistant</h2>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            backgroundColor: '#28a745', 
            borderRadius: '50%', 
            marginRight: '8px' 
          }}></span>
          Online & Ready to Help
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: message.type === 'user' ? '#007bff' : '#e9ecef',
              color: message.type === 'user' ? 'white' : '#333'
            }}>
              <div style={{ whiteSpace: 'pre-line' }}>
                {message.content}
              </div>
              
              {message.suggestions && (
                <div style={{ 
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {message.suggestions.map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #007bff',
                        borderRadius: '15px',
                        backgroundColor: 'white',
                        color: '#007bff',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#e9ecef'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
                <span style={{ animation: 'pulse 1.5s infinite 0.5s' }}>●</span>
                <span style={{ animation: 'pulse 1.5s infinite 1s' }}>●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div style={{ 
        padding: '10px 20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => handleSuggestionClick('Book Appointment')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📅 Book Appointment
        </button>
        <button 
          onClick={() => handleSuggestionClick('Emergency Help')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🚨 Emergency
        </button>
        <button 
          onClick={() => handleSuggestionClick('Find Doctors')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          👨‍⚕️ Find Doctors
        </button>
      </div>
      
      {/* Input */}
      <div style={{ 
        padding: '20px',
        borderTop: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your health question or say 'book appointment'..."
            disabled={loading}
            rows="2"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '20px',
              resize: 'none',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={loading || !currentMessage.trim()}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              minWidth: '60px'
            }}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatPageFixed;

import React from 'react';

const StyleGuide = () => {
  return (
    <div className="container-main section-padding">
      <div className="space-y-12">
        
        {/* Typography Section */}
        <section className="card">
          <h2 className="font-heading text-3xl text-medimate-dark mb-6">Typography</h2>
          
          <div className="space-y-4">
            <div>
              <h1 className="font-logo text-4xl text-medimate-primary mb-2">MediMate</h1>
              <p className="text-sm text-gray-600">Logo - Poppins 600</p>
            </div>
            
            <div>
              <h2 className="font-heading text-2xl text-medimate-dark mb-2">Main Heading</h2>
              <p className="text-sm text-gray-600">Heading - Poppins 500</p>
            </div>
            
            <div>
              <p className="font-body text-lg text-medimate-dark mb-2">
                This is body text using Inter font. It's clean, readable, and perfect for healthcare content.
              </p>
              <p className="text-sm text-gray-600">Body - Inter 400</p>
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="card">
          <h2 className="font-heading text-3xl text-medimate-dark mb-6">Color Palette</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-medimate-primary rounded-2xl mx-auto mb-2"></div>
              <p className="font-body text-sm">Primary Blue</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-healthcare-green rounded-2xl mx-auto mb-2"></div>
              <p className="font-body text-sm">Health Green</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-healthcare-teal rounded-2xl mx-auto mb-2"></div>
              <p className="font-body text-sm">Accent Teal</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-medimate-light rounded-2xl mx-auto mb-2 border"></div>
              <p className="font-body text-sm">Light Gray</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="card">
          <h2 className="font-heading text-3xl text-medimate-dark mb-6">Buttons</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <span className="health-badge">✅ Healthy</span>
              <span className="warning-badge">⚠️ Needs Attention</span>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="card">
          <h2 className="font-heading text-3xl text-medimate-dark mb-6">Form Elements</h2>
          
          <div className="space-y-4 max-w-md">
            <input 
              type="text" 
              placeholder="Enter your symptoms..." 
              className="input-field"
            />
            
            <textarea 
              placeholder="Describe your health concern..."
              rows="4"
              className="input-field resize-none"
            ></textarea>
          </div>
        </section>

        {/* Chat Messages */}
        <section className="card">
          <h2 className="font-heading text-3xl text-medimate-dark mb-6">Chat Interface</h2>
          
          <div className="space-y-4">
            <div className="chat-message chat-user">
              <p>I have a headache and feel tired. What should I do?</p>
            </div>
            
            <div className="chat-message chat-ai">
              <p>I understand you're experiencing a headache and fatigue. Here are some immediate steps you can take...</p>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="font-heading text-3xl text-medimate-dark mb-6">Card Components</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card fade-in">
              <div className="health-icon mb-4">💬</div>
              <h3 className="font-heading text-xl mb-2">AI Consultation</h3>
              <p className="font-body text-gray-600">Get instant health guidance from our AI assistant</p>
            </div>
            
            <div className="card fade-in">
              <div className="health-icon mb-4">📅</div>
              <h3 className="font-heading text-xl mb-2">Book Appointment</h3>
              <p className="font-body text-gray-600">Schedule with healthcare professionals</p>
            </div>
            
            <div className="card fade-in">
              <div className="health-icon mb-4">📋</div>
              <h3 className="font-heading text-xl mb-2">Medical Reports</h3>
              <p className="font-body text-gray-600">Upload and analyze your medical documents</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default StyleGuide;
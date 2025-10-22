import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Brain, User, Mic, TrendingUp, Home, MessageSquare } from 'lucide-react';

const AINavigation = () => {
  const navigate = useNavigate();

  const aiFeatures = [
    {
      id: 1,
      title: "AI Agent Dashboard",
      description: "Complete AI healthcare management",
      icon: Brain,
      route: "/ai-agent",
      color: "bg-blue-500",
      status: "Active"
    },
    {
      id: 2,
      title: "Personalized AI",
      description: "Genetic insights & behavioral learning",
      icon: User,
      route: "/personalized",
      color: "bg-green-500",
      status: "Active"
    },
    {
      id: 3,
      title: "ML Recommendations",
      description: "Predictive health analytics",
      icon: TrendingUp,
      route: "/ml",
      color: "bg-orange-500",
      status: "Active"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600 flex items-center gap-2">
            🏥 MediMate AI Platform
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button 
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div style={{padding: '24px'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '8px'}}>AI Healthcare Components</h2>
            <p style={{color: '#666'}}>Access all 3 AI-powered healthcare features</p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px'}}>
            {aiFeatures.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card 
                  key={feature.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(feature.route)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">{feature.status}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AINavigation;

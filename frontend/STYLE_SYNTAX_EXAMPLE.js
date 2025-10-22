// Example of correct JSX style syntax for animations

import React from 'react';

const ExampleComponent = () => {
  return (
    <div>
      {/* Your component content */}
      <div className="login-box">
        Login Box with Animation
      </div>
      
      {/* Correct JSX style syntax */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .login-box {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ExampleComponent;

// Alternative approaches:

// 1. Using CSS Modules
// Create a separate .module.css file and import it

// 2. Using styled-components
// import styled, { keyframes } from 'styled-components';
// 
// const pulse = keyframes`
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.5; }
// `;
// 
// const LoginBox = styled.div`
//   animation: ${pulse} 2s infinite;
// `;

// 3. Using inline styles with CSS-in-JS
// const pulseAnimation = {
//   animation: 'pulse 2s infinite',
// };
// 
// // Then add the keyframes to a global CSS file or use a library like emotion

// 4. Using Tailwind CSS classes (if available)
// <div className="animate-pulse">Content</div>
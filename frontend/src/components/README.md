# MediMate Homepage Component

## Overview
Modern, responsive homepage for the MediMate healthcare platform built with React, Tailwind CSS, Lucide React icons, and Framer Motion animations.

## Features

### Navigation Bar
- **Logo**: "MediMate" with slide-up animation
- **Icons**: Chat, Blood Donation, Appointments, Profile
- **Responsive**: Collapses on mobile devices
- **Animations**: Hover effects with scale and color transitions

### Welcome Section
- **Centered layout** with gradient background
- **Main heading**: "Welcome to MediMate — Your AI-powered health companion"
- **Action buttons**: Large interactive cards for each main feature
- **Animations**: Staggered fade-in effects

### Footer
- **Fixed bottom** with copyright information
- **Responsive** text sizing

## Dependencies
- `react` - Core React library
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `tailwindcss` - CSS framework

## Usage
```jsx
import Homepage from './components/Homepage';

function App() {
  return <Homepage />;
}
```

## Responsive Design
- **Desktop**: Horizontal icon layout
- **Mobile**: Vertical stacked layout
- **Tablet**: Adaptive spacing and sizing

## Animations
- **Page load**: Fade-in effect
- **Logo**: Slide-up animation
- **Icons**: Scale on hover
- **Buttons**: Scale and shadow effects
- **Staggered**: Sequential element animations

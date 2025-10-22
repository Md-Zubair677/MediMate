# MediMate Healthcare App - UI/UX Style Guide

## 🎨 Design Philosophy

MediMate's design system is built around **trust, calmness, and health**. Every element is crafted to provide a professional, accessible, and reassuring experience for healthcare interactions.

## 🌈 Color Palette

### Primary Colors (Trust & Medical)
```css
--primary-blue: #2563eb        /* Main brand color */
--primary-blue-light: #3b82f6  /* Hover states */
--primary-blue-dark: #1d4ed8   /* Active states */
--primary-teal: #0d9488        /* Medical accent */
--primary-teal-light: #14b8a6  /* Teal variations */
--primary-teal-dark: #0f766e   /* Deep teal */
```

### Secondary Colors (Calm & Health)
```css
--secondary-green: #059669     /* Success, health */
--secondary-green-light: #10b981
--secondary-mint: #6ee7b7      /* Soft accent */
--secondary-sky: #0ea5e9       /* Information */
--secondary-sky-light: #38bdf8
```

### Neutral Colors (Clean & Professional)
```css
--white: #ffffff
--gray-50: #f8fafc           /* Light backgrounds */
--gray-100: #f1f5f9          /* Card backgrounds */
--gray-200: #e2e8f0          /* Borders */
--gray-300: #cbd5e1          /* Disabled states */
--gray-400: #94a3b8          /* Placeholders */
--gray-500: #64748b          /* Secondary text */
--gray-600: #475569          /* Body text */
--gray-700: #334155          /* Headings */
--gray-800: #1e293b          /* Dark headings */
--gray-900: #0f172a          /* Emphasis */
```

### Status Colors
```css
--success: #22c55e           /* Success messages */
--warning: #f59e0b           /* Warnings */
--error: #ef4444             /* Errors */
--info: #3b82f6              /* Information */
```

## 📝 Typography

### Font Families
- **Primary**: Inter (body text, UI elements)
- **Headings**: Poppins (headings, brand elements)

### Text Styles
```css
/* Headings */
.heading-1 { font-size: 2.5rem; font-weight: 700; }  /* Page titles */
.heading-2 { font-size: 2rem; font-weight: 600; }    /* Section titles */
.heading-3 { font-size: 1.5rem; font-weight: 600; }  /* Subsections */
.heading-4 { font-size: 1.25rem; font-weight: 500; } /* Card titles */

/* Body Text */
.body-large { font-size: 1.125rem; }   /* Important content */
.body-normal { font-size: 1rem; }      /* Standard text */
.body-small { font-size: 0.875rem; }   /* Secondary info */
.text-caption { font-size: 0.75rem; }  /* Labels, captions */
```

## 🔘 Button System

### Primary Buttons
```html
<button class="btn btn-primary">Book Appointment</button>
<button class="btn btn-primary btn-large">Get Started</button>
```

### Secondary Buttons
```html
<button class="btn btn-secondary">Learn More</button>
<button class="btn btn-outline">Cancel</button>
<button class="btn btn-ghost">Skip</button>
```

### Success Actions
```html
<button class="btn btn-success">Confirm Booking</button>
```

## 📝 Form Elements

### Input Fields
```html
<div class="form-group">
  <label class="form-label">Email Address</label>
  <input type="email" class="form-input" placeholder="Enter your email">
  <div class="form-error">Please enter a valid email</div>
</div>
```

### Select Dropdowns
```html
<select class="form-input form-select">
  <option>Choose a doctor</option>
  <option>Dr. Smith - Cardiology</option>
</select>
```

### Checkboxes & Radio Buttons
```html
<input type="checkbox" class="form-checkbox" id="terms">
<label for="terms">I agree to the terms</label>

<input type="radio" class="form-radio" name="gender" id="male">
<label for="male">Male</label>
```

## 🃏 Card Components

### Basic Card
```html
<div class="card">
  <div class="card-header">
    <h3>Appointment Details</h3>
  </div>
  <div class="card-body">
    <p>Your appointment is scheduled...</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Reschedule</button>
  </div>
</div>
```

### Specialized Cards
```html
<!-- Health Record Card -->
<div class="card card-health">
  <div class="card-body">
    <h4>Blood Test Results</h4>
    <p>All values within normal range</p>
  </div>
</div>

<!-- Appointment Card -->
<div class="appointment-card">
  <div class="appointment-header">
    <div>
      <div class="appointment-doctor">Dr. Sarah Johnson</div>
      <div class="appointment-specialty">Cardiology</div>
    </div>
    <div class="appointment-datetime">
      <div class="appointment-date">March 15, 2024</div>
      <div class="appointment-time">2:00 PM</div>
    </div>
  </div>
</div>
```

## 🎯 Status Indicators

### Status Badges
```html
<span class="status-badge status-success">Confirmed</span>
<span class="status-badge status-warning">Pending</span>
<span class="status-badge status-error">Cancelled</span>
<span class="status-badge status-info">Scheduled</span>
```

## 📱 Layout System

### Grid Layouts
```html
<!-- 2-column responsive grid -->
<div class="grid grid-2">
  <div class="card">Content 1</div>
  <div class="card">Content 2</div>
</div>

<!-- 3-column responsive grid -->
<div class="grid grid-3">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
</div>
```

### Flexbox Utilities
```html
<div class="flex items-center justify-between">
  <h2>Page Title</h2>
  <button class="btn btn-primary">Action</button>
</div>
```

## 🏠 Page Layouts

### Home Page Structure
```html
<div class="home-page">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">Your Health, Our Priority</h1>
      <p class="hero-subtitle">AI-powered healthcare assistance</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-large">Try Demo</button>
        <button class="btn btn-secondary btn-large">Learn More</button>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features-section">
    <div class="container">
      <h2 class="heading-2">Our Services</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🩺</div>
          <h3 class="feature-title">AI Health Chat</h3>
          <p class="feature-description">Get instant health advice</p>
        </div>
      </div>
    </div>
  </section>
</div>
```

### Chat Page Structure
```html
<div class="chat-page">
  <div class="container">
    <!-- Page Header -->
    <div class="chat-page-header">
      <div class="chat-page-title">
        <div class="chat-page-icon">🤖</div>
        <div>
          <h1 class="heading-2">Health Assistant</h1>
          <p class="body-normal">Ask me anything about your health</p>
        </div>
      </div>
    </div>

    <!-- Chat Interface -->
    <div class="chat-container">
      <div class="chat-header">
        <div class="message-avatar">AI</div>
        <div>
          <h3>MediMate Assistant</h3>
          <p>Online and ready to help</p>
        </div>
      </div>
      <div class="chat-messages">
        <!-- Messages go here -->
      </div>
      <div class="chat-input-container">
        <!-- Input form goes here -->
      </div>
    </div>
  </div>
</div>
```

### Appointments Page Structure
```html
<div class="appointments-page">
  <div class="container">
    <!-- Page Header -->
    <div class="appointments-header">
      <h1 class="heading-1">Appointments</h1>
      <p class="body-large">Manage your healthcare appointments</p>
    </div>

    <!-- Tabs -->
    <div class="appointments-tabs">
      <button class="tab-button active">Book New</button>
      <button class="tab-button">My Appointments</button>
    </div>

    <!-- Booking Form -->
    <div class="appointment-booking-form">
      <div class="form-section">
        <h3 class="form-section-title">Select Doctor</h3>
        <!-- Doctor selection cards -->
      </div>
    </div>
  </div>
</div>
```

## 🎨 Design Patterns

### Loading States
```html
<!-- Spinner -->
<div class="loading-spinner"></div>

<!-- Skeleton Loading -->
<div class="skeleton" style="height: 20px; margin-bottom: 10px;"></div>
```

### Empty States
```html
<div class="empty-state">
  <div class="empty-state-icon">📅</div>
  <h3 class="empty-state-title">No appointments yet</h3>
  <p class="empty-state-text">Book your first appointment to get started</p>
  <button class="btn btn-primary">Book Appointment</button>
</div>
```

### Notifications
```html
<div class="notification success">
  <div class="notification-header">
    <h4 class="notification-title">Success!</h4>
    <button class="notification-close">×</button>
  </div>
  <p class="notification-message">Your appointment has been booked</p>
</div>
```

## 📐 Spacing System

```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */
--spacing-2xl: 3rem      /* 48px */
--spacing-3xl: 4rem      /* 64px */
```

## 🔄 Border Radius

```css
--radius-sm: 0.375rem    /* Small elements */
--radius-md: 0.5rem      /* Buttons, inputs */
--radius-lg: 0.75rem     /* Cards */
--radius-xl: 1rem        /* Large cards */
--radius-2xl: 1.5rem     /* Modals */
```

## 🌟 Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)           /* Subtle */
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)            /* Cards */
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)          /* Elevated */
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1)          /* Modals */
--shadow-health: 0 8px 32px rgba(37,99,235,0.15)  /* Special */
```

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 480px)  { /* Small phones */ }
@media (max-width: 768px)  { /* Tablets */ }
@media (max-width: 1024px) { /* Small laptops */ }
@media (max-width: 1200px) { /* Large screens */ }
```

## ♿ Accessibility Guidelines

1. **Color Contrast**: All text meets WCAG AA standards
2. **Focus States**: Visible focus indicators on all interactive elements
3. **Keyboard Navigation**: Full keyboard accessibility
4. **Screen Readers**: Proper ARIA labels and semantic HTML
5. **Motion**: Respects `prefers-reduced-motion`

## 🚀 Implementation Tips

### React Component Example
```jsx
import React from 'react';

const AppointmentCard = ({ doctor, specialty, date, time }) => {
  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <div>
          <div className="appointment-doctor">{doctor}</div>
          <div className="appointment-specialty">{specialty}</div>
        </div>
        <div className="appointment-datetime">
          <div className="appointment-date">{date}</div>
          <div className="appointment-time">{time}</div>
        </div>
      </div>
      <div className="appointment-actions">
        <button className="btn btn-outline btn-small">Reschedule</button>
        <button className="btn btn-primary btn-small">Join Call</button>
      </div>
    </div>
  );
};
```

### CSS Custom Properties Usage
```css
.custom-button {
  background: var(--primary-blue);
  color: var(--white);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}
```

## 🎯 Brand Guidelines

- **Logo**: Clean, medical cross or health symbol
- **Voice**: Professional, caring, trustworthy
- **Imagery**: Clean, bright, diverse, healthcare-focused
- **Icons**: Outline style, consistent stroke width
- **Illustrations**: Minimal, healthcare-themed

This style guide ensures consistent, professional, and accessible design across the entire MediMate healthcare platform.
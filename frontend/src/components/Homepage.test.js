import React from 'react';
import { render, screen } from '@testing-library/react';
import Homepage from './Homepage';

test('renders MediMate homepage', () => {
  render(<Homepage />);
  
  // Check if the main heading is present
  const heading = screen.getByText(/Welcome to MediMate/i);
  expect(heading).toBeInTheDocument();
  
  // Check if MediMate logo is present
  const logo = screen.getByText('MediMate');
  expect(logo).toBeInTheDocument();
  
  // Check if footer is present
  const footer = screen.getByText(/© 2025 MediMate/i);
  expect(footer).toBeInTheDocument();
});

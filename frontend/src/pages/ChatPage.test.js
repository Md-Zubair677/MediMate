import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatPage from './ChatPage';

// Mock the error handler
jest.mock('../utils/error_handler', () => ({
  createRetryAxios: jest.fn(() => ({
    post: jest.fn()
  })),
  useErrorHandler: jest.fn(() => ({
    error: null,
    handleError: jest.fn(),
    clearError: jest.fn(),
    errorMessage: '',
    recoverySuggestions: []
  }))
}));

// Mock the components
jest.mock('../components/ErrorNotification', () => ({
  InlineErrorMessage: ({ message }) => <div data-testid="error-message">{message}</div>
}));

jest.mock('../components/ErrorBoundary', () => ({
  PageErrorBoundary: ({ children }) => <div data-testid="error-boundary">{children}</div>
}));

describe('ChatPage', () => {
  test('renders ChatPage component', () => {
    render(<ChatPage />);
    
    // Check if main elements are present
    expect(screen.getByText('🏥 MediMate Health Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your health question...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  test('displays initial AI message', () => {
    render(<ChatPage />);
    
    expect(screen.getByText(/Hi there! 👋 I'm MediMate/)).toBeInTheDocument();
  });
});

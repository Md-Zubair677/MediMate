import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import LoginPageNew from './pages/LoginPageNew';
import PatientDashboard from './pages/PatientDashboard';

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  useNavigate: () => jest.fn(),
}));

describe('MediMate Application', () => {
  
  test('renders login page when no user', () => {
    render(<App />);
    expect(screen.getByText(/MediMate Healthcare Platform/i)).toBeInTheDocument();
  });
  
  test('login page has role selection', () => {
    const mockOnNext = jest.fn();
    render(<LoginPageNew onNext={mockOnNext} />);
    
    expect(screen.getByText('Patient Login')).toBeInTheDocument();
    expect(screen.getByText('Doctor Login')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });
  
  test('patient dashboard renders correctly', () => {
    const mockUser = {
      id: 'test_user',
      name: 'Test Patient',
      role: 'patient'
    };
    const mockOnLogout = jest.fn();
    
    render(<PatientDashboard user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText(/Hi, Test Patient/i)).toBeInTheDocument();
    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
  });
});
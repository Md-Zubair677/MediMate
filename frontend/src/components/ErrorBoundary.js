/*
 * Error Boundary components for React error handling.
 * Catches JavaScript errors anywhere in the component tree and displays fallback UI.
 */

import React from 'react';
import { errorNotificationManager, ERROR_SEVERITY } from '../utils/error_handler';

/*
 * Main Error Boundary component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to notification system
    const errorId = errorNotificationManager.notify(error, {
      title: 'Application Error',
      severity: ERROR_SEVERITY.HIGH,
      autoHide: false,
      context: this.props.name || 'Unknown Component'
    });

    // Report to external error tracking service if available
    if (window.reportError) {
      window.reportError(error, {
        component: this.props.name,
        errorInfo,
        props: this.props
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          componentName={this.props.name}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

/*
 * Default Error Fallback UI component
 */
const ErrorFallback = ({ 
  error, 
  errorInfo, 
  onRetry, 
  onReload, 
  componentName, 
  showDetails = false 
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              {componentName 
                ? `There was an error in the ${componentName} component.`
                : 'We encountered an unexpected error.'
              } We're sorry for the inconvenience.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <button
                onClick={onReload}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
            </div>

            {/* Error Details Toggle */}
            {(error || errorInfo) && (
              <div className="mt-6">
                <button
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {showErrorDetails ? 'Hide' : 'Show'} Error Details
                </button>
              </div>
            )}

            {/* Error Details */}
            {showErrorDetails && (error || errorInfo) && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h4>
                
                {error && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Error Message:</p>
                    <p className="text-xs font-mono text-red-600 bg-red-50 p-2 rounded">
                      {error.toString()}
                    </p>
                  </div>
                )}

                {errorInfo && errorInfo.componentStack && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Component Stack:</p>
                    <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            <div className="mt-6 text-xs text-gray-500">
              <p>If this problem persists, please contact support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/*
 * Specialized Error Boundary for specific components
 */
export const PageErrorBoundary = ({ children, pageName }) => (
  <ErrorBoundary 
    name={`${pageName} Page`}
    fallback={(error, retry) => (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {pageName} Unavailable
          </h2>
          
          <p className="text-gray-600 mb-6">
            We're having trouble loading the {pageName.toLowerCase()} page. Please try again.
          </p>
          
          <div className="space-x-4">
            <button
              onClick={retry}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/*
 * Error Boundary for form components
 */
export const FormErrorBoundary = ({ children, formName }) => (
  <ErrorBoundary 
    name={`${formName} Form`}
    fallback={(error, retry) => (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Form Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error with the {formName.toLowerCase()} form. Please refresh and try again.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={retry}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/*
 * Error Boundary for API data components
 */
export const DataErrorBoundary = ({ children, dataType }) => (
  <ErrorBoundary 
    name={`${dataType} Data`}
    fallback={(error, retry) => (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Unable to Load {dataType}
        </h3>
        
        <p className="text-gray-600 mb-4">
          We're having trouble loading the {dataType.toLowerCase()}. This might be a temporary issue.
        </p>
        
        <button
          onClick={retry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/*
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary 
      name={options.name || Component.displayName || Component.name}
      showDetails={options.showDetails}
      fallback={options.fallback}
    >
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/*
 * Hook to handle errors in functional components
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { captureError, resetError };
};

export default ErrorBoundary;

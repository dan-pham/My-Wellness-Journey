import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/app/components/ErrorBoundary';

// Create a component that throws an error for testing
const ErrorComponent = () => {
  throw new Error('Test error');
  return <div>This will never render</div>;
};

// Mock console.error to prevent error output during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders default fallback UI when an error occurs', () => {
    // We need to spy on console.error and silence it for this test
    // because React logs errors during rendering
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    // Check if the default fallback UI is displayed
    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Please try again or contact support if the problem persists.')).toBeInTheDocument();
  });

  it('renders custom fallback UI when provided', () => {
    // We need to spy on console.error and silence it for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error UI</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    // Check if the custom fallback UI is displayed
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Error } from '@/app/components/Error';

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});

describe('Error Component', () => {
  beforeEach(() => {
    mockReload.mockClear();
  });

  it('renders error message correctly', () => {
    const errorMessage = 'Something went wrong';
    render(<Error message={errorMessage} />);
    
    // Check if the error title is displayed
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    // Check if the error message is displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Check if the try again button is displayed
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('reloads the page when Try Again button is clicked', () => {
    render(<Error message="Test error" />);
    
    // Click the try again button
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    
    // Check if window.location.reload was called
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
}); 
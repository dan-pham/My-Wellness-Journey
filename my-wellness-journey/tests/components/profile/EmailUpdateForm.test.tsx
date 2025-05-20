import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailUpdateForm from '@/app/components/profile/EmailUpdateForm';

// Mock the Button component
jest.mock('@/app/components/Button', () => {
  return function MockButton({ text, disabled, type }: { text: string; disabled?: boolean; type?: string }) {
    return (
      <button type={type as any} disabled={disabled} data-testid="submit-button">
        {text}
      </button>
    );
  };
});

describe('EmailUpdateForm Component', () => {
  const mockOnUpdateEmail = jest.fn().mockResolvedValue(undefined);
  const defaultProps = {
    currentEmail: 'test@example.com',
    onUpdateEmail: mockOnUpdateEmail,
    isUpdating: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with current email', () => {
    render(<EmailUpdateForm {...defaultProps} />);
    
    // Check if the form heading is displayed
    expect(screen.getByText('Change Email Address')).toBeInTheDocument();
    
    // Check if the current email is displayed and read-only
    const currentEmailInput = screen.getByLabelText('Current Email Address');
    expect(currentEmailInput).toBeInTheDocument();
    expect(currentEmailInput).toHaveValue(defaultProps.currentEmail);
    expect(currentEmailInput).toHaveAttribute('readOnly');
  });

  it('allows entering new email and confirmation', () => {
    render(<EmailUpdateForm {...defaultProps} />);
    
    // Get the input fields
    const newEmailInput = screen.getByLabelText('New Email Address');
    const confirmEmailInput = screen.getByLabelText('Confirm New Email Address');
    
    // Enter new email values
    fireEvent.change(newEmailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'new@example.com' } });
    
    // Check if the values were updated
    expect(newEmailInput).toHaveValue('new@example.com');
    expect(confirmEmailInput).toHaveValue('new@example.com');
  });

  it('calls onUpdateEmail with correct data on form submission', async () => {
    render(<EmailUpdateForm {...defaultProps} />);
    
    // Get the input fields
    const newEmailInput = screen.getByLabelText('New Email Address');
    const confirmEmailInput = screen.getByLabelText('Confirm New Email Address');
    
    // Enter new email values
    fireEvent.change(newEmailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'new@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check if onUpdateEmail was called with the correct data
    await waitFor(() => {
      expect(mockOnUpdateEmail).toHaveBeenCalledWith({
        currentEmail: defaultProps.currentEmail,
        newEmail: 'new@example.com',
        confirmEmail: 'new@example.com'
      });
    });
  });

  it('resets form fields after successful submission', async () => {
    render(<EmailUpdateForm {...defaultProps} />);
    
    // Get the input fields
    const newEmailInput = screen.getByLabelText('New Email Address');
    const confirmEmailInput = screen.getByLabelText('Confirm New Email Address');
    
    // Enter new email values
    fireEvent.change(newEmailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(confirmEmailInput, { target: { value: 'new@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check if the form fields are reset
    await waitFor(() => {
      expect(newEmailInput).toHaveValue('');
      expect(confirmEmailInput).toHaveValue('');
    });
  });

  it('displays updating text when isUpdating is true', () => {
    render(<EmailUpdateForm {...defaultProps} isUpdating={true} />);
    
    // Check if the button shows "Updating..." text
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Updating...');
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });
}); 
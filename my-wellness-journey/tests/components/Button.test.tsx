import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/app/components/Button';

describe('Button Component', () => {
  it('renders button with text correctly', () => {
    render(<Button text="Click Me" />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('applies custom class names', () => {
    render(<Button text="Click Me" className="custom-class" />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button text="Click Me" onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button text="Click Me" disabled={true} />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDisabled();
  });

  it('renders with an icon', () => {
    const mockIcon = <span data-testid="mock-icon">Icon</span>;
    render(<Button text="Click Me" icon={mockIcon} />);
    
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct button type', () => {
    render(<Button text="Submit" type="submit" />);
    
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('type', 'submit');
  });
}); 
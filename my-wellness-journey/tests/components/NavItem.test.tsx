import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavItem from '@/app/components/NavItem';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className, onClick }: any) => {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  };
});

describe('NavItem Component', () => {
  it('renders with correct label and href', () => {
    render(<NavItem label="Home" href="/home" isSelected={false} />);
    
    const link = screen.getByRole('link', { name: /home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/home');
  });

  it('applies selected styles when isSelected is true', () => {
    render(<NavItem label="Home" href="/home" isSelected={true} />);
    
    const link = screen.getByRole('link', { name: /home/i });
    expect(link).toHaveClass('text-primary-accent');
    expect(link).toHaveClass('font-semibold');
    
    // Check if the selected indicator is present
    const selectedIndicator = document.querySelector('.bg-primary-accent');
    expect(selectedIndicator).toBeInTheDocument();
  });

  it('applies unselected styles when isSelected is false', () => {
    render(<NavItem label="Home" href="/home" isSelected={false} />);
    
    const link = screen.getByRole('link', { name: /home/i });
    expect(link).toHaveClass('text-gray-600');
    expect(link).not.toHaveClass('text-primary-accent');
    
    // Check that the selected indicator is not present
    const selectedIndicator = document.querySelector('.bg-primary-accent');
    expect(selectedIndicator).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<NavItem label="Home" href="/home" isSelected={false} className="custom-class" />);
    
    const link = screen.getByRole('link', { name: /home/i });
    expect(link).toHaveClass('custom-class');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<NavItem label="Home" href="/home" isSelected={false} onClick={handleClick} />);
    
    const link = screen.getByRole('link', { name: /home/i });
    fireEvent.click(link);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/app/components/EmptyState';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe('EmptyState Component', () => {
  it('renders title and message correctly', () => {
    const title = 'No Results Found';
    const message = 'Try adjusting your search criteria';
    
    render(<EmptyState title={title} message={message} />);
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders action button when actionText and actionFn are provided', () => {
    const actionFn = jest.fn();
    const actionText = 'Try Again';
    
    render(
      <EmptyState 
        title="No Results" 
        message="No data available" 
        actionText={actionText}
        actionFn={actionFn}
      />
    );
    
    const button = screen.getByRole('button', { name: actionText });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(actionFn).toHaveBeenCalledTimes(1);
  });

  it('renders action link when actionLabel and actionUrl are provided', () => {
    const actionLabel = 'Go to Home';
    const actionUrl = '/home';
    
    render(
      <EmptyState 
        title="No Results" 
        message="No data available" 
        actionLabel={actionLabel}
        actionUrl={actionUrl}
      />
    );
    
    const link = screen.getByRole('link', { name: actionLabel });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', actionUrl);
  });

  it('does not render action elements when no action props are provided', () => {
    render(<EmptyState title="No Results" message="No data available" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
}); 
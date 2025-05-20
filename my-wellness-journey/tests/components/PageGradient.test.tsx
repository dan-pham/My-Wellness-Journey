import React from 'react';
import { render, screen } from '@testing-library/react';
import PageGradient from '@/app/components/PageGradient';

describe('PageGradient Component', () => {
  it('renders children correctly', () => {
    render(
      <PageGradient type="top">
        <div data-testid="child-content">Test Content</div>
      </PageGradient>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders top gradient when type is "top"', () => {
    const { container } = render(
      <PageGradient type="top">
        <div>Test Content</div>
      </PageGradient>
    );
    
    const topGradient = container.querySelector('.bg-gradient-to-b');
    expect(topGradient).toBeInTheDocument();
    expect(topGradient).toHaveClass('from-[#E8F4FF]');
    expect(topGradient).toHaveClass('to-transparent');
  });

  it('renders bottom gradient when type is "bottom"', () => {
    const { container } = render(
      <PageGradient type="bottom">
        <div>Test Content</div>
      </PageGradient>
    );
    
    const bottomGradient = container.querySelector('.bg-gradient-to-t');
    expect(bottomGradient).toBeInTheDocument();
    expect(bottomGradient).toHaveClass('from-[#E8F4FF]');
    expect(bottomGradient).toHaveClass('to-transparent');
  });

  it('applies z-index to gradients', () => {
    const { container } = render(
      <PageGradient type="top">
        <div>Test Content</div>
      </PageGradient>
    );
    
    const gradient = container.querySelector('.bg-gradient-to-b');
    expect(gradient).toHaveStyle('z-index: -1');
  });
}); 
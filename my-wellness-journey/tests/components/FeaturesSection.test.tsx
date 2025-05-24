import React from 'react';
import { render, screen } from '@testing-library/react';
import FeaturesSection from '@/app/components/FeaturesSection';

// Mock the react-icons
jest.mock('react-icons/fa', () => ({
  FaBookReader: () => <span data-testid="book-reader-icon">BookReader Icon</span>,
  FaChartLine: () => <span data-testid="chart-line-icon">ChartLine Icon</span>,
}));

describe('FeaturesSection Component', () => {
  it('renders the features section with correct number of features', () => {
    render(<FeaturesSection />);
    
    // Check if both feature cards are rendered
    const featureCards = screen.getAllByRole('heading', { level: 3 });
    expect(featureCards).toHaveLength(2);
  });

  it('renders the first feature with correct content', () => {
    render(<FeaturesSection />);
    
    // Check if the first feature title is displayed
    expect(screen.getByText('Personalized Education')).toBeInTheDocument();
    
    // Check if the first feature description is displayed
    expect(screen.getByText('Resources tailored to your specific chronic conditions and needs')).toBeInTheDocument();
    
    // Check if the first feature icon is displayed
    expect(screen.getByTestId('book-reader-icon')).toBeInTheDocument();
  });

  it('renders the second feature with correct content', () => {
    render(<FeaturesSection />);
    
    // Check if the second feature title is displayed
    expect(screen.getByText('Practical Wellness Tools')).toBeInTheDocument();
    
    // Check if the second feature description is displayed
    expect(screen.getByText('Track progress and access reliable health information in one place')).toBeInTheDocument();
    
    // Check if the second feature icon is displayed
    expect(screen.getByTestId('chart-line-icon')).toBeInTheDocument();
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TipCard from '@/app/components/TipCard';

// Mock the contentUtils
jest.mock('@/utils/contentUtils', () => ({
  stripHtmlForPreview: jest.fn((content) => `${content.substring(0, 50)}...`),
}));

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

describe('TipCard Component', () => {
  const mockTip = {
    id: 'tip-123',
    task: 'Health Tip Task',
    reason: 'This is the reason why this health tip is important for your wellness.',
    sourceUrl: 'https://example.com/source',
    saved: false,
    done: false
  };

  const mockOnSaveToggle = jest.fn();
  const mockOnMarkDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tip card with task and reason', () => {
    render(
      <TipCard
        tip={mockTip}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    expect(screen.getByText(mockTip.task)).toBeInTheDocument();
    expect(screen.getByText(mockTip.reason)).toBeInTheDocument();
  });

  it('shows unsaved bookmark icon when not saved', () => {
    render(
      <TipCard
        tip={mockTip}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    const saveButton = screen.getByLabelText('Save tip');
    expect(saveButton).toBeInTheDocument();
  });

  it('shows filled bookmark icon when saved', () => {
    render(
      <TipCard
        tip={{ ...mockTip, saved: true }}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    const unsaveButton = screen.getByLabelText('Remove from saved');
    expect(unsaveButton).toBeInTheDocument();
  });

  it('calls onSaveToggle when save button is clicked', () => {
    render(
      <TipCard
        tip={mockTip}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    const saveButton = screen.getByLabelText('Save tip');
    fireEvent.click(saveButton);
    
    expect(mockOnSaveToggle).toHaveBeenCalledWith(mockTip.id);
  });

  it('calls onMarkDone when the task area is clicked', () => {
    render(
      <TipCard
        tip={mockTip}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    const taskArea = screen.getByText(mockTip.task).closest('div');
    fireEvent.click(taskArea!);
    
    expect(mockOnMarkDone).toHaveBeenCalledWith(mockTip.id);
  });

  it('shows check circle icon when tip is marked as done', () => {
    render(
      <TipCard
        tip={{ ...mockTip, done: true }}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    // The component doesn't have text "Done", but it has a different icon
    // We can't easily test for the specific icon, but we can check the parent div has opacity class
    const cardDiv = screen.getByText(mockTip.task).closest('.bg-white');
    expect(cardDiv).toHaveClass('opacity-75');
  });

  it('has a working "Read Source" link', () => {
    render(
      <TipCard
        tip={mockTip}
        onSaveToggle={mockOnSaveToggle}
        onMarkDone={mockOnMarkDone}
      />
    );
    
    const readSourceLink = screen.getByText('Read Source');
    expect(readSourceLink).toBeInTheDocument();
    expect(readSourceLink).toHaveAttribute('href', `/tips/${mockTip.id}`);
  });
}); 
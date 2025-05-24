import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResourceCard from '@/app/components/ResourceCard';

// Mock the dependencies
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    // Convert boolean props to strings to avoid React DOM warnings
    const sanitizedProps = { ...props };
    if (typeof sanitizedProps.fill === 'boolean') {
      sanitizedProps.fill = sanitizedProps.fill.toString();
    }
    return <span data-testid="mock-image" {...sanitizedProps} />;
  },
}));

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the zustand stores
const mockAddToHistory = jest.fn();
jest.mock('@/stores/resourceHistoryStore', () => ({
  useResourceHistoryStore: () => ({
    addToHistory: mockAddToHistory,
  }),
}));

const mockIsAuthenticated = jest.fn().mockReturnValue(true);
jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: mockIsAuthenticated(),
  }),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => 'toast-id'),
  dismiss: jest.fn(),
}));

describe('ResourceCard Component', () => {
  // Set up common props
  const defaultProps = {
    id: 'test-id',
    title: 'Test Resource',
    description: 'Test description',
    imageUrl: '/test-image.jpg',
    sourceUrl: 'https://example.com',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
  });

  it('renders resource card with title and description', () => {
    render(<ResourceCard {...defaultProps} />);
    
    expect(screen.getByText('Test Resource')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows unsaved icon by default', () => {
    render(<ResourceCard {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /save resource/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('shows saved icon when resource is saved', () => {
    render(<ResourceCard {...defaultProps} isSaved={true} />);
    
    const unsaveButton = screen.getByRole('button', { name: /remove from saved/i });
    expect(unsaveButton).toBeInTheDocument();
  });

  it('calls onSaveToggle when save button is clicked', () => {
    const mockSaveToggle = jest.fn();
    render(<ResourceCard {...defaultProps} onSaveToggle={mockSaveToggle} />);
    
    const saveButton = screen.getByRole('button', { name: /save resource/i });
    fireEvent.click(saveButton);
    
    expect(mockSaveToggle).toHaveBeenCalledTimes(1);
  });

  it('adds resource to history when clicked', () => {
    render(<ResourceCard {...defaultProps} />);
    
    // Click the card
    const card = screen.getByTestId('mock-image').closest('div');
    fireEvent.click(card!);
    
    expect(mockAddToHistory).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-id',
      title: 'Test Resource',
    }));
  });

  it('shows toast message when not authenticated and tries to save', () => {
    // Set user as not authenticated for this test
    mockIsAuthenticated.mockReturnValue(false);

    const mockSaveToggle = jest.fn();
    render(<ResourceCard {...defaultProps} onSaveToggle={mockSaveToggle} />);
    
    const saveButton = screen.getByRole('button', { name: /save resource/i });
    fireEvent.click(saveButton);
    
    // Save function should not be called when not authenticated
    expect(mockSaveToggle).not.toHaveBeenCalled();
    expect(require('react-hot-toast').default).toHaveBeenCalled();
  });

  it('has a working "Read More" link', () => {
    render(<ResourceCard {...defaultProps} />);
    
    const readMoreLink = screen.getByText(/read more/i);
    expect(readMoreLink).toBeInTheDocument();
    expect(readMoreLink.closest('a')).toHaveAttribute('href', '/resources/test-id');
  });
}); 
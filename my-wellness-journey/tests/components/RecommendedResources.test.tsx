import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RecommendedResources from "@/app/components/RecommendedResources";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import { useRecommendedResourcesStore } from "@/stores/recommendedResourcesStore";

// Mock the stores
jest.mock("@/stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
  useSavedStore: jest.fn(),
}));

jest.mock("@/stores/recommendedResourcesStore", () => ({
  useRecommendedResourcesStore: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/ResourceCard", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="resource-card">{title}</div>,
}));

jest.mock("@/app/components/Loading", () => ({
  Loading: () => <div data-testid="loading">Loading...</div>,
}));

jest.mock("@/app/components/EmptyState", () => ({
  EmptyState: ({ title, message }: { title: string; message: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  ),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("RecommendedResources Component", () => {
  const mockResources = [
    {
      id: "resource-1",
      title: "Diabetes Management",
      description: "Tips for managing diabetes",
      imageUrl: "https://example.com/image1.jpg",
      sourceUrl: "https://example.com/diabetes",
    },
    {
      id: "resource-2",
      title: "Heart Health",
      description: "Maintaining heart health",
      imageUrl: "https://example.com/image2.jpg",
      sourceUrl: "https://example.com/heart",
    },
    {
      id: "resource-3",
      title: "Nutrition Guide",
      description: "Healthy eating habits",
      imageUrl: "https://example.com/image3.jpg",
      sourceUrl: "https://example.com/nutrition",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth store
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          chronicConditions: [
            { id: "diabetes", name: "Diabetes" },
            { id: "hypertension", name: "Hypertension" },
          ],
        },
      },
    });

    // Mock saved store
    (useSavedStore as unknown as jest.Mock).mockReturnValue({
      savedResources: ["resource-1"],
      addResource: jest.fn(),
      removeResource: jest.fn(),
    });

    // Mock recommended resources store
    (useRecommendedResourcesStore as unknown as jest.Mock).mockReturnValue({
      resources: mockResources,
      isLoading: false,
      error: null,
      needsRefresh: jest.fn().mockReturnValue(false),
      setResources: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });
  });

  it("renders the component with correct title", () => {
    render(<RecommendedResources />);
    expect(screen.getByText("Recommended For You")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    (useRecommendedResourcesStore as unknown as jest.Mock).mockReturnValue({
      resources: [],
      isLoading: true,
      error: null,
      needsRefresh: jest.fn().mockReturnValue(true),
      setResources: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });

    render(<RecommendedResources />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("displays error state", () => {
    (useRecommendedResourcesStore as unknown as jest.Mock).mockReturnValue({
      resources: [],
      isLoading: false,
      error: "Failed to load resources",
      needsRefresh: jest.fn().mockReturnValue(false),
      setResources: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });

    render(<RecommendedResources />);
    expect(screen.getByText("Failed to load resources")).toBeInTheDocument();
  });

  it("displays empty state when no resources", () => {
    (useRecommendedResourcesStore as unknown as jest.Mock).mockReturnValue({
      resources: [],
      isLoading: false,
      error: null,
      needsRefresh: jest.fn().mockReturnValue(false),
      setResources: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });

    render(<RecommendedResources />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No recommendations available")).toBeInTheDocument();
  });

  it("displays resources when available", () => {
    render(<RecommendedResources />);
    
    // Check that all resource cards are rendered
    expect(screen.getAllByTestId("resource-card")).toHaveLength(3);
    expect(screen.getByText("Diabetes Management")).toBeInTheDocument();
    expect(screen.getByText("Heart Health")).toBeInTheDocument();
    expect(screen.getByText("Nutrition Guide")).toBeInTheDocument();
  });

  it("fetches resources when needsRefresh returns true", () => {
    const mockSetLoading = jest.fn();
    const mockNeedsRefresh = jest.fn().mockReturnValue(true);
    
    (useRecommendedResourcesStore as unknown as jest.Mock).mockReturnValue({
      resources: [],
      isLoading: false,
      error: null,
      needsRefresh: mockNeedsRefresh,
      setResources: jest.fn(),
      setLoading: mockSetLoading,
      setError: jest.fn(),
    });

    // Mock fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ reply: JSON.stringify(["diabetes", "heart health"]) }),
      })
    );

    render(<RecommendedResources />);
    
    // Check that setLoading was called with true
    expect(mockSetLoading).toHaveBeenCalledWith(true);
  });
}); 
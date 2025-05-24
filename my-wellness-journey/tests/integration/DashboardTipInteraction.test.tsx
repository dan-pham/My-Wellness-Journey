import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import toast from "react-hot-toast";

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Create a test component for the tip interaction
const TipInteractionTestComponent = () => {
  const {
    tip,
    dismissed,
    isLoading,
    dismissForToday,
    showTip,
  } = useTipOfDayStore();

  // Simulate the dashboard's interaction with the tip
  const handleDismissTip = () => {
    dismissForToday();
    toast.success("Tip dismissed for today");
  };

  const handleShowTip = () => {
    // First change the state to show the tip
    showTip();
    
    // Only show the success message
    toast.success("Showing today's tip");
  };

  return (
    <div>
      {dismissed ? (
        <div>
          <div data-testid="dismissed-state">Tip is dismissed</div>
          <button onClick={handleShowTip} data-testid="show-tip-button">
            Show Today's Tip
          </button>
        </div>
      ) : (
        <div>
          <div data-testid="tip-content">{tip?.task}</div>
          <button onClick={handleDismissTip} data-testid="dismiss-tip-button">
            Dismiss for today
          </button>
        </div>
      )}
    </div>
  );
};

describe("Dashboard Tip Interaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store before each test
    act(() => {
      useTipOfDayStore.setState({
        tip: {
          id: "test-tip",
          task: "Test Tip",
          reason: "This is a test reason",
          sourceUrl: "https://example.com",
        },
        dismissed: false,
        isLoading: false,
        error: null,
        lastFetchDate: new Date().toISOString(),
      });
    });
  });

  it("can dismiss and then show tip again", async () => {
    render(<TipInteractionTestComponent />);

    // Check that the tip is initially visible
    expect(screen.getByTestId("tip-content")).toBeInTheDocument();
    expect(screen.getByTestId("tip-content")).toHaveTextContent("Test Tip");

    // Dismiss the tip
    fireEvent.click(screen.getByTestId("dismiss-tip-button"));

    // Check that the tip is now dismissed
    expect(screen.getByTestId("dismissed-state")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Tip dismissed for today");

    // Show the tip again
    fireEvent.click(screen.getByTestId("show-tip-button"));

    // Check that the tip is visible again
    expect(screen.getByTestId("tip-content")).toBeInTheDocument();
    expect(screen.getByTestId("tip-content")).toHaveTextContent("Test Tip");
    expect(toast.success).toHaveBeenCalledWith("Showing today's tip");
  });
}); 
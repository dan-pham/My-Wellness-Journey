import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TipOfTheDay from "@/app/components/TipOfTheDay";
import { useSavedStore } from "@/stores/savedStore";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import * as authFetch from "@/lib/auth/authFetch";
import { useAuthStore } from "@/stores/authStore";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock the authFetch module
jest.mock("@/lib/auth/authFetch", () => ({
	fetchWithAuth: jest.fn(),
}));

// Mock the authStore
jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn().mockReturnValue({
		isAuthenticated: true,
		user: { id: "test-user-id" },
	}),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
	return ({ children, href, className }: any) => {
		return (
			<a href={href} className={className}>
				{children}
			</a>
		);
	};
});

describe("Dashboard Tip Save Integration Test", () => {
	const mockTip = {
		id: "tip-123",
		task: "Health Tip Task",
		reason: "This is the reason why this health tip is important for your wellness.",
		sourceUrl: "https://example.com/source",
		saved: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset the savedStore state
		act(() => {
			const savedStore = useSavedStore.getState();
			savedStore.savedTips = [];
			savedStore.savedTipsData = [];
			savedStore.loading = false;
			savedStore.error = null;
		});

		// Reset the tipOfDayStore state
		act(() => {
			const tipStore = useTipOfDayStore.getState();
			tipStore.tip = mockTip;
			tipStore.dismissed = false;
			tipStore.isLoading = false;
			tipStore.error = null;
		});

		// Mock successful API response for saving tips
		(authFetch.fetchWithAuth as jest.Mock).mockResolvedValue({
			ok: true,
			json: jest.fn().mockResolvedValue({ success: true }),
		});
	});

	it("should update savedTips state when saving a tip from TipOfTheDay", async () => {
		// Create a mock handler that simulates the dashboard page behavior
		const handleSaveTip = (tipId: string) => {
			const tipStore = useTipOfDayStore.getState();
			const savedStore = useSavedStore.getState();

			if (!tipStore.tip) return;

			const isCurrentlySaved = savedStore.savedTips.includes(tipId);

			if (isCurrentlySaved) {
				savedStore.removeTip(tipId);
			} else {
				savedStore.addTip(tipId, tipStore.tip);
			}
		};

		render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={handleSaveTip}
				savedTips={[]}
				allowDismiss={true}
			/>
		);

		// Initial state check
		expect(useSavedStore.getState().savedTips).toEqual([]);

		// Find and click the save button in the TipCard inside TipOfTheDay
		const saveButton = screen.getByLabelText("Save tip");
		fireEvent.click(saveButton);

		// Wait for state to update
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).toContain(mockTip.id);
		});

		// Verify API was called
		expect(authFetch.fetchWithAuth).toHaveBeenCalledWith(
			"/api/user/saved-tips",
			expect.objectContaining({
				method: "POST",
				body: expect.any(String),
			})
		);
	});

	it("should toggle saved state correctly when clicking multiple times", async () => {
		// Create a mock handler that simulates the dashboard page behavior
		const handleSaveTip = (tipId: string) => {
			const tipStore = useTipOfDayStore.getState();
			const savedStore = useSavedStore.getState();

			if (!tipStore.tip) return;

			const isCurrentlySaved = savedStore.savedTips.includes(tipId);

			if (isCurrentlySaved) {
				savedStore.removeTip(tipId);
			} else {
				savedStore.addTip(tipId, tipStore.tip);
			}
		};

		const { rerender } = render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={handleSaveTip}
				savedTips={[]}
				allowDismiss={true}
			/>
		);

		// Initial state - should show empty bookmark
		const saveButton = screen.getByLabelText("Save tip");

		// First click - save the tip
		fireEvent.click(saveButton);

		// Wait for state to update
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).toContain(mockTip.id);
		});

		// Re-render with updated savedTips
		rerender(
			<TipOfTheDay
				tip={{ ...mockTip, saved: true }}
				isLoading={false}
				dismissed={false}
				onSaveToggle={handleSaveTip}
				savedTips={useSavedStore.getState().savedTips}
				allowDismiss={true}
			/>
		);

		// Should now show filled bookmark
		const unsaveButton = screen.getByLabelText("Remove from saved");

		// Second click - unsave the tip
		fireEvent.click(unsaveButton);

		// Wait for state to update
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).not.toContain(mockTip.id);
		});

		// Re-render with updated savedTips
		rerender(
			<TipOfTheDay
				tip={{ ...mockTip, saved: false }}
				isLoading={false}
				dismissed={false}
				onSaveToggle={handleSaveTip}
				savedTips={useSavedStore.getState().savedTips}
				allowDismiss={true}
			/>
		);

		// Should now show empty bookmark again
		expect(screen.getByLabelText("Save tip")).toBeInTheDocument();
	});

	it("should debug the savedTips state throughout the save process", async () => {
		// Create a debugging handler
		const handleSaveTip = (tipId: string) => {
			const savedStore = useSavedStore.getState();
			const tipStore = useTipOfDayStore.getState();

			if (!tipStore.tip) {
				console.error("No tip found in tipStore");
				return;
			}

			try {
				savedStore.addTip(tipId, tipStore.tip);
			} catch (error) {
				console.error("Error in addTip:", error);
			}
		};

		// Set up the component with explicit savedTips prop
		const { rerender } = render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={handleSaveTip}
				savedTips={[]}
				allowDismiss={true}
			/>
		);

		// Click the save button
		const saveButton = screen.getByLabelText("Save tip");
		fireEvent.click(saveButton);

		// Wait for state to update
		await waitFor(() => {
			const currentSavedTips = useSavedStore.getState().savedTips;
			expect(currentSavedTips).toContain(mockTip.id);
		});
	});
});

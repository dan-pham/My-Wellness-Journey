import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TipCard from "@/app/components/TipCard";
import { useSavedStore } from "@/stores/savedStore";
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

describe("Tip Saving Integration Test", () => {
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
			const store = useSavedStore.getState();
			store.savedTips = [];
			store.savedTipsData = [];
			store.loading = false;
			store.error = null;
		});

		// Mock successful API response for saving tips
		(authFetch.fetchWithAuth as jest.Mock).mockResolvedValue({
			ok: true,
			json: jest.fn().mockResolvedValue({ success: true }),
		});
	});

	it("should update savedTips state when saving a tip", async () => {
		// Create a mock handler that calls the actual store function
		const handleSaveToggle = (tipId: string) => {
			useSavedStore.getState().addTip(tipId, mockTip);
		};

		render(<TipCard tip={mockTip} onSaveToggle={handleSaveToggle} />);

		// Initial state check
		expect(useSavedStore.getState().savedTips).toEqual([]);

		// Click the save button
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

	it("should update the UI when a tip is saved", async () => {
		// Create a mock handler that calls the actual store function
		const handleSaveToggle = (tipId: string) => {
			useSavedStore.getState().addTip(tipId, mockTip);
		};

		const { rerender } = render(<TipCard tip={mockTip} onSaveToggle={handleSaveToggle} />);

		// Click the save button
		const saveButton = screen.getByLabelText("Save tip");
		fireEvent.click(saveButton);

		// Wait for state to update
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).toContain(mockTip.id);
		});

		// Re-render with updated props
		rerender(<TipCard tip={{ ...mockTip, saved: true }} onSaveToggle={handleSaveToggle} />);

		// Check if the UI shows the filled bookmark
		await waitFor(() => {
			expect(screen.getByLabelText("Remove from saved")).toBeInTheDocument();
		});
	});

	it("should correctly toggle between saved and unsaved states", async () => {
		// Set up initial state with the tip already saved
		act(() => {
			useSavedStore.setState({
				savedTips: [mockTip.id],
				savedTipsData: [{ ...mockTip, saved: true }],
			});
		});

		// Create toggle handler that removes or adds the tip
		const handleSaveToggle = (tipId: string) => {
			const store = useSavedStore.getState();
			if (store.savedTips.includes(tipId)) {
				store.removeTip(tipId);
			} else {
				store.addTip(tipId, mockTip);
			}
		};

		// Render with saved=true
		const { rerender } = render(
			<TipCard tip={{ ...mockTip, saved: true }} onSaveToggle={handleSaveToggle} />
		);

		// Verify initial state shows filled bookmark
		expect(screen.getByLabelText("Remove from saved")).toBeInTheDocument();

		// Click to unsave
		fireEvent.click(screen.getByLabelText("Remove from saved"));

		// Wait for state to update
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).not.toContain(mockTip.id);
		});

		// Re-render with updated props
		rerender(<TipCard tip={{ ...mockTip, saved: false }} onSaveToggle={handleSaveToggle} />);

		// Check if UI shows empty bookmark
		await waitFor(() => {
			expect(screen.getByLabelText("Save tip")).toBeInTheDocument();
		});

		// Click to save again
		fireEvent.click(screen.getByLabelText("Save tip"));

		// Wait for state to update
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).toContain(mockTip.id);
		});
	});

	it("should handle the case where savedTips is empty in the store", async () => {
		// Explicitly set savedTips to empty array
		act(() => {
			useSavedStore.setState({
				savedTips: [],
				savedTipsData: [],
			});
		});

		// Create a mock handler that logs and calls the store function
		const handleSaveToggle = (tipId: string) => {
			useSavedStore.getState().addTip(tipId, mockTip);
		};

		render(<TipCard tip={mockTip} onSaveToggle={handleSaveToggle} />);

		// Initial state check
		expect(useSavedStore.getState().savedTips).toEqual([]);

		// Click the save button
		const saveButton = screen.getByLabelText("Save tip");
		fireEvent.click(saveButton);

		// Wait and verify state was updated
		await waitFor(() => {
			expect(useSavedStore.getState().savedTips).toContain(mockTip.id);
		});
	});
});

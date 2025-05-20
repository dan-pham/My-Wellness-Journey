"use client";

import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import TipDetailPage from "@/app/tips/[id]/page";
import { useSavedStore } from "@/stores/savedStore";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

// Create mock functions outside so we can access them in tests
const mockBack = jest.fn();
const mockPush = jest.fn();

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(() => ({
		push: mockPush,
		back: mockBack,
	})),
	useParams: jest.fn(() => ({ id: "medline-test-id" })),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/utils/contentUtils", () => ({
	processHtmlForDetail: jest.fn((content) => `<div>${content}</div>`),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
	error: jest.fn(),
	custom: jest.fn(),
	success: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);

describe("TipDetailPage", () => {
	// Mock data
	const mockTip = {
		id: "medline-test-id",
		task: "Test Health Topic",
		reason: "This is test content about health",
		sourceUrl: "https://medlineplus.gov/test",
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock fetch response
		global.fetch = jest.fn().mockImplementation(() =>
			Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						title: mockTip.task,
						content: mockTip.reason,
						url: mockTip.sourceUrl,
					}),
			})
		);

		// Setup store mocks with type assertions to fix TypeScript errors
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			addTip: jest.fn(),
			removeTip: jest.fn(),
		});

		(useAuthStore as unknown as jest.Mock).mockReturnValue({
			isAuthenticated: true,
		});
	});

	it("renders loading state initially", async () => {
		// Mock a delayed API response to ensure loading state is visible
		global.fetch = jest.fn().mockImplementation(() =>
			new Promise(resolve => {
				setTimeout(() => {
					resolve({
						ok: true,
						json: () => Promise.resolve({
							title: mockTip.task,
							content: mockTip.reason,
							url: mockTip.sourceUrl,
						}),
					});
				}, 100);
			})
		);

		await act(async () => {
			render(<TipDetailPage />);
		});

		// Check for the animate-pulse class which is present in the loading state
		expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
	});

	it("renders tip details after loading", async () => {
		await act(async () => {
			render(<TipDetailPage />);
		});

		await waitFor(() => {
			// Check for the task text in the heading
			const headingElement = screen.getByRole('heading', { level: 1 });
			expect(headingElement).toHaveTextContent(mockTip.task);
		});

		// Check for the source link
		expect(screen.getByText(/source: medlineplus/i)).toBeInTheDocument();
	});

	it("shows error message when API call fails", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock a failed API call
		global.fetch = jest.fn().mockImplementation(() =>
			Promise.resolve({
				ok: false,
				status: 500,
			})
		);

		await act(async () => {
			render(<TipDetailPage />);
		});

		await waitFor(() => {
			expect(screen.getByText(/error/i)).toBeInTheDocument();
		});

		// Restore the original implementations
		console.error = originalConsoleError;
	});

	it("handles back button click", async () => {
		await act(async () => {
			render(<TipDetailPage />);
		});

		await waitFor(() => {
			expect(screen.getByText(/back/i)).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText(/back/i));
		expect(mockBack).toHaveBeenCalled();
	});

	it("handles save button click when authenticated", async () => {
		const mockAddTip = jest.fn();
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			addTip: mockAddTip,
			removeTip: jest.fn(),
		});

		await act(async () => {
			render(<TipDetailPage />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText(/save tip/i)).toBeInTheDocument();
		});

		fireEvent.click(screen.getByLabelText(/save tip/i));
		expect(mockAddTip).toHaveBeenCalled();
	});

	it("shows login toast when trying to save while unauthenticated", async () => {
		// Set unauthenticated state
		(useAuthStore as unknown as jest.Mock).mockReturnValue({
			isAuthenticated: false,
		});

		await act(async () => {
			render(<TipDetailPage />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText(/save tip/i)).toBeInTheDocument();
		});

		fireEvent.click(screen.getByLabelText(/save tip/i));
		expect(toast.error).toHaveBeenCalledWith("Please log in to save tips", expect.anything());
		expect(toast.custom).toHaveBeenCalled();
	});

	it("handles unsave button click", async () => {
		// Set saved state
		const mockRemoveTip = jest.fn();
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: ["medline-test-id"],
			addTip: jest.fn(),
			removeTip: mockRemoveTip,
		});

		await act(async () => {
			render(<TipDetailPage />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText(/remove from saved/i)).toBeInTheDocument();
		});

		fireEvent.click(screen.getByLabelText(/remove from saved/i));
		expect(mockRemoveTip).toHaveBeenCalledWith("medline-test-id");
	});
});

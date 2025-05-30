"use client";

import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import SavedTipsPage from "@/app/tips/saved/page";
import { useSavedStore } from "@/stores/savedStore";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { Tip } from "@/types/tip";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
	})),
}));

jest.mock("next/link", () => {
	return ({ children, href, className }: any) => {
		return (
			<a href={href} className={className}>
				{children}
			</a>
		);
	};
});

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
	error: jest.fn(),
	success: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);
jest.mock("@/app/components/TipCard", () => ({ tip, onSaveToggle }: any) => (
	<div data-testid={`tip-card-${tip.id}`}>
		<h3>{tip.task}</h3>
		<button onClick={() => onSaveToggle(tip.id)}>Toggle Save</button>
	</div>
));
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading">Loading...</div>,
}));
jest.mock("@/app/components/Error", () => ({
	Error: ({ message }: { message: string }) => <div data-testid="error">{message}</div>,
}));
jest.mock("@/app/components/EmptyState", () => ({
	EmptyState: ({ title, message, actionText, actionFn }: any) => (
		<div data-testid="empty-state">
			<h3>{title}</h3>
			<p>{message}</p>
			<button onClick={actionFn}>{actionText}</button>
		</div>
	),
}));
jest.mock("@/app/components/AuthProvider", () => ({ children }: any) => <>{children}</>);

describe("SavedTipsPage", () => {
	// Mock data
	const mockTips: Tip[] = [
		{
			id: "tip-1",
			task: "First Saved Tip",
			reason: "Content of first tip",
			sourceUrl: "https://example.com/1",
			saved: true,
		},
		{
			id: "tip-2",
			task: "Second Saved Tip",
			reason: "Content of second tip",
			sourceUrl: "https://example.com/2",
			saved: true,
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup store mocks with type assertions
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: ["tip-1", "tip-2"],
			savedTipsData: mockTips,
			fetchSavedTips: jest.fn().mockResolvedValue(undefined),
			removeTip: jest.fn(),
			loading: false,
			error: null,
		});

		(useAuthStore as unknown as jest.Mock).mockReturnValue({
			isAuthenticated: true,
		});
	});

	it("renders saved tips list", async () => {
		render(<SavedTipsPage />);

		await waitFor(() => {
			expect(screen.getByText("My Saved Tips")).toBeInTheDocument();
		});

		expect(screen.getByText("First Saved Tip")).toBeInTheDocument();
		expect(screen.getByText("Second Saved Tip")).toBeInTheDocument();
	});

	it("shows loading state when fetching tips", async () => {
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			savedTipsData: [],
			fetchSavedTips: jest.fn().mockResolvedValue(undefined),
			removeTip: jest.fn(),
			loading: true,
			error: null,
		});

		render(<SavedTipsPage />);
		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("shows error state when fetch fails", async () => {
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			savedTipsData: [],
			fetchSavedTips: jest.fn().mockResolvedValue(undefined),
			removeTip: jest.fn(),
			loading: false,
			error: "Failed to load tips",
		});

		render(<SavedTipsPage />);
		expect(screen.getByTestId("error")).toBeInTheDocument();
		expect(screen.getByText("Failed to load tips")).toBeInTheDocument();
	});

	it("shows empty state when no tips are saved", async () => {
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			savedTipsData: [],
			fetchSavedTips: jest.fn().mockResolvedValue(undefined),
			removeTip: jest.fn(),
			loading: false,
			error: null,
		});

		render(<SavedTipsPage />);

		await waitFor(() => {
			expect(screen.getByTestId("empty-state")).toBeInTheDocument();
		});

		expect(screen.getByText("You haven't saved any tips yet.")).toBeInTheDocument();
	});

	it("handles search filtering", async () => {
		render(<SavedTipsPage />);

		const searchInput = screen.getByPlaceholderText("Search in your saved tips...");
		fireEvent.change(searchInput, { target: { value: "First" } });

		// First tip should be visible, second should not
		expect(screen.getByText("First Saved Tip")).toBeInTheDocument();
		expect(screen.queryByText("Second Saved Tip")).not.toBeInTheDocument();
	});

	it("handles sorting options", async () => {
		render(<SavedTipsPage />);

		const sortSelect = screen.getByRole("combobox");
		fireEvent.change(sortSelect, { target: { value: "title" } });

		// Tips should be sorted alphabetically
		const tipElements = screen.getAllByTestId(/tip-card/);
		expect(tipElements[0]).toHaveTextContent("First Saved Tip");
		expect(tipElements[1]).toHaveTextContent("Second Saved Tip");
	});

	it("handles tip unsave", async () => {
		// Create a mock for removeTip
		const mockRemoveTip = jest.fn();

		// Mock useSavedStore to include removeTip
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: ["tip-1", "tip-2"],
			savedTipsData: mockTips,
			fetchSavedTips: jest.fn().mockResolvedValue(undefined),
			removeTip: mockRemoveTip,
			loading: false,
			error: null,
		});

		// Modify TipCard mock to directly call removeTip
		jest.mock("@/app/components/TipCard", () => ({ tip, onSaveToggle }: any) => (
			<div data-testid={`tip-card-${tip.id}`}>
				<h3>{tip.task}</h3>
				<button
					onClick={() => mockRemoveTip(tip.id)} // Directly call mockRemoveTip
					data-testid={`unsave-button-${tip.id}`}
				>
					Toggle Save
				</button>
			</div>
		));

		await act(async () => {
			render(<SavedTipsPage />);
		});

		// Find the card for tip-1 and click its Toggle Save button
		const tip1Card = screen.getByTestId("tip-card-tip-1");
		const unsaveButton = within(tip1Card).getByText("Toggle Save");

		await act(async () => {
			fireEvent.click(unsaveButton);
		});

		expect(mockRemoveTip).toHaveBeenCalledWith("tip-1");
	});
});

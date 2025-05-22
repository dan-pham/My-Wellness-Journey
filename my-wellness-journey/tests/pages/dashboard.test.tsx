"use client";

import { render, screen, waitFor, act } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { useAuthStore } from "@/stores/authStore";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import { useSavedStore } from "@/stores/savedStore";
import { useResourceHistoryStore } from "@/stores/resourceHistoryStore";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/stores/authStore", () => {
	const mockGetState = jest.fn().mockReturnValue({
		isAuthenticated: true,
		getToken: jest.fn().mockReturnValue("mock-token"),
		user: {
			email: "test@example.com"
		}
	});
	
	const mockAuthStore = jest.fn().mockReturnValue({
		isAuthenticated: true,
		user: {
			email: "test@example.com"
		}
	});
	
	// Add getState as a property of the mock function
	(mockAuthStore as any).getState = mockGetState;
	
	return {
		useAuthStore: mockAuthStore
	};
});

jest.mock("@/stores/tipOfTheDayStore", () => ({
	useTipOfDayStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

jest.mock("@/stores/resourceHistoryStore", () => ({
	useResourceHistoryStore: jest.fn(),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);
jest.mock("@/app/components/TipCard", () => ({ tip }: { tip: { title: string } }) => (
	<div data-testid="tip-card">{tip.title}</div>
));
jest.mock(
	"@/app/components/ResourceCard",
	() =>
		({ resource }: { resource?: { title: string } }) =>
			<div data-testid="resource-card">{resource?.title || 'No title'}</div>
);
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading-spinner">Loading...</div>,
}));
jest.mock("@/app/components/EmptyState", () => ({
	EmptyState: ({ title, description }: { title: string; description: string }) => (
		<div data-testid="empty-state">
			<h3>{title}</h3>
			<p>{description}</p>
		</div>
	),
}));

describe("Dashboard Page", () => {
	// Store the original console.error
	const originalConsoleError = console.error;
	
	beforeAll(() => {
		// Suppress console.error before all tests
		console.error = jest.fn();
	});
	
	afterAll(() => {
		// Restore console.error after all tests
		console.error = originalConsoleError;
	});

	// Mock data
	const mockProfile = {
		firstName: "John",
		lastName: "Doe",
		dateOfBirth: "1990-01-01",
		gender: "male",
		conditions: [{ id: "1", name: "Condition 1" }],
	};

	const mockTip = {
		id: "1",
		title: "Test Tip",
		content: "This is a test tip",
		category: "general",
	};

	const mockResource = {
		id: "1",
		title: "Test Resource",
		description: "This is a test resource",
		url: "https://example.com",
		type: "article",
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock fetch response - delay to ensure loading state is visible
		global.fetch = jest.fn().mockImplementation(
			() =>
				new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							ok: true,
							json: () => Promise.resolve({ profile: mockProfile }),
						});
					}, 100);
				})
		);

		// No need to mock useAuthStore again, it's already set up in the jest.mock

		(useTipOfDayStore as unknown as jest.Mock).mockReturnValue({
			tip: mockTip,
			dismissed: false,
			isLoading: false,
			error: null,
			fetchTipOfDay: jest.fn(),
			dismissForToday: jest.fn(),
			showTip: jest.fn(),
			resetStore: jest.fn(),
			migrateTipIfNeeded: jest.fn(),
		});

		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			savedResources: [],
			savedResourcesData: [mockResource],
			addTip: jest.fn(),
			removeTip: jest.fn(),
			addResource: jest.fn(),
			removeResource: jest.fn(),
			fetchSavedResources: jest.fn(),
			fetchSavedTips: jest.fn(),
		});

		(useResourceHistoryStore as unknown as jest.Mock).mockReturnValue({
			history: [mockResource],
		});
	});

	it("renders loading state initially", async () => {
		render(<DashboardPage />);
		
		// Check for loading state immediately
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		
		// Wait for loading state to disappear
		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});
	});

	it("handles error state when profile fetch fails", async () => {
		global.fetch = jest.fn().mockImplementation(() =>
			Promise.resolve({
				ok: false,
				status: 500,
				statusText: "Server Error",
				text: () => Promise.resolve("Error"),
			})
		);

		await act(async () => {
			render(<DashboardPage />);
		});

		await waitFor(() => {
			expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		});
	});
});

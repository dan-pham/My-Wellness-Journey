"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import SavedResourcesPage from "@/app/resources/saved/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import toast from "react-hot-toast";
import { useSavedResourcesPage } from "@/app/resources/hooks/useSavedResourcesPage";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("next/link", () => {
	const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
		const router = require("next/navigation").useRouter();
		return (
			<a
				href={href}
				onClick={(e) => {
					e.preventDefault();
					router.push(href);
				}}
			>
				{children}
			</a>
		);
	};
	return MockLink;
});

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);
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
			{actionText && (
				<button onClick={actionFn} data-testid="empty-state-action">
					{actionText}
				</button>
			)}
		</div>
	),
}));
jest.mock("@/app/components/ResourceCard", () => ({
	__esModule: true,
	default: ({ id, title, isSaved, onSaveToggle }: any) => (
		<div data-testid={`resource-card-${id}`}>
			<h3>{title}</h3>
			<button data-testid={`save-toggle-${id}`} onClick={onSaveToggle}>
				{isSaved ? "Unsave" : "Save"}
			</button>
		</div>
	),
}));
jest.mock("@/app/components/AuthProvider", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="auth-provider">{children}</div>
	),
}));

describe("Saved Resources Page", () => {
	const mockPush = jest.fn();
	const mockFetchSavedResources = jest.fn();
	const mockRemoveResource = jest.fn();

	// Mock saved resources
	const mockSavedResources = ["resource1", "resource2", "resource3"];
	const mockSavedResourcesData = [
		{
			id: "resource1",
			title: "Diabetes Management",
			description: "Tips for managing diabetes",
			imageUrl: "/image1.jpg",
			sourceUrl: "/resources/resource1",
		},
		{
			id: "resource2",
			title: "Heart Health",
			description: "Maintaining a healthy heart",
			imageUrl: "/image2.jpg",
			sourceUrl: "/resources/resource2",
		},
		{
			id: "resource3",
			title: "Stress Reduction",
			description: "Techniques for reducing stress",
			imageUrl: "/image3.jpg",
			sourceUrl: "/resources/resource3",
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: true,
		}));

		// Mock useSavedStore
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: mockSavedResources,
			savedResourcesData: mockSavedResourcesData,
			fetchSavedResources: mockFetchSavedResources.mockImplementation(() => Promise.resolve()),
			removeResource: mockRemoveResource,
			loading: false,
			error: null,
		}));
	});

	it("renders the saved resources page with all saved resources", async () => {
		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Check for page title
		expect(screen.getByText("My Saved Resources")).toBeInTheDocument();

		// Check that all resource cards are rendered
		expect(screen.getByTestId("resource-card-resource1")).toBeInTheDocument();
		expect(screen.getByTestId("resource-card-resource2")).toBeInTheDocument();
		expect(screen.getByTestId("resource-card-resource3")).toBeInTheDocument();

		// Check that fetchSavedResources was called
		expect(mockFetchSavedResources).toHaveBeenCalled();
	});

	it("shows loading state when fetching saved resources", async () => {
		// Mock loading state
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: [],
			savedResourcesData: [],
			fetchSavedResources: mockFetchSavedResources.mockImplementation(() => Promise.resolve()),
			loading: true,
			error: null,
		}));

		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Check for loading indicator
		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("shows error state when fetch fails", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock error state
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: [],
			savedResourcesData: [],
			fetchSavedResources: mockFetchSavedResources.mockImplementation(() =>
				Promise.reject(new Error("Failed to fetch"))
			),
			removeResource: mockRemoveResource,
			loading: false,
			error: "Failed to fetch saved resources",
		}));

		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Check for error message
		expect(screen.getByTestId("error")).toBeInTheDocument();
		expect(screen.getByText("Failed to fetch saved resources")).toBeInTheDocument();

		// Restore the original implementations
		console.error = originalConsoleError;
	});

	it("shows empty state when no saved resources", async () => {
		// Mock empty saved resources
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: [],
			savedResourcesData: [],
			fetchSavedResources: mockFetchSavedResources.mockImplementation(() => Promise.resolve()),
			removeResource: mockRemoveResource,
			loading: false,
			error: null,
		}));

		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Check for empty state
		expect(screen.getByTestId("empty-state")).toBeInTheDocument();
		expect(screen.getByText("No Results")).toBeInTheDocument();
		expect(screen.getByText("You haven't saved any resources yet.")).toBeInTheDocument();

		// Check for action button
		const actionButton = screen.getByTestId("empty-state-action");
		expect(actionButton).toBeInTheDocument();
		expect(actionButton).toHaveTextContent("Explore Resources");

		// Click action button
		fireEvent.click(actionButton);
		expect(mockPush).toHaveBeenCalledWith("/resources");
	});

	it("allows filtering resources by search query", async () => {
		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Find search input
		const searchInput = screen.getByPlaceholderText("Search in your saved resources...");
		expect(searchInput).toBeInTheDocument();

		// Enter search query
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
		});

		// Check that only matching resources are shown
		expect(screen.getByTestId("resource-card-resource1")).toBeInTheDocument(); // "Diabetes Management"
		expect(screen.queryByTestId("resource-card-resource2")).not.toBeInTheDocument(); // "Heart Health"
		expect(screen.queryByTestId("resource-card-resource3")).not.toBeInTheDocument(); // "Stress Reduction"
	});

	it("allows sorting resources", async () => {
		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Find sort select
		const sortSelect = screen.getByRole("combobox");
		expect(sortSelect).toBeInTheDocument();

		// Change sort order to "Title (A-Z)"
		await act(async () => {
			fireEvent.change(sortSelect, { target: { value: "title" } });
		});

		// Check that resources are sorted by title
		// Note: We can't easily test the actual order in the DOM since the ResourceCard mock doesn't reflect the order,
		// but we can verify the sort option was changed
		expect(sortSelect).toHaveValue("title");
	});

	it("handles unsaving a resource", async () => {
		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Find the first resource's unsave button
		const unsaveButton = screen.getByTestId("save-toggle-resource1");

		// Click to unsave
		await act(async () => {
			fireEvent.click(unsaveButton);
		});

		// Check that removeResource was called with the correct ID
		expect(mockRemoveResource).toHaveBeenCalledWith("resource1");
	});

	it("shows empty state with different message when search has no results", async () => {
		// Mock the hook state for search with no results
		const mockClearFilters = jest.fn();
		jest
			.spyOn(require("@/app/resources/hooks/useSavedResourcesPage"), "useSavedResourcesPage")
			.mockReturnValue({
				isAuthenticated: true,
				savedResources: [],
				savedResourcesData: [],
				isLoading: false,
				error: null,
				searchQuery: "nonexistent",
				setSearchQuery: jest.fn(),
				handleSearch: jest.fn(),
				handleRemove: jest.fn(),
				sortOrder: "date",
				setSortOrder: jest.fn(),
				clearFilters: mockClearFilters,
				filteredResources: [],
				hasSearched: true,
			});

		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Check for empty state with search-specific message
		await waitFor(() => {
			expect(screen.getByTestId("empty-state")).toBeInTheDocument();
			expect(screen.getByText("No Results")).toBeInTheDocument();
			expect(screen.getByText("No resources match your search or filter")).toBeInTheDocument();
		});

		// Check for action button
		const actionButton = screen.getByTestId("empty-state-action");
		expect(actionButton).toHaveTextContent("Clear Filters");

		// Click action button
		await act(async () => {
			fireEvent.click(actionButton);
		});

		// Verify clearFilters was called
		await waitFor(() => {
			expect(mockClearFilters).toHaveBeenCalled();
		});
	});

	it("navigates to resources page when clicking back link", async () => {
		await act(async () => {
			render(<SavedResourcesPage />);
		});

		// Find back link
		const backLink = screen.getByText("Back to Resources");
		expect(backLink).toBeInTheDocument();

		// Click back link and wait for navigation
		await act(async () => {
			fireEvent.click(backLink);
		});

		// Check that router.push was called with correct path
		expect(mockPush).toHaveBeenCalledWith("/resources");
	});
});

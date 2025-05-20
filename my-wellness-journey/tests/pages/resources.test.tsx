"use client";

import { render, screen, waitFor, act, fireEvent, within } from "@testing-library/react";
import ResourcesPage from "@/app/resources/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useHealthStore } from "@/stores/healthStore";
import { useSavedStore } from "@/stores/savedStore";
import toast from "react-hot-toast";
import React from "react";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/stores/healthStore", () => ({
	useHealthStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
	custom: jest.fn(),
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
			{actionText && <button onClick={actionFn}>{actionText}</button>}
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

// Mock window.location
Object.defineProperty(window, "location", {
	value: {
		href: "",
		replace: jest.fn(),
	},
	writable: true,
});

describe("Resources Page", () => {
	const mockPush = jest.fn();
	const mockFetchResources = jest.fn();
	const mockFetchSavedResources = jest.fn();
	const mockAddResource = jest.fn();
	const mockRemoveResource = jest.fn();

	// Mock resources
	const mockResources = [
		{
			id: "resource1",
			title: "Diabetes Management",
			content: "Tips for managing diabetes",
			imageUrl: "/image1.jpg",
			sourceUrl: "/resources/resource1",
		},
		{
			id: "resource2",
			title: "Heart Health",
			content: "Maintaining a healthy heart",
			imageUrl: "/image2.jpg",
			sourceUrl: "/resources/resource2",
		},
	];

	// Mock saved resources
	const mockSavedResources = ["resource1"];
	const mockSavedResourcesData = [
		{
			id: "resource1",
			title: "Diabetes Management",
			content: "Tips for managing diabetes",
			imageUrl: "/image1.jpg",
			sourceUrl: "/resources/resource1",
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset window.location.href
		window.location.href = "";

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: true,
		}));

		// Mock useHealthStore
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			resources: mockResources,
			resourcesLoading: false,
			resourcesError: null,
			fetchResources: mockFetchResources.mockImplementation(() => Promise.resolve()),
		}));

		// Mock useSavedStore
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: mockSavedResources,
			savedResourcesData: mockSavedResourcesData,
			addResource: mockAddResource.mockImplementation(() => Promise.resolve()),
			removeResource: mockRemoveResource.mockImplementation(() => Promise.resolve()),
			fetchSavedResources: mockFetchSavedResources.mockImplementation(() => Promise.resolve()),
			loading: false,
			error: null,
		}));
	});

	it("renders the resources page with search functionality", async () => {
		await act(async () => {
			render(<ResourcesPage />);
		});

		// Check for search input
		const searchInput = screen.getByPlaceholderText("Search health resources...");
		expect(searchInput).toBeInTheDocument();

		// Check for search button
		const searchButton = screen.getByRole("button", { name: /search/i });
		expect(searchButton).toBeInTheDocument();

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Wait for the search to complete
		await waitFor(() => {
			expect(mockFetchResources).toHaveBeenCalledWith("diabetes");
		});
	});

	it("displays saved resources when user is authenticated", async () => {
		await act(async () => {
			render(<ResourcesPage />);
		});

		// Wait for saved resources to load
		await waitFor(() => {
			expect(screen.getByText("My Saved Resources")).toBeInTheDocument();
		});

		// Check if saved resource card is rendered in the saved resources section
		const savedResourcesSection = screen.getByText("My Saved Resources").closest("section");
		expect(savedResourcesSection).toBeInTheDocument();
		const savedResourceCard = within(savedResourcesSection!).getByTestId("resource-card-resource1");
		expect(savedResourceCard).toBeInTheDocument();
	});

	it("hides saved resources when user is not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: false,
		}));

		await act(async () => {
			render(<ResourcesPage />);
		});

		// Check that saved resources section is not rendered
		expect(screen.queryByText("My Saved Resources")).not.toBeInTheDocument();
	});

	it("shows empty state when no search has been made", async () => {
		// Mock resources as empty and hasSearched as false
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			resources: [],
			resourcesLoading: false,
			resourcesError: null,
			fetchResources: mockFetchResources.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<ResourcesPage />);
		});

		// Check for the empty state UI elements
		expect(screen.getByText("Discover Health Resources")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Search for health topics above to find trusted resources that can help you on your wellness journey."
			)
		).toBeInTheDocument();

		// Check for topic suggestions
		const topics = [
			"diabetes",
			"heart health",
			"nutrition",
			"exercise",
			"sleep",
			"stress management",
		];
		topics.forEach((topic) => {
			expect(screen.getByText(topic)).toBeInTheDocument();
		});
	});

	it("shows loading state when fetching resources", async () => {
		// Mock loading state
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			resources: [],
			resourcesLoading: true,
			resourcesError: null,
			fetchResources: mockFetchResources,
		}));

		await act(async () => {
			render(<ResourcesPage />);
		});

		// Check for loading indicator
		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("shows error state when resource fetch fails", async () => {
		// Mock error state
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			resources: [],
			resourcesLoading: false,
			resourcesError: "Failed to fetch resources",
			fetchResources: mockFetchResources,
		}));

		await act(async () => {
			render(<ResourcesPage />);
		});

		// Check for error message
		expect(screen.getByTestId("error")).toBeInTheDocument();
		expect(screen.getByText("Failed to fetch resources")).toBeInTheDocument();
	});

	it("handles saving a resource when authenticated", async () => {
		await act(async () => {
			render(<ResourcesPage />);
		});

		// Find the unsaved resource (resource2) and click its save button
		const saveButton = screen.getByTestId("save-toggle-resource2");
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Wait for the save operation to complete
		await waitFor(() => {
			expect(mockAddResource).toHaveBeenCalledWith("resource2", expect.any(Object));
		});
	});

	it("handles unsaving a resource", async () => {
		await act(async () => {
			render(<ResourcesPage />);
		});

		// Find the saved resource (resource1) in the saved resources section
		const savedResourcesSection = screen.getByText("My Saved Resources").closest("section");
		expect(savedResourcesSection).toBeInTheDocument();
		const unsaveButton = within(savedResourcesSection!).getByTestId("save-toggle-resource1");

		await act(async () => {
			fireEvent.click(unsaveButton);
		});

		// Wait for the unsave operation to complete
		await waitFor(() => {
			expect(mockRemoveResource).toHaveBeenCalledWith("resource1");
		});
	});

	it("shows toast when trying to save a resource while not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: false,
		}));

		await act(async () => {
			render(<ResourcesPage />);
		});

		// Find a resource and click its save button
		const saveButton = screen.getByTestId("save-toggle-resource2");
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Wait for the toast to appear
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Please log in to save resources",
				expect.any(Object)
			);
			expect(toast.custom).toHaveBeenCalled();
		});
	});

	it("handles quick search topic selection", async () => {
		// Mock resources as empty for the initial state
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			resources: [],
			resourcesLoading: false,
			resourcesError: null,
			fetchResources: mockFetchResources.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<ResourcesPage />);
		});

		// Find a topic button (e.g., "diabetes") and click it
		const topicButtons = screen.getAllByRole("button");
		const diabetesButton = Array.from(topicButtons).find(
			(button) => button.textContent === "diabetes"
		);

		await act(async () => {
			fireEvent.click(diabetesButton!);
		});

		// Wait for the search to complete
		await waitFor(() => {
			expect(mockFetchResources).toHaveBeenCalledWith("diabetes");
		});
	});
});

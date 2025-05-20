"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import ResourceDetailPage from "@/app/resources/[id]/page";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import { useResourceHistoryStore } from "@/stores/resourceHistoryStore";
import toast from "react-hot-toast";
import * as myhealthfinder from "@/lib/api/myhealthfinder";

// Mock modules
jest.mock("next/navigation", () => ({
	useParams: jest.fn(),
	useRouter: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

jest.mock("@/stores/resourceHistoryStore", () => ({
	useResourceHistoryStore: jest.fn(),
}));

// Mock components
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="resource-image" />,
}));

jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
	custom: jest.fn(),
}));

// Mock API fetch
jest.mock("@/lib/api/myhealthfinder", () => ({
	fetchHealthDataById: jest.fn(),
}));

describe("Resource Detail Page", () => {
	const mockPush = jest.fn();
	const mockBack = jest.fn();
	const mockAddToHistory = jest.fn();
	const mockAddResource = jest.fn();
	const mockRemoveResource = jest.fn();

	// Mock resource
	const mockResource = {
		id: "resource1",
		title: "Diabetes Management",
		content: "<p>Tips for managing diabetes</p>",
		fullContent: "<p>Tips for managing diabetes</p>",
		imageUrl: "/image1.jpg",
		source: "health.gov",
		url: "https://health.gov/resource1",
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock useParams
		(useParams as jest.Mock).mockImplementation(() => ({
			id: "resource1",
		}));

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
			back: mockBack,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: true,
		}));

		// Mock useSavedStore
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: ["resource1"],
			addResource: mockAddResource,
			removeResource: mockRemoveResource,
		}));

		// Mock useResourceHistoryStore
		(useResourceHistoryStore as unknown as jest.Mock).mockImplementation(() => ({
			addToHistory: mockAddToHistory,
		}));

		// Mock fetchHealthDataById
		(myhealthfinder.fetchHealthDataById as jest.Mock).mockResolvedValue(mockResource);
	});

	it("renders the resource detail page with loading state initially", async () => {
		// Delay the API response
		(myhealthfinder.fetchHealthDataById as jest.Mock).mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve(mockResource), 100))
		);

		render(<ResourceDetailPage />);

		// Check for loading state
		expect(screen.getByText("Header")).toBeInTheDocument();

		// Look for elements in the loading skeleton
		const loadingElements = document.querySelectorAll(".bg-gray-200");
		expect(loadingElements.length).toBeGreaterThan(0);
	});

	it("renders resource details after loading", async () => {
		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Check for resource title
		await waitFor(() => {
			expect(screen.getByText("Diabetes Management")).toBeInTheDocument();
		});

		// Check for back button
		expect(screen.getByText("Back")).toBeInTheDocument();

		// Check for save button (should show as "Saved" since it's in savedResources)
		expect(screen.getByText("Saved")).toBeInTheDocument();

		// Check for content
		expect(screen.getByRole("article")).toBeInTheDocument();

		// Check that addToHistory was called
		expect(mockAddToHistory).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "resource1",
				title: "Diabetes Management",
			})
		);
	});

	it("handles resource not found error", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock API to return null (resource not found)
		(myhealthfinder.fetchHealthDataById as jest.Mock).mockResolvedValue(null);

		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Check for error message
		await waitFor(() => {
			expect(screen.getByText("Error")).toBeInTheDocument();
			expect(
				screen.getByText("Unable to load resource details. Please try again later.")
			).toBeInTheDocument();
		});

		// Check for back button in error state
		const goBackButton = screen.getByText("Go Back");
		expect(goBackButton).toBeInTheDocument();

		// Click back button
		fireEvent.click(goBackButton);
		expect(mockBack).toHaveBeenCalled();

		// Restore the original implementations
		console.error = originalConsoleError;
	});

	it("handles API fetch error", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock API to throw an error
		(myhealthfinder.fetchHealthDataById as jest.Mock).mockRejectedValue(new Error("API error"));

		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Check for error message
		await waitFor(() => {
			expect(screen.getByText("Error")).toBeInTheDocument();
			expect(screen.getByText(/Unable to load resource details/)).toBeInTheDocument();
		});

		// Restore the original implementations
		console.error = originalConsoleError;
	});

	it("allows unsaving a saved resource", async () => {
		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Find the save button (which should show "Saved")
		const saveButton = screen.getByText("Saved").closest("button");

		// Click to unsave
		await act(async () => {
			fireEvent.click(saveButton!);
		});

		// Check that removeResource was called with the correct ID
		expect(mockRemoveResource).toHaveBeenCalledWith("resource1");
	});

	it("allows saving an unsaved resource", async () => {
		// Mock the resource as not saved
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: [], // Empty array means resource1 is not saved
			addResource: mockAddResource,
			removeResource: mockRemoveResource,
		}));

		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Find the save button (which should show "Save")
		const saveButton = screen.getByText("Save").closest("button");

		// Click to save
		await act(async () => {
			fireEvent.click(saveButton!);
		});

		// Check that addResource was called with the correct ID and resource data
		expect(mockAddResource).toHaveBeenCalledWith("resource1", expect.any(Object));
	});

	it("shows a login prompt when trying to save while not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: false,
		}));

		// Mock the resource as not saved
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedResources: [], // Empty array means resource1 is not saved
			addResource: mockAddResource,
			removeResource: mockRemoveResource,
		}));

		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Wait for the resource to load
		await waitFor(() => {
			expect(screen.getByText("Diabetes Management")).toBeInTheDocument();
		});

		// Find the save button
		const saveButton = screen.getByText("Save").closest("button");

		// Click to save
		await act(async () => {
			fireEvent.click(saveButton!);
		});

		// Check that toast.error was called
		expect(toast.error).toHaveBeenCalledWith("Please log in to save resources", expect.any(Object));
		expect(toast.custom).toHaveBeenCalled();
	});

	it("navigates back when clicking the back button", async () => {
		await act(async () => {
			render(<ResourceDetailPage />);
		});

		// Find the back button
		const backButton = screen.getByText("Back");

		// Click to go back
		fireEvent.click(backButton);

		// Check that router.back was called
		expect(mockBack).toHaveBeenCalled();
	});
});

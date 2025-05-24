"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import ResourceDetailPage from "@/app/resources/[id]/page";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import { useResourceHistoryStore } from "@/stores/resourceHistoryStore";
import toast from "react-hot-toast";
import * as myhealthfinder from "@/lib/api/myhealthfinder";
import { useHealthStore } from "@/stores/healthStore";

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

jest.mock("@/stores/healthStore", () => ({
	useHealthStore: jest.fn(),
}));

// Mock components
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="resource-image" />,
}));

jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);
jest.mock("@/app/components/Loading", () => ({
	Loading: () => (
		<div data-testid="loading-skeleton" className="bg-gray-200">
			Loading...
		</div>
	),
}));
jest.mock("@/app/components/Error", () => ({
	Error: ({ message }: { message: string }) => (
		<div data-testid="error-message">
			<h2>Error</h2>
			<p>{message}</p>
		</div>
	),
}));

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
	const mockFetchResourceById = jest.fn();

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

		// Reset all mocks
		mockFetchResourceById.mockReset();
		mockFetchResourceById.mockResolvedValue(mockResource);

		// Mock useParams
		(useParams as jest.Mock).mockReturnValue({
			id: "resource1",
		});

		// Mock useRouter
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			back: mockBack,
		});

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockReturnValue({
			isAuthenticated: true,
		});

		// Mock useSavedStore
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedResources: ["resource1"],
			addResource: mockAddResource,
			removeResource: mockRemoveResource,
			fetchSavedResources: jest.fn().mockResolvedValue(undefined),
		});

		// Mock useHealthStore
		(useHealthStore as unknown as jest.Mock).mockReturnValue({
			fetchResourceById: mockFetchResourceById,
		});

		// Mock useResourceHistoryStore
		(useResourceHistoryStore as unknown as jest.Mock).mockReturnValue({
			addToHistory: mockAddToHistory,
		});
	});

	it("renders the resource detail page with loading state initially", async () => {
		// Mock a delayed response
		mockFetchResourceById.mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve(mockResource), 100))
		);

		render(<ResourceDetailPage />);

		// Check for loading state immediately
		expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();

		// Wait for the delayed response to complete
		await waitFor(() => {
			expect(screen.queryByTestId("loading-skeleton")).not.toBeInTheDocument();
		});
	});

	it("renders resource details after loading", async () => {
		render(<ResourceDetailPage />);

		// Wait for the resource to load and component to update
		await waitFor(() => {
			expect(screen.getByText("Diabetes Management")).toBeInTheDocument();
			expect(screen.getByText("Back to Resources")).toBeInTheDocument();
			expect(screen.getByText("Saved")).toBeInTheDocument();
			expect(screen.getByRole("article")).toBeInTheDocument();
		});

		// Check that addToHistory was called
		expect(mockAddToHistory).toHaveBeenCalledWith({
			id: "resource1",
			title: "Diabetes Management",
			description: "<p>Tips for managing diabetes</p>",
			imageUrl: "/image1.jpg",
			sourceUrl: "",
		});
	});

	it("handles resource not found error", async () => {
		// Store the original console.error
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock API to return null (resource not found)
		mockFetchResourceById.mockResolvedValue(null);

		render(<ResourceDetailPage />);

		// Wait for error state
		await waitFor(() => {
			expect(screen.getByTestId("error-message")).toBeInTheDocument();
			expect(screen.getByText("Resource not found")).toBeInTheDocument();
		});

		// Restore console.error after test
		console.error = originalConsoleError;
	});

	it("handles API fetch error", async () => {
		// Store the original console.error
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock API to throw an error
		mockFetchResourceById.mockRejectedValue(new Error("API error"));

		render(<ResourceDetailPage />);

		// Wait for error state
		await waitFor(() => {
			expect(screen.getByTestId("error-message")).toBeInTheDocument();
			expect(screen.getByText("Failed to load resource")).toBeInTheDocument();
		});

		// Restore console.error after test
		console.error = originalConsoleError;
	});

	it("allows unsaving a saved resource", async () => {
		render(<ResourceDetailPage />);

		// Wait for the component to load and find the save button
		const saveButton = await waitFor(() => screen.getByText("Saved"));

		// Click the save button
		fireEvent.click(saveButton);

		// Check that removeResource was called with the correct ID
		expect(mockRemoveResource).toHaveBeenCalledWith("resource1");

		// Wait for success message
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith("Resource removed from saved items");
		});
	});

	it("allows saving an unsaved resource", async () => {
		// Mock the resource as not saved
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedResources: [], // Empty array means resource1 is not saved
			addResource: mockAddResource,
			removeResource: mockRemoveResource,
			fetchSavedResources: jest.fn().mockResolvedValue(undefined),
		});

		render(<ResourceDetailPage />);

		// Wait for the component to load and find the save button
		const saveButton = await waitFor(() => screen.getByText("Save"));

		// Click the save button
		fireEvent.click(saveButton);

		// Check that addResource was called with the correct ID and resource data
		expect(mockAddResource).toHaveBeenCalledWith("resource1", expect.any(Object));

		// Wait for success message
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith("Resource saved successfully");
		});
	});

	it("shows a login prompt when trying to save while not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockReturnValue({
			isAuthenticated: false,
		});

		// Mock the resource as not saved
		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedResources: [], // Empty array means resource1 is not saved
			addResource: mockAddResource,
			removeResource: mockRemoveResource,
			fetchSavedResources: jest.fn().mockResolvedValue(undefined),
		});

		render(<ResourceDetailPage />);

		// Wait for the component to load and find the save button
		const saveButton = await waitFor(() => screen.getByText("Save"));

		// Click the save button
		fireEvent.click(saveButton);

		// Check that toast.error was called
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Please log in to save resources");
		});
	});

	it("navigates back when clicking the back button", async () => {
		render(<ResourceDetailPage />);

		// Wait for the component to load and find the back button
		const backButton = await waitFor(() => screen.getByText("Back to Resources"));

		// Click the back button
		fireEvent.click(backButton);

		// Check that router.back was called
		expect(mockBack).toHaveBeenCalled();
	});
});

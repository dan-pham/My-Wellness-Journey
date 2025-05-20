import { act } from "@testing-library/react";
import { useHealthStore } from "@/stores/healthStore";
import * as myhealthfinder from "@/lib/api/myhealthfinder";

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock the myhealthfinder API
jest.mock("@/lib/api/myhealthfinder", () => ({
	fetchHealthData: jest.fn(),
}));

describe("healthStore", () => {
	// Reset all mocks and store state before each test
	beforeEach(() => {
		jest.clearAllMocks();

		// Reset the store to initial state
		act(() => {
			const store = useHealthStore.getState();
			store.tips = [];
			store.tipsLoading = false;
			store.tipsError = null;
			store.resources = [];
			store.resourcesLoading = false;
			store.resourcesError = null;
		});
	});

	describe("fetchTips", () => {
		it("should fetch tips successfully", async () => {
			// Mock response data
			const mockTips = [
				{
					title: "Test Tip 1",
					url: "https://example.com/tip1",
					snippet: "This is a test tip",
				},
				{
					title: "Test Tip 2",
					url: "https://example.com/tip2",
					snippet: "This is another test tip",
				},
			];

			// Setup the mock fetch response
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ results: mockTips }),
			});

			// Call the fetchTips method
			await act(async () => {
				await useHealthStore.getState().fetchTips("diabetes");
			});

			// Verify loading state was properly set during fetch
			expect(mockFetch).toHaveBeenCalledWith("/api/medlineplus?query=diabetes&maxResults=10");

			// Verify final state
			const { tips, tipsLoading, tipsError } = useHealthStore.getState();
			expect(tips).toEqual(mockTips);
			expect(tipsLoading).toBe(false);
			expect(tipsError).toBeNull();
		});

		it("should set loading state during fetch", async () => {
			// Setup mock to resolve after delay
			mockFetch.mockImplementation(() => {
				return new Promise((resolve) => {
					// Capture loading state at this point
					const { tipsLoading } = useHealthStore.getState();
					expect(tipsLoading).toBe(true);

					resolve({
						ok: true,
						json: () => Promise.resolve({ results: [] }),
					});
				});
			});

			// Call the fetchTips method
			const fetchPromise = useHealthStore.getState().fetchTips("diabetes");

			// Immediately verify loading state is true
			expect(useHealthStore.getState().tipsLoading).toBe(true);

			// Wait for the fetch to complete
			await act(async () => {
				await fetchPromise;
			});

			// Verify loading state is reset
			expect(useHealthStore.getState().tipsLoading).toBe(false);
		});

		it("should handle API errors properly", async () => {
			// Mock API error response
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			// Call the fetchTips method
			await act(async () => {
				await useHealthStore.getState().fetchTips("diabetes");
			});

			// Verify error state
			const { tips, tipsLoading, tipsError } = useHealthStore.getState();
			expect(tips).toEqual([]);
			expect(tipsLoading).toBe(false);
			expect(tipsError).toBe("Failed to fetch health tips");
		});

		it("should handle network errors properly", async () => {
			// Mock network error
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			// Call the fetchTips method
			await act(async () => {
				await useHealthStore.getState().fetchTips("diabetes");
			});

			// Verify error state
			const { tips, tipsLoading, tipsError } = useHealthStore.getState();
			expect(tips).toEqual([]);
			expect(tipsLoading).toBe(false);
			expect(tipsError).toBe("Failed to fetch health tips");
		});

		it("should use custom maxResults when provided", async () => {
			// Setup the mock fetch response
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ results: [] }),
			});

			// Call fetchTips with custom maxResults
			await act(async () => {
				await useHealthStore.getState().fetchTips("diabetes", 5);
			});

			// Verify the API was called with the correct parameters
			expect(mockFetch).toHaveBeenCalledWith("/api/medlineplus?query=diabetes&maxResults=5");
		});
	});

	describe("fetchResources", () => {
		it("should fetch resources successfully", async () => {
			// Mock response data
			const mockResources = [
				{
					id: "123",
					title: "Test Resource 1",
					content: "Resource content 1",
					conditions: ["diabetes"],
					sourceUrl: "https://example.com/resource1",
					source: "health.gov",
				},
				{
					id: "456",
					title: "Test Resource 2",
					content: "Resource content 2",
					conditions: ["diabetes"],
					sourceUrl: "https://example.com/resource2",
					source: "health.gov",
				},
			];

			// Setup the myhealthfinder mock
			(myhealthfinder.fetchHealthData as jest.Mock).mockResolvedValueOnce({
				success: true,
				healthData: mockResources,
			});

			// Call the fetchResources method
			await act(async () => {
				await useHealthStore.getState().fetchResources("diabetes");
			});

			// Verify the API was called correctly
			expect(myhealthfinder.fetchHealthData).toHaveBeenCalledWith("diabetes", 10);

			// Verify final state
			const { resources, resourcesLoading, resourcesError } = useHealthStore.getState();
			expect(resources).toEqual(mockResources);
			expect(resourcesLoading).toBe(false);
			expect(resourcesError).toBeNull();
		});

		it("should set loading state during fetch", async () => {
			// Setup mock to resolve after delay
			(myhealthfinder.fetchHealthData as jest.Mock).mockImplementation(() => {
				return new Promise((resolve) => {
					// Capture loading state at this point
					const { resourcesLoading } = useHealthStore.getState();
					expect(resourcesLoading).toBe(true);

					resolve({
						success: true,
						healthData: [],
					});
				});
			});

			// Call the fetchResources method
			const fetchPromise = useHealthStore.getState().fetchResources("diabetes");

			// Immediately verify loading state is true
			expect(useHealthStore.getState().resourcesLoading).toBe(true);

			// Wait for the fetch to complete
			await act(async () => {
				await fetchPromise;
			});

			// Verify loading state is reset
			expect(useHealthStore.getState().resourcesLoading).toBe(false);
		});

		it("should handle API errors properly", async () => {
			// Mock API error
			(myhealthfinder.fetchHealthData as jest.Mock).mockRejectedValueOnce(new Error("API error"));

			// Call the fetchResources method
			await act(async () => {
				await useHealthStore.getState().fetchResources("diabetes");
			});

			// Verify error state
			const { resources, resourcesLoading, resourcesError } = useHealthStore.getState();
			expect(resources).toEqual([]);
			expect(resourcesLoading).toBe(false);
			expect(resourcesError).toBe("Failed to fetch resources");
		});

		it("should use custom count when provided", async () => {
			// Setup the mock response
			(myhealthfinder.fetchHealthData as jest.Mock).mockResolvedValueOnce({
				success: true,
				healthData: [],
			});

			// Call fetchResources with custom count
			await act(async () => {
				await useHealthStore.getState().fetchResources("diabetes", 5);
			});

			// Verify the API was called with the correct parameters
			expect(myhealthfinder.fetchHealthData).toHaveBeenCalledWith("diabetes", 5);
		});
	});

	describe("store initial state", () => {
		it("should have correct initial state", () => {
			const state = useHealthStore.getState();

			// Verify tips slice
			expect(state.tips).toEqual([]);
			expect(state.tipsLoading).toBe(false);
			expect(state.tipsError).toBeNull();

			// Verify resources slice
			expect(state.resources).toEqual([]);
			expect(state.resourcesLoading).toBe(false);
			expect(state.resourcesError).toBeNull();
		});
	});
});

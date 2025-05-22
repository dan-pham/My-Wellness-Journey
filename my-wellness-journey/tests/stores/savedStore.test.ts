import { act } from "@testing-library/react";
import { useSavedStore } from "@/stores/savedStore";
import { useAuthStore } from "@/stores/authStore";
import * as authFetch from "@/lib/auth/authFetch";
import { Tip } from "@/types/tip";
import { Resource } from "@/types/resource";

// Suppress console.error globally for these tests
const originalConsoleError = console.error;
beforeAll(() => {
	console.error = jest.fn();
});

afterAll(() => {
	console.error = originalConsoleError;
});

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
	useAuthStore: {
		getState: jest.fn().mockReturnValue({
			isAuthenticated: true,
		}),
	},
}));

describe("savedStore", () => {
	// Sample data for tests
	const sampleTip: Tip = {
		id: "tip1",
		task: "Test Task",
		reason: "Test Reason",
		sourceUrl: "https://example.com/tip",
		dateGenerated: new Date().toISOString(),
		tag: ["test"]
	};

	const sampleResource: Resource = {
		id: "resource1",
		title: "Test Resource",
		description: "This is a test resource",
		imageUrl: "https://example.com/image.jpg",
		sourceUrl: "https://example.com/resource",
	};

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();

		// Reset the store state
		act(() => {
			const store = useSavedStore.getState();
			store.savedTips = [];
			store.savedTipsData = [];
			store.savedResources = [];
			store.savedResourcesData = [];
			store.loading = false;
			store.error = null;
		});
	});

	describe("initial state", () => {
		it("should have the correct initial state", () => {
			const state = useSavedStore.getState();

			expect(state.savedTips).toEqual([]);
			expect(state.savedTipsData).toEqual([]);
			expect(state.savedResources).toEqual([]);
			expect(state.savedResourcesData).toEqual([]);
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
		});
	});

	describe("fetchSavedTips", () => {
		it("should fetch saved tips successfully", async () => {
			// Mock API response
			const mockTipsResponse = {
				savedTips: [
					{
						id: "tip1",
						task: "Test Task 1",
						reason: "Test Reason 1",
						sourceUrl: "https://example.com/tip1"
					},
					{
						id: "tip2",
						task: "Test Task 2",
						reason: "Test Reason 2",
						sourceUrl: "https://example.com/tip2"
					}
				],
			};

			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockTipsResponse),
			});

			// Call fetchSavedTips
			await act(async () => {
				await useSavedStore.getState().fetchSavedTips();
			});

			// Verify API was called correctly
			expect(authFetch.fetchWithAuth).toHaveBeenCalledWith("/api/user/saved-tips");

			// Verify state was updated correctly
			const { savedTips, savedTipsData, loading, error } = useSavedStore.getState();
			expect(savedTips).toEqual(["tip1", "tip2"]);
			expect(savedTipsData).toHaveLength(2);
			expect(savedTipsData[0].id).toBe("tip1");
			expect(savedTipsData[1].id).toBe("tip2");
			expect(loading).toBe(false);
			expect(error).toBeNull();
		});

		it("should not fetch tips if user is not authenticated", async () => {
			// Mock unauthenticated state
			(useAuthStore.getState as jest.Mock).mockReturnValueOnce({
				isAuthenticated: false,
			});

			// Call fetchSavedTips
			await act(async () => {
				await useSavedStore.getState().fetchSavedTips();
			});

			// Verify API was not called
			expect(authFetch.fetchWithAuth).not.toHaveBeenCalled();
		});

		it("should handle API errors when fetching tips", async () => {
			// Mock API error
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: jest.fn().mockResolvedValue({ error: "Server error" }),
			});

			// Call fetchSavedTips
			await act(async () => {
				await useSavedStore.getState().fetchSavedTips();
			});

			// Verify error state - now is null for better UX for new users
			const { savedTips, loading, error } = useSavedStore.getState();
			expect(savedTips).toEqual([]);
			expect(loading).toBe(false);
			expect(error).toBeNull();
		});
	});

	describe("fetchSavedResources", () => {
		it("should fetch saved resources successfully", async () => {
			// Mock API response
			const mockResourcesResponse = {
				savedResources: [{ id: "resource1" }, { id: "resource2" }],
			};

			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue(mockResourcesResponse),
			});

			// Call fetchSavedResources
			await act(async () => {
				await useSavedStore.getState().fetchSavedResources();
			});

			// Verify API was called correctly
			expect(authFetch.fetchWithAuth).toHaveBeenCalledWith("/api/user/saved-resources");

			// Verify state was updated correctly
			const { savedResources, savedResourcesData, loading, error } = useSavedStore.getState();
			expect(savedResources).toEqual(["resource1", "resource2"]);
			expect(savedResourcesData).toHaveLength(2);
			expect(savedResourcesData[0].id).toBe("resource1");
			expect(savedResourcesData[1].id).toBe("resource2");
			expect(loading).toBe(false);
			expect(error).toBeNull();
		});

		it("should not fetch resources if user is not authenticated", async () => {
			// Mock unauthenticated state
			(useAuthStore.getState as jest.Mock).mockReturnValueOnce({
				isAuthenticated: false,
			});

			// Call fetchSavedResources
			await act(async () => {
				await useSavedStore.getState().fetchSavedResources();
			});

			// Verify API was not called
			expect(authFetch.fetchWithAuth).not.toHaveBeenCalled();
		});

		it("should handle API errors when fetching resources", async () => {
			// Mock API error
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: jest.fn().mockResolvedValue({ error: "Server error" }),
			});

			// Call fetchSavedResources
			await act(async () => {
				await useSavedStore.getState().fetchSavedResources();
			});

			// Verify error state - now is null for better UX for new users
			const { savedResources, loading, error } = useSavedStore.getState();
			expect(savedResources).toEqual([]);
			expect(loading).toBe(false);
			expect(error).toBeNull();
		});
	});

	describe("addTip", () => {
		it("should add a tip successfully", async () => {
			// Mock API success
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({ success: true }),
			});

			// Add tip
			await act(async () => {
				await useSavedStore.getState().addTip(sampleTip.id, sampleTip);
			});

			// Verify state update
			const { savedTips, savedTipsData } = useSavedStore.getState();
			expect(savedTips).toContain(sampleTip.id);
			expect(savedTipsData).toHaveLength(1);
			expect(savedTipsData[0]).toEqual(sampleTip);

			// Verify API call
			expect(authFetch.fetchWithAuth).toHaveBeenCalledWith(
				"/api/user/saved-tips",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ tipId: sampleTip.id }),
				})
			);
		});

		it("should not add a duplicate tip", async () => {
			// Set up state with tip already saved
			act(() => {
				useSavedStore.setState({
					savedTips: [sampleTip.id],
					savedTipsData: [sampleTip],
				});
			});

			// Try to add the same tip again
			await act(async () => {
				await useSavedStore.getState().addTip(sampleTip.id, sampleTip);
			});

			// Verify API was not called
			expect(authFetch.fetchWithAuth).not.toHaveBeenCalled();

			// Verify state remains unchanged
			const { savedTips, savedTipsData } = useSavedStore.getState();
			expect(savedTips).toEqual([sampleTip.id]);
			expect(savedTipsData).toEqual([sampleTip]);
		});

		it("should handle API error when adding a tip", async () => {
			// Mock API error - simulate a network error instead of a failed response
			(authFetch.fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

			// Add tip
			await act(async () => {
				await useSavedStore.getState().addTip(sampleTip.id, sampleTip);
			});

			// Verify state is reverted
			const { savedTips, savedTipsData } = useSavedStore.getState();
			expect(savedTips).toEqual([]);
			expect(savedTipsData).toEqual([]);

			// Verify error was logged but suppressed in test
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe("removeTip", () => {
		it("should remove a tip successfully", async () => {
			// Set up state with saved tip
			act(() => {
				useSavedStore.setState({
					savedTips: [sampleTip.id],
					savedTipsData: [sampleTip],
				});
			});

			// Mock API success
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({ success: true }),
			});

			// Remove tip
			await act(async () => {
				await useSavedStore.getState().removeTip(sampleTip.id);
			});

			// Verify state update
			const { savedTips, savedTipsData } = useSavedStore.getState();
			expect(savedTips).toEqual([]);
			expect(savedTipsData).toEqual([]);

			// Verify API call
			expect(authFetch.fetchWithAuth).toHaveBeenCalledWith(
				`/api/user/saved-tips?tipId=${sampleTip.id}`,
				expect.objectContaining({
					method: "DELETE",
				})
			);
		});

		it("should do nothing if tip is not in saved list", async () => {
			const toast = require("react-hot-toast");

			// Remove non-existent tip
			await act(async () => {
				await useSavedStore.getState().removeTip("non-existent-id");
			});

			// Verify API was not called
			expect(authFetch.fetchWithAuth).not.toHaveBeenCalled();

			// Verify error toast was shown
			expect(toast.error).toHaveBeenCalledWith("Tip not found in your saved tips");
		});

		it("should handle API error when removing a tip", async () => {
			// Set up state with saved tip
			act(() => {
				useSavedStore.setState({
					savedTips: [sampleTip.id],
					savedTipsData: [sampleTip],
				});
			});

			// Mock API error
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: false,
				json: jest.fn().mockResolvedValue({ error: "Failed to remove" }),
			});

			// Remove tip
			await act(async () => {
				await useSavedStore.getState().removeTip(sampleTip.id);
			});

			// Verify state is reverted
			const { savedTips, savedTipsData } = useSavedStore.getState();
			expect(savedTips).toEqual([sampleTip.id]);
			expect(savedTipsData).toEqual([sampleTip]);
		});
	});

	describe("addResource", () => {
		it("should add a resource successfully", async () => {
			// Mock API success
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({ success: true }),
			});

			// Add resource
			await act(async () => {
				await useSavedStore.getState().addResource(sampleResource.id, sampleResource);
			});

			// Verify state update
			const { savedResources, savedResourcesData } = useSavedStore.getState();
			expect(savedResources).toContain(sampleResource.id);
			expect(savedResourcesData).toHaveLength(1);
			expect(savedResourcesData[0]).toEqual(sampleResource);

			// Verify API call
			expect(authFetch.fetchWithAuth).toHaveBeenCalledWith(
				"/api/user/saved-resources",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ resourceId: sampleResource.id }),
				})
			);
		});

		it("should not add a duplicate resource", async () => {
			// Set up state with resource already saved
			act(() => {
				useSavedStore.setState({
					savedResources: [sampleResource.id],
					savedResourcesData: [sampleResource],
				});
			});

			// Try to add the same resource again
			await act(async () => {
				await useSavedStore.getState().addResource(sampleResource.id, sampleResource);
			});

			// Verify API was not called
			expect(authFetch.fetchWithAuth).not.toHaveBeenCalled();
		});

		it("should handle API error when adding a resource", async () => {
			// Mock API error - simulate a network error
			(authFetch.fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

			// Add resource
			await act(async () => {
				await useSavedStore.getState().addResource(sampleResource.id, sampleResource);
			});

			// Verify state is reverted
			const { savedResources, savedResourcesData } = useSavedStore.getState();
			expect(savedResources).toEqual([]);
			expect(savedResourcesData).toEqual([]);

			// Verify error was logged
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe("removeResource", () => {
		it("should remove a resource successfully", async () => {
			// Set up state with saved resource
			act(() => {
				useSavedStore.setState({
					savedResources: [sampleResource.id],
					savedResourcesData: [sampleResource],
				});
			});

			// Mock API success
			(authFetch.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({ success: true }),
			});

			// Remove resource
			await act(async () => {
				await useSavedStore.getState().removeResource(sampleResource.id);
			});

			// Verify state update
			const { savedResources, savedResourcesData } = useSavedStore.getState();
			expect(savedResources).toEqual([]);
			expect(savedResourcesData).toEqual([]);

			// Verify API call
			expect(authFetch.fetchWithAuth).toHaveBeenCalledWith(
				`/api/user/saved-resources?resourceId=${sampleResource.id}`,
				expect.objectContaining({
					method: "DELETE",
				})
			);
		});

		it("should do nothing if resource is not in saved list", async () => {
			const toast = require("react-hot-toast");

			// Remove non-existent resource
			await act(async () => {
				await useSavedStore.getState().removeResource("non-existent-id");
			});

			// Verify API was not called
			expect(authFetch.fetchWithAuth).not.toHaveBeenCalled();

			// Verify error toast was shown
			expect(toast.error).toHaveBeenCalledWith("Resource not found in your saved resources");
		});

		it("should handle API error when removing a resource", async () => {
			// Set up state with saved resource
			act(() => {
				useSavedStore.setState({
					savedResources: [sampleResource.id],
					savedResourcesData: [sampleResource],
				});
			});

			// Mock API error
			(authFetch.fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

			// Remove resource
			await act(async () => {
				await useSavedStore.getState().removeResource(sampleResource.id);
			});

			// Verify state is reverted
			const { savedResources, savedResourcesData } = useSavedStore.getState();
			expect(savedResources).toEqual([sampleResource.id]);
			expect(savedResourcesData).toEqual([sampleResource]);

			// Verify error was logged
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe("persistence", () => {
		it("should persist the correct data in the store", () => {
			// Set up our test data
			const state = {
				savedTips: ["tip1"],
				savedTipsData: [sampleTip],
				savedResources: ["resource1"],
				savedResourcesData: [sampleResource],
				loading: true,
				error: "Some error",
			};

			// Update the store state
			act(() => {
				// We need to use setState which is available in the test environment
				useSavedStore.setState(state);
			});

			// Verify the store state was updated
			const currentState = useSavedStore.getState();
			expect(currentState.savedTips).toEqual(["tip1"]);
			expect(currentState.savedTipsData).toEqual([sampleTip]);
			expect(currentState.savedResources).toEqual(["resource1"]);
			expect(currentState.savedResourcesData).toEqual([sampleResource]);
			expect(currentState.loading).toBe(true);
			expect(currentState.error).toBe("Some error");

			// Reset the state
			act(() => {
				useSavedStore.setState({
					savedTips: [],
					savedTipsData: [],
					savedResources: [],
					savedResourcesData: [],
					loading: false,
					error: null,
				});
			});

			// Verify reset was successful
			const resetState = useSavedStore.getState();
			expect(resetState.savedTips).toEqual([]);
			expect(resetState.savedTipsData).toEqual([]);
			expect(resetState.savedResources).toEqual([]);
			expect(resetState.savedResourcesData).toEqual([]);

			// Verify we can still add items to the store after resetting
			act(() => {
				useSavedStore.getState().addTip(sampleTip.id, sampleTip);
			});

			const updatedState = useSavedStore.getState();
			expect(updatedState.savedTips).toContain(sampleTip.id);
			expect(updatedState.savedTipsData[0]).toEqual(sampleTip);
		});
	});
});

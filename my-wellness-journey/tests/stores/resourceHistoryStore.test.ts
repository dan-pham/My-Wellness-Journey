import { act } from "@testing-library/react";
import { useResourceHistoryStore, ResourceHistoryItem } from "@/stores/resourceHistoryStore";
import { useAuthStore } from "@/stores/authStore";
import { User } from "@/types/user";

describe("resourceHistoryStore", () => {
	// Save original Date implementation
	const originalDate = global.Date;
	let mockDate: Date;

	// Mock user for testing
	const testUser: User = {
		id: "test-user-id",
		email: "test@example.com",
		firstName: "Test",
		lastName: "User",
	};

	beforeEach(() => {
		// Clear localStorage first
		localStorage.clear();

		// Reset stores and auth state
		act(() => {
			useAuthStore.getState().logout();
			useResourceHistoryStore.cleanup();
			useAuthStore.getState().login(testUser);
		});

		// Mock Date
		mockDate = new Date("2023-04-15T12:00:00Z");
		global.Date = class extends Date {
			constructor() {
				super();
				return mockDate;
			}

			static now() {
				return mockDate.getTime();
			}
		} as DateConstructor;
	});

	afterEach(() => {
		// Cleanup after each test
		act(() => {
			useAuthStore.getState().logout();
			useResourceHistoryStore.cleanup();
		});
		localStorage.clear();
	});

	afterAll(() => {
		global.Date = originalDate;
		useAuthStore.getState().logout();
	});

	describe("initial state", () => {
		it("should have an empty history array", () => {
			const history = useResourceHistoryStore.getState().history;
			expect(history).toEqual([]);
		});
	});

	describe("addToHistory", () => {
		it("should add a resource to history with timestamp", () => {
			const resource = {
				id: "123",
				title: "Test Resource",
				description: "This is a test resource",
				imageUrl: "https://example.com/image.jpg",
				sourceUrl: "https://example.com/resource",
			};

			act(() => {
				useResourceHistoryStore.getState().addToHistory(resource);
			});

			const history = useResourceHistoryStore.getState().history;

			expect(history).toHaveLength(1);
			expect(history[0]).toEqual({
				...resource,
				viewedAt: mockDate.toISOString(),
			});
		});

		it("should add new items at the beginning of the history", () => {
			// Mock two different dates
			const date1 = new Date("2023-04-15T10:00:00Z");
			const date2 = new Date("2023-04-15T11:00:00Z");

			// Add first resource
			mockDate = date1;
			const resource1 = {
				id: "123",
				title: "First Resource",
				description: "This is the first resource",
				imageUrl: "https://example.com/image1.jpg",
				sourceUrl: "https://example.com/resource1",
			};

			act(() => {
				useResourceHistoryStore.getState().addToHistory(resource1);
			});

			// Add second resource with a different date
			mockDate = date2;
			const resource2 = {
				id: "456",
				title: "Second Resource",
				description: "This is the second resource",
				imageUrl: "https://example.com/image2.jpg",
				sourceUrl: "https://example.com/resource2",
			};

			act(() => {
				useResourceHistoryStore.getState().addToHistory(resource2);
			});

			const history = useResourceHistoryStore.getState().history;

			expect(history).toHaveLength(2);
			// Second resource should be first in the array
			expect(history[0].id).toBe("456");
			expect(history[0].viewedAt).toBe(date2.toISOString());
			// First resource should be second in the array
			expect(history[1].id).toBe("123");
			expect(history[1].viewedAt).toBe(date1.toISOString());
		});

		it("should remove duplicates and move the resource to the top", () => {
			// Add first resource
			const resource1 = {
				id: "123",
				title: "Test Resource",
				description: "This is a test resource",
				imageUrl: "https://example.com/image.jpg",
				sourceUrl: "https://example.com/resource",
			};

			// Add second resource
			const resource2 = {
				id: "456",
				title: "Another Resource",
				description: "This is another resource",
				imageUrl: "https://example.com/image2.jpg",
				sourceUrl: "https://example.com/resource2",
			};

			act(() => {
				useResourceHistoryStore.getState().addToHistory(resource1);
				useResourceHistoryStore.getState().addToHistory(resource2);
			});

			// Verify we have 2 items
			expect(useResourceHistoryStore.getState().history).toHaveLength(2);

			// Set a new timestamp for the duplicate
			mockDate = new Date("2023-04-15T14:00:00Z");

			// Add the first resource again (should move to top with new timestamp)
			act(() => {
				useResourceHistoryStore.getState().addToHistory({
					...resource1,
					title: "Updated Title", // Update a property to verify it's replaced
				});
			});

			const history = useResourceHistoryStore.getState().history;

			// Verify still only 2 items
			expect(history).toHaveLength(2);
			// First resource should be at the top with updated title
			expect(history[0].id).toBe("123");
			expect(history[0].title).toBe("Updated Title");
			expect(history[0].viewedAt).toBe(mockDate.toISOString());
			// Second resource should now be second in the list
			expect(history[1].id).toBe("456");
		});

		it("should limit history to 10 items", () => {
			// Create 11 resources
			const resources = Array.from({ length: 11 }, (_, i) => ({
				id: `${i + 1}`,
				title: `Resource ${i + 1}`,
				description: `Description for resource ${i + 1}`,
				imageUrl: `https://example.com/image${i + 1}.jpg`,
				sourceUrl: `https://example.com/resource${i + 1}`,
			}));

			// Add all resources to history
			act(() => {
				resources.forEach((resource) => {
					mockDate = new Date(mockDate.getTime() + 1000); // Increment date for each resource
					useResourceHistoryStore.getState().addToHistory(resource);
				});
			});

			const history = useResourceHistoryStore.getState().history;

			// Should only keep the 10 most recent items
			expect(history).toHaveLength(10);

			// The first resource should be dropped
			const historyIds = history.map((item) => item.id);
			expect(historyIds).not.toContain("1");

			// The most recent resource should be first
			expect(history[0].id).toBe("11");
		});

		it("should not add to history when user is not logged in", () => {
			// Logout user
			act(() => {
				useAuthStore.getState().logout();
			});

			const resource = {
				id: "123",
				title: "Test Resource",
				description: "This is a test resource",
				imageUrl: "https://example.com/image.jpg",
				sourceUrl: "https://example.com/resource",
			};

			act(() => {
				useResourceHistoryStore.getState().addToHistory(resource);
			});

			const history = useResourceHistoryStore.getState().history;
			expect(history).toHaveLength(0);
		});
	});

	describe("clearHistory", () => {
		it("should remove all items from history", () => {
			// Add some resources
			const resources = [
				{
					id: "123",
					title: "Resource 1",
					description: "Description 1",
					imageUrl: "https://example.com/image1.jpg",
					sourceUrl: "https://example.com/resource1",
				},
				{
					id: "456",
					title: "Resource 2",
					description: "Description 2",
					imageUrl: "https://example.com/image2.jpg",
					sourceUrl: "https://example.com/resource2",
				},
			];

			act(() => {
				resources.forEach((resource) => {
					useResourceHistoryStore.getState().addToHistory(resource);
				});
			});

			// Verify resources are in history
			expect(useResourceHistoryStore.getState().history).toHaveLength(2);

			// Clear history
			act(() => {
				useResourceHistoryStore.getState().clearHistory();
			});

			// Verify history is empty
			expect(useResourceHistoryStore.getState().history).toHaveLength(0);
			expect(useResourceHistoryStore.getState().history).toEqual([]);
		});
	});

	describe("persistence", () => {
		it("should use the correct persistence name with user ID", () => {
			// Access the persist object to check configuration
			const persistOptions = useResourceHistoryStore.persist.getOptions();
			expect(persistOptions.name).toBe(`${testUser.id}-resource-history`);
		});
	});

	describe("user-specific history", () => {
		it("should not persist history between different users", async () => {
			const user1: User = {
				id: "user1",
				email: "user1@test.com",
				firstName: "User",
				lastName: "One",
			};

			const user2: User = {
				id: "user2",
				email: "user2@test.com",
				firstName: "User",
				lastName: "Two",
			};

			const testResource = {
				id: "123",
				title: "Test Resource",
				description: "This is a test resource",
				imageUrl: "https://example.com/image.jpg",
				sourceUrl: "https://example.com/resource",
			};

			// User 1 scenario
			act(() => {
				useAuthStore.getState().login(user1);
				useResourceHistoryStore.getState().addToHistory(testResource);
			});

			// Verify User 1's history
			expect(useResourceHistoryStore.getState().history).toHaveLength(1);

			// Switch to User 2
			act(() => {
				useAuthStore.getState().logout();
				useAuthStore.getState().login(user2);
			});

			// Verify User 2's history is empty
			expect(useResourceHistoryStore.getState().history).toHaveLength(0);
		});

		it("should clear history on logout", () => {
			const testResource = {
				id: "123",
				title: "Test Resource",
				description: "This is a test resource",
				imageUrl: "https://example.com/image.jpg",
				sourceUrl: "https://example.com/resource",
			};

			// Add resource while logged in
			act(() => {
				useResourceHistoryStore.getState().addToHistory(testResource);
			});

			// Verify resource was added
			expect(useResourceHistoryStore.getState().history).toHaveLength(1);

			// Logout
			act(() => {
				useAuthStore.getState().logout();
			});

			// Verify history is empty for anonymous user
			expect(useResourceHistoryStore.getState().history).toHaveLength(0);
		});

		it("should handle token expiration and new account creation", () => {
			// Initial user with some history
			const originalUser: User = {
				id: "original-user",
				email: "original@test.com",
				firstName: "Original",
				lastName: "User",
			};

			const testResource = {
				id: "123",
				title: "Test Resource",
				description: "This is a test resource",
				imageUrl: "https://example.com/image.jpg",
				sourceUrl: "https://example.com/resource",
				viewedAt: new Date().toISOString(),
			};

			// Login and add resource to history
			act(() => {
				useAuthStore.getState().login(originalUser);
				useResourceHistoryStore.getState().addToHistory(testResource);
			});

			// Verify resource was added
			expect(useResourceHistoryStore.getState().history).toHaveLength(1);

			// Store the key for later
			const originalHistoryKey = `${originalUser.id}-resource-history`;
            
			// Simulate token expiration by logging out
			act(() => {
				useAuthStore.getState().logout();
			});

			// Verify history is cleared after logout
			expect(useResourceHistoryStore.getState().history).toHaveLength(0);

			// Manually add history data to localStorage after logout
			// This simulates a user whose token expired but their data still exists
			const historyData = {
				state: {
					state: {
						history: [testResource],
					},
					version: 0,
				},
				timestamp: Date.now(),
			};
			localStorage.setItem(originalHistoryKey, JSON.stringify(historyData));

			// Create new account
			const newUser: User = {
				id: "new-user",
				email: "new@test.com",
				firstName: "New",
				lastName: "User",
			};

			// Login with new account
			act(() => {
				useAuthStore.getState().login(newUser);
			});

			// Verify new account starts with empty history
			expect(useResourceHistoryStore.getState().history).toHaveLength(0);

			// But the old history data still exists in localStorage
			const oldHistoryData = localStorage.getItem(originalHistoryKey);
			expect(oldHistoryData).not.toBeNull();
			expect(JSON.parse(oldHistoryData!).state.state.history).toHaveLength(1);
		});
	});
});

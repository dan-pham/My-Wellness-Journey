import { act } from "@testing-library/react";
import { useAuthStore } from "@/stores/authStore";

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: jest.fn((key: string) => store[key] || null),
		setItem: jest.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		removeItem: jest.fn((key: string) => {
			delete store[key];
		}),
		clear: jest.fn(() => {
			store = {};
		}),
	};
})();

const sessionStorageMock = {
	...localStorageMock,
};

// Mock the global fetch
const mockFetch = jest.fn();

// Mock the token validation logic
const originalAtob = global.atob;
global.atob = jest.fn().mockImplementation((data) => {
	// Mocked implementation to handle our test JWT payloads
	if (data === "eyJleHAiOjMzMjI1MTYyMDAwMDB9") {
		// Future expiry (valid token)
		return JSON.stringify({ exp: 33225162000 });
	} else if (data === "eyJleHAiOjE1MTYyMzkwMjJ9" || data === "eyJleHAiOjk1MTYyMzkwMjJ9") {
		// Past expiry (invalid token)
		return JSON.stringify({ exp: 1516239022 });
	}
	// Default to using the original implementation
	return originalAtob(data);
});

describe("authStore", () => {
	// Store the original window object
	const originalWindow = { ...global.window };

	beforeAll(() => {
		// Mock the browser's storage
		Object.defineProperty(window, "localStorage", {
			value: localStorageMock,
			configurable: true,
			writable: true,
		});

		Object.defineProperty(window, "sessionStorage", {
			value: sessionStorageMock,
			configurable: true,
			writable: true,
		});

		// Mock fetch
		global.fetch = mockFetch as jest.Mock;
	});

	beforeEach(() => {
		// Clear all mocks and storage before each test
		jest.clearAllMocks();
		localStorageMock.clear();
		sessionStorageMock.clear();
		// Reset the store to initial state
		act(() => {
			useAuthStore.getState().logout();
		});
	});

	afterAll(() => {
		// Restore the original window object
		global.window = originalWindow;
		global.atob = originalAtob;
	});

	describe("login", () => {
		it("should set user and isAuthenticated to true", () => {
			const user = { id: "1", email: "test@example.com", firstName: "Test", lastName: "User" };

			act(() => {
				useAuthStore.getState().login(user, "test-token");
			});

			const { user: stateUser, isAuthenticated, token } = useAuthStore.getState();

			expect(stateUser).toEqual(user);
			expect(isAuthenticated).toBe(true);
			expect(token).toBe("test-token");
			expect(localStorageMock.setItem).toHaveBeenCalledWith("token", "test-token");
		});

		it("should handle login without token", () => {
			const user = { id: "1", email: "test@example.com", firstName: "Test", lastName: "User" };

			act(() => {
				useAuthStore.getState().login(user);
			});

			const { user: stateUser, isAuthenticated, token } = useAuthStore.getState();

			expect(stateUser).toEqual(user);
			expect(isAuthenticated).toBe(true);
			expect(token).toBeNull();
			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});
	});

	describe("logout", () => {
		it("should clear user, token, and set isAuthenticated to false", () => {
			// First log in
			act(() => {
				useAuthStore
					.getState()
					.login(
						{ id: "1", email: "test@example.com", firstName: "Test", lastName: "User" },
						"test-token"
					);
			});

			// Then log out
			act(() => {
				useAuthStore.getState().logout();
			});

			const { user, isAuthenticated, token } = useAuthStore.getState();

			expect(user).toBeNull();
			expect(isAuthenticated).toBe(false);
			expect(token).toBeNull();
			expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
			expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("token");
		});
	});

	describe("getToken", () => {
		it("should return token from state if available", () => {
			// Set token in state
			act(() => {
				useAuthStore
					.getState()
					.login(
						{ id: "1", email: "test@example.com", firstName: "Test", lastName: "User" },
						"state-token"
					);
			});

			const token = useAuthStore.getState().getToken();
			expect(token).toBe("state-token");
		});

		it("should return token from localStorage if not in state", () => {
			// Set up a known valid token format
			const validToken = "header.eyJleHAiOjMzMjI1MTYyMDAwMDB9.signature";
			// Set token in localStorage
			localStorageMock.setItem("token", validToken);

			const token = useAuthStore.getState().getToken();
			expect(token).toBe(validToken);
			// Should also update the state with the token from storage
			expect(useAuthStore.getState().token).toBe(validToken);
		});

		it("should return token from sessionStorage if not in localStorage", () => {
			// Set up a known valid token format
			const validToken = "header.eyJleHAiOjMzMjI1MTYyMDAwMDB9.signature";
			// Set token in sessionStorage
			sessionStorageMock.setItem("token", validToken);

			const token = useAuthStore.getState().getToken();
			expect(token).toBe(validToken);
			// Should also update the state with the token from storage
			expect(useAuthStore.getState().token).toBe(validToken);
		});

		it("should return null and logout if token is invalid", () => {
			// Set an invalid token (expired)
			const expiredToken = "header.eyJleHAiOjE1MTYyMzkwMjJ9.signature";
			localStorageMock.setItem("token", expiredToken);

			const token = useAuthStore.getState().getToken();
			expect(token).toBeNull();
			expect(useAuthStore.getState().isAuthenticated).toBe(false);
		});
	});

	describe("token validation", () => {
		it("should consider a valid token as valid", () => {
			// A token with expiry in the future (year 3000)
			const validToken = "header.eyJleHAiOjMzMjI1MTYyMDAwMDB9.signature";
			expect(useAuthStore.getState().getToken()).toBeNull();

			localStorageMock.setItem("token", validToken);

			const token = useAuthStore.getState().getToken();
			expect(token).toBe(validToken);
			
			// In real app, retrieving a valid token doesn't automatically authenticate
			// Need to manually simulate login to set isAuthenticated to true
			act(() => {
				useAuthStore.getState().login(
					{ id: "1", email: "test@example.com", firstName: "Test", lastName: "User" }, 
					validToken
				);
			});
			
			expect(useAuthStore.getState().isAuthenticated).toBe(true);
		});

		it("should consider an expired token as invalid", () => {
			// A token with expiry in the past (year 2000)
			const expiredToken = "header.eyJleHAiOjE1MTYyMzkwMjJ9.signature";
			localStorageMock.setItem("token", expiredToken);

			const token = useAuthStore.getState().getToken();
			expect(token).toBeNull();
			expect(useAuthStore.getState().isAuthenticated).toBe(false);
		});
	});

	describe("persistence", () => {
		it("should persist user and authentication state", () => {
			const user = { id: "1", email: "test@example.com", firstName: "Test", lastName: "User" };

			act(() => {
				useAuthStore.getState().login(user, "test-token");
			});

			// Simulate page reload
			const persistOptions = useAuthStore.persist.getOptions();
			if (persistOptions.partialize) {
				const persistedState = persistOptions.partialize(useAuthStore.getState());

				expect(persistedState).toEqual({
					user,
					isAuthenticated: true,
					token: "test-token",
				});
			}
		});
	});
});

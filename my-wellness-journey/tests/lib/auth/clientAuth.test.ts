/**
 * @jest-environment jsdom
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

// Mock fetch
global.fetch = jest.fn();

// Mock the auth store
jest.mock("@/stores/authStore", () => ({
	useAuthStore: {
		getState: jest.fn().mockReturnValue({
			getToken: jest.fn(),
			logout: jest.fn(),
		}),
	},
}));

import { checkAuthStatus } from "@/lib/auth/clientAuth";
import { useAuthStore } from "@/stores/authStore";

describe("clientAuth", () => {
	// Reset all mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
		(fetch as jest.Mock).mockReset();
	});

	describe("checkAuthStatus", () => {
		it("should return unauthenticated status when no token is available", async () => {
			// Configure the mock to return null for getToken
			(useAuthStore.getState().getToken as jest.Mock).mockReturnValue(null);

			const result = await checkAuthStatus();

			// Should not make a fetch call
			expect(fetch).not.toHaveBeenCalled();

			// Should return unauthenticated
			expect(result).toEqual({
				isAuthenticated: false,
				user: null,
			});
		});

		it("should return authenticated status when token is valid", async () => {
			const mockToken = "mock-token";
			const mockUser = { id: "123", email: "user@example.com", name: "Test User" };

			// Configure the mock to return a token
			(useAuthStore.getState().getToken as jest.Mock).mockReturnValue(mockToken);

			// Mock successful response
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce({
					isAuthenticated: true,
					user: mockUser,
				}),
			});

			const result = await checkAuthStatus();

			// Should make a fetch call with the token
			expect(fetch).toHaveBeenCalledWith("/api/auth/check", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockToken}`,
				},
			});

			// Should return authenticated with user
			expect(result).toEqual({
				isAuthenticated: true,
				user: mockUser,
			});
		});

		it("should return unauthenticated status when API returns error", async () => {
			const mockToken = "mock-token";

			// Configure the mock to return a token
			(useAuthStore.getState().getToken as jest.Mock).mockReturnValue(mockToken);

			// Mock failed response
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const result = await checkAuthStatus();

			// Should make a fetch call with the token
			expect(fetch).toHaveBeenCalledWith("/api/auth/check", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockToken}`,
				},
			});

			// Should return unauthenticated
			expect(result).toEqual({
				isAuthenticated: false,
				user: null,
			});
		});

		it("should handle network errors gracefully", async () => {
			const mockToken = "mock-token";

			// Configure the mock to return a token
			(useAuthStore.getState().getToken as jest.Mock).mockReturnValue(mockToken);

			// Mock network error
			(fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			const result = await checkAuthStatus();

			// Should make a fetch call with the token
			expect(fetch).toHaveBeenCalledWith("/api/auth/check", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockToken}`,
				},
			});

			// Should log the error
			expect(console.error).toHaveBeenCalled();

			// Should return unauthenticated
			expect(result).toEqual({
				isAuthenticated: false,
				user: null,
			});

			// Restore console.error
			console.error = originalConsoleError;
		});

		it("should handle malformed API responses", async () => {
			const mockToken = "mock-token";

			// Configure the mock to return a token
			(useAuthStore.getState().getToken as jest.Mock).mockReturnValue(mockToken);

			// Mock response with missing data
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce({}),
			});

			const result = await checkAuthStatus();

			// Should make a fetch call with the token
			expect(fetch).toHaveBeenCalledWith("/api/auth/check", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockToken}`,
				},
			});

			// Should handle missing data gracefully and return the undefined values
			expect(result).toEqual({
				isAuthenticated: undefined,
				user: undefined,
			});
		});
	});
});

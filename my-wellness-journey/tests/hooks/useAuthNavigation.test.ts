"use client";

import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useAuthNavigation } from "@/app/hooks/useAuthNavigation";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

// Mock the auth store
jest.mock("@/stores/authStore", () => {
	return {
		useAuthStore: jest.fn(() => ({
			logout: jest.fn(),
		})),
		__esModule: true,
	};
});

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useAuthNavigation", () => {
	const mockPush = jest.fn();
	const mockLogout = jest.fn();
	const mockGetToken = jest.fn().mockReturnValue("test-token");

	// Mock console.error
	const originalConsoleError = console.error;

	beforeEach(() => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		mockFetch.mockClear();

		// Mock console.error
		console.error = jest.fn();

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			logout: mockLogout,
		}));

		// Mock useAuthStore.getState
		(useAuthStore as any).getState = jest.fn().mockReturnValue({
			getToken: mockGetToken,
		});
	});

	afterAll(() => {
		// Restore console.error
		console.error = originalConsoleError;
	});

	describe("navigateToLogin", () => {
		it("should navigate to login page", () => {
			const { result } = renderHook(() => useAuthNavigation());

			act(() => {
				result.current.navigateToLogin();
			});

			expect(mockPush).toHaveBeenCalledWith("/login");
		});
	});

	describe("handleSignOut", () => {
		it("should handle successful sign out", async () => {
			// Mock successful API response
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({}),
			});

			const { result } = renderHook(() => useAuthNavigation());

			await act(async () => {
				await result.current.handleSignOut();
			});

			// Verify API was called with correct parameters
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/auth/logout",
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer test-token",
					},
				})
			);

			// Verify store was updated
			expect(mockLogout).toHaveBeenCalled();

			// Verify success message was shown
			expect(toast.success).toHaveBeenCalledWith("Successfully logged out");

			// Verify navigation
			expect(mockPush).toHaveBeenCalledWith("/");
		});

		it("should handle API error during sign out", async () => {
			// Mock failed API response
			mockFetch.mockRejectedValueOnce(new Error("API Error"));

			const { result } = renderHook(() => useAuthNavigation());

			await act(async () => {
				await result.current.handleSignOut();
			});

			// Verify API was called
			expect(mockFetch).toHaveBeenCalled();

			// Verify error was logged
			expect(console.error).toHaveBeenCalledWith("Logout error:", expect.any(Error));

			// Verify error message was shown
			expect(toast.error).toHaveBeenCalledWith("Error during logout process");

			// Verify store was still updated (fail-safe)
			expect(mockLogout).toHaveBeenCalled();

			// Verify navigation still occurred
			expect(mockPush).toHaveBeenCalledWith("/");
		});

		it("should handle non-OK API response", async () => {
			// Mock non-OK API response
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: () => Promise.resolve({ message: "Server error" }),
			});

			const { result } = renderHook(() => useAuthNavigation());

			await act(async () => {
				await result.current.handleSignOut();
			});

			// Verify API was called
			expect(mockFetch).toHaveBeenCalled();

			// Verify error was logged
			expect(console.error).toHaveBeenCalledWith("Logout error:", expect.any(Error));

			// Verify error message was shown
			expect(toast.error).toHaveBeenCalledWith("Error during logout process");

			// Verify store was still updated (fail-safe)
			expect(mockLogout).toHaveBeenCalled();

			// Verify navigation still occurred
			expect(mockPush).toHaveBeenCalledWith("/");
		});
	});
});

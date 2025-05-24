import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AuthProvider from "@/app/components/AuthProvider";
import { useAuthStore } from "@/stores/authStore";

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(),
}));

// Mock the Loading component
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock the useAuthStore hook
jest.mock("@/stores/authStore");

// Cast the mocked store to any to avoid TypeScript errors
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<any>;

// Mock the router
const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
	push: mockPush,
});

describe("AuthProvider Component", () => {
	// Reset mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the mock implementation with default values
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: false,
			loading: false,
			user: null,
			error: null,
			token: null,
			login: jest.fn(),
			logout: jest.fn(),
			setError: jest.fn(),
			setLoading: jest.fn(),
			getToken: jest.fn(),
		});
	});

	const TestComponent = ({
		requireAuth = false,
		redirectTo = "/login",
	}: {
		requireAuth?: boolean;
		redirectTo?: string;
	}) => (
		<AuthProvider requireAuth={requireAuth} redirectTo={redirectTo}>
			<div data-testid="protected-content">Protected Content</div>
		</AuthProvider>
	);

	it("renders children when not requiring authentication", () => {
		render(<TestComponent requireAuth={false} />);
		expect(screen.getByTestId("protected-content")).toBeInTheDocument();
	});

	it("shows loading spinner while checking authentication", () => {
		// Set loading to true
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: false,
			loading: true,
		});

		render(<TestComponent requireAuth={true} />);
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
	});

	it("redirects to login when authentication is required but user is not authenticated", () => {
		// User is not authenticated and not loading
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: false,
			loading: false,
		});

		render(<TestComponent requireAuth={true} redirectTo="/custom-login" />);
		expect(mockPush).toHaveBeenCalledWith("/custom-login");
		expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
	});

	it("renders children when authentication is required and user is authenticated", () => {
		// User is authenticated
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: true,
			loading: false,
		});

		render(<TestComponent requireAuth={true} />);
		expect(screen.getByTestId("protected-content")).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("does not redirect when authentication is not required", () => {
		render(<TestComponent requireAuth={false} />);
		expect(mockPush).not.toHaveBeenCalled();
		expect(screen.getByTestId("protected-content")).toBeInTheDocument();
	});

	it("handles the case when auth store is still loading", () => {
		// Auth store is loading
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: false,
			loading: true,
		});

		render(<TestComponent requireAuth={true} />);
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("updates when auth state changes", () => {
		// First render with unauthenticated user
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: false,
			loading: false,
		});

		const { rerender } = render(<TestComponent requireAuth={true} />);
		expect(mockPush).toHaveBeenCalledWith("/login");

		// Update state to authenticated
		mockPush.mockClear();
		mockedUseAuthStore.mockReturnValue({
			isAuthenticated: true,
			loading: false,
		});

		// Re-render with updated state
		rerender(<TestComponent requireAuth={true} />);
		expect(screen.getByTestId("protected-content")).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});
});

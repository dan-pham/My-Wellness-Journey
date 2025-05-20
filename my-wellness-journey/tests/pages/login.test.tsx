"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/AuthLayout", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="auth-layout">{children}</div>
	),
}));

jest.mock("@/app/components/Button", () => ({
	__esModule: true,
	default: ({
		children,
		onClick,
		disabled,
		type,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		type?: string;
	}) => (
		<button
			onClick={onClick}
			disabled={disabled}
			data-testid={type === "submit" ? "login-button" : undefined}
		>
			{children}
		</button>
	),
}));

describe("Login Page", () => {
	const mockPush = jest.fn();
	const mockLogin = jest.fn();

	// Mock storage
	const localStorageMock = {
		getItem: jest.fn(),
		setItem: jest.fn(),
		removeItem: jest.fn(),
		clear: jest.fn(),
	};

	const sessionStorageMock = {
		getItem: jest.fn(),
		setItem: jest.fn(),
		removeItem: jest.fn(),
		clear: jest.fn(),
	};

	beforeEach(() => {
		// Reset all mocks before each test
		jest.clearAllMocks();

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			login: mockLogin,
		}));

		// Mock global fetch
		global.fetch = jest.fn();

		// Mock window objects
		Object.defineProperty(window, "localStorage", {
			value: localStorageMock,
			writable: true,
		});

		Object.defineProperty(window, "sessionStorage", {
			value: sessionStorageMock,
			writable: true,
		});
	});

	const fillAndSubmitForm = async (email: string, password: string, rememberMe = false) => {
		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: email },
		});

		fireEvent.change(screen.getByLabelText(/password/i), {
			target: { value: password },
		});

		if (rememberMe) {
			fireEvent.click(screen.getByLabelText(/remember me/i));
		}

		await act(async () => {
			fireEvent.click(screen.getByTestId("login-button"));
		});
	};

	it("renders the login form", () => {
		render(<LoginPage />);

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
		expect(screen.getByTestId("login-button")).toBeInTheDocument();
	});

	it("validates form fields", async () => {
		render(<LoginPage />);

		// Submit empty form
		await act(async () => {
			fireEvent.click(screen.getByTestId("login-button"));
		});

		// Check for error messages
		expect(screen.getByText("Email is required")).toBeInTheDocument();
		expect(screen.getByText("Password is required")).toBeInTheDocument();

		// Test invalid email
		await act(async () => {
			fireEvent.change(screen.getByLabelText(/email/i), {
				target: { value: "invalid-email" },
			});

			// Clear password error by typing something
			fireEvent.change(screen.getByLabelText(/password/i), {
				target: { value: "password123" },
			});
		});

		await act(async () => {
			fireEvent.click(screen.getByTestId("login-button"));
		});

		expect(screen.getByText("Invalid email format")).toBeInTheDocument();
		expect(screen.queryByText("Password is required")).not.toBeInTheDocument();
	});

	it("handles successful login", async () => {
		const mockResponse = {
			token: "test-token",
			user: { id: "1", email: "test@example.com" },
		};

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		render(<LoginPage />);

		await fillAndSubmitForm("test@example.com", "password123", true);

		// Check that fetch was called with correct data
		expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: "test@example.com",
				password: "password123",
			}),
		});

		// Check that login was called with user data
		expect(mockLogin).toHaveBeenCalledWith(mockResponse.user, mockResponse.token);

		// Check that token was stored in localStorage (remember me checked)
		expect(localStorageMock.setItem).toHaveBeenCalledWith("token", mockResponse.token);

		// Check for success toast
		expect(toast.success).toHaveBeenCalledWith("Login successful!");

		// Check for navigation
		expect(mockPush).toHaveBeenCalledWith("/dashboard");
	});

	it("handles login error", async () => {
		const errorMessage = "Invalid credentials";

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve({ error: errorMessage }),
		});

		render(<LoginPage />);

		await fillAndSubmitForm("test@example.com", "wrongpassword");

		// Check that error message is displayed
		expect(screen.getByText(errorMessage)).toBeInTheDocument();

		// Check that no navigation occurred
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("stores token in sessionStorage when remember me is not checked", async () => {
		const mockResponse = {
			token: "test-token",
			user: { id: "1", email: "test@example.com" },
		};

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		render(<LoginPage />);

		// Don't check "remember me"
		await fillAndSubmitForm("test@example.com", "password123", false);

		// Check that token was stored in sessionStorage
		expect(sessionStorageMock.setItem).toHaveBeenCalledWith("token", mockResponse.token);
		expect(localStorageMock.setItem).not.toHaveBeenCalled();
	});
});

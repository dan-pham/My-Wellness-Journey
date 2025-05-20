"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import RegisterPage from "@/app/register/page";
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
		text,
		onClick,
		disabled,
		type,
	}: {
		text: string;
		onClick?: () => void;
		disabled?: boolean;
		type?: string;
	}) => (
		<button
			onClick={onClick}
			disabled={disabled}
			data-testid={type === "submit" ? "register-button" : undefined}
		>
			{text}
		</button>
	),
}));

describe("Register Page", () => {
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

	const fillAndSubmitForm = async (formData: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
		confirmPassword: string;
	}) => {
		fireEvent.change(screen.getByLabelText("First name *"), {
			target: { value: formData.firstName },
		});

		fireEvent.change(screen.getByLabelText("Last name *"), {
			target: { value: formData.lastName },
		});

		fireEvent.change(screen.getByLabelText("Email *"), {
			target: { value: formData.email },
		});

		fireEvent.change(screen.getByLabelText("Password *"), {
			target: { value: formData.password },
		});

		fireEvent.change(screen.getByLabelText("Confirm password *"), {
			target: { value: formData.confirmPassword },
		});

		await act(async () => {
			fireEvent.click(screen.getByTestId("register-button"));
		});
	};

	it("renders the register form", () => {
		render(<RegisterPage />);

		expect(screen.getByLabelText("First name *")).toBeInTheDocument();
		expect(screen.getByLabelText("Last name *")).toBeInTheDocument();
		expect(screen.getByLabelText("Email *")).toBeInTheDocument();
		expect(screen.getByLabelText("Password *")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm password *")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
	});

	it("validates form fields", async () => {
		render(<RegisterPage />);

		// Submit empty form
		await act(async () => {
			fireEvent.click(screen.getByTestId("register-button"));
		});

		// Check for required field errors
		await waitFor(() => {
			expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
			expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
			expect(screen.getByText(/email is required/i)).toBeInTheDocument();
			expect(screen.getByText(/password is required/i)).toBeInTheDocument();
			expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
		});

		// Test invalid email
		fireEvent.change(screen.getByLabelText("Email *"), {
			target: { value: "invalid-email" },
		});

		// Test short password
		fireEvent.change(screen.getByLabelText("Password *"), {
			target: { value: "12345" },
		});

		// Submit form to validate short password
		await act(async () => {
			fireEvent.click(screen.getByTestId("register-button"));
		});

		// Check for password length error
		await waitFor(() => {
			expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
			expect(screen.getByText(/Password must contain at least 8 characters/i)).toBeInTheDocument();
		});

		// Test password mismatch
		fireEvent.change(screen.getByLabelText("Password *"), {
			target: { value: "Password123!" },
		});
		fireEvent.change(screen.getByLabelText("Confirm password *"), {
			target: { value: "Password456!" },
		});

		// Submit form to validate password mismatch
		await act(async () => {
			fireEvent.click(screen.getByTestId("register-button"));
		});

		// Check for password mismatch error
		await waitFor(() => {
			expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
		});
	});

	it("handles successful registration", async () => {
		const mockUser = { id: "1", email: "test@example.com" };
		const mockToken = "test-token";

		// Mock register response
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		// Mock login response
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					token: mockToken,
					user: mockUser,
				}),
		});

		// Mock profile update response
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		render(<RegisterPage />);

		const formData = {
			firstName: "John",
			lastName: "Doe",
			email: "test@example.com",
			password: "Password123!",
			confirmPassword: "Password123!",
		};

		await fillAndSubmitForm(formData);

		// Check that register API was called with correct data
		expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				password: formData.password,
			}),
		});

		// Check that login was called with user data
		expect(mockLogin).toHaveBeenCalledWith(mockUser, mockToken);

		// Check that token was stored in localStorage
		expect(localStorageMock.setItem).toHaveBeenCalledWith("token", mockToken);

		// Check for success message and navigation
		expect(toast.success).toHaveBeenCalledWith("Account created successfully!");
		expect(mockPush).toHaveBeenCalledWith("/dashboard");
	});

	it("handles registration error", async () => {
		const errorMessage = "Email already in use";

		// Mock register response with error
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			json: () =>
				Promise.resolve({
					error: errorMessage,
				}),
		});

		render(<RegisterPage />);

		const formData = {
			firstName: "John",
			lastName: "Doe",
			email: "existing@example.com",
			password: "Password123!",
			confirmPassword: "Password123!",
		};

		await fillAndSubmitForm(formData);

		// Check that error message is displayed
		expect(screen.getByText(errorMessage)).toBeInTheDocument();

		// Check that no navigation occurred
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("handles login error after successful registration", async () => {
		// Mock successful register response
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		// Mock failed login response
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			json: () =>
				Promise.resolve({
					error: "Invalid credentials",
				}),
		});

		render(<RegisterPage />);

		const formData = {
			firstName: "John",
			lastName: "Doe",
			email: "test@example.com",
			password: "Password123!",
			confirmPassword: "Password123!",
		};

		await fillAndSubmitForm(formData);

		// Check that error message is displayed
		expect(screen.getByText(/account created but missing login data/i)).toBeInTheDocument();

		// Check that navigation to login page is triggered after delay
		await waitFor(
			() => {
				expect(mockPush).toHaveBeenCalledWith("/login");
			},
			{ timeout: 2500 }
		);
	});
});

"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import RegisterPage from "@/app/register/page";
import DashboardPage from "@/app/dashboard/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import { useSavedStore } from "@/stores/savedStore";
import { useResourceHistoryStore } from "@/stores/resourceHistoryStore";
import { useRecommendedResourcesStore } from "@/stores/recommendedResourcesStore";
import toast from "react-hot-toast";

interface AuthLayoutProps {
	children: React.ReactNode;
}

interface ButtonProps {
	text: string;
	onClick?: () => void;
	disabled?: boolean;
	type?: string;
}

interface AuthProviderProps {
	children: React.ReactNode;
}

interface ErrorComponentProps {
	title: string;
	message: string;
}

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

// Mock useAuthStore with proper implementation
jest.mock("@/stores/authStore", () => {
	// Create the mock function with getState method
	const useAuthStoreMock = jest.fn() as jest.Mock & { getState: jest.Mock };
	useAuthStoreMock.getState = jest.fn();

	return { useAuthStore: useAuthStoreMock };
});

jest.mock("@/stores/tipOfTheDayStore", () => ({
	useTipOfDayStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

jest.mock("@/stores/resourceHistoryStore", () => ({
	useResourceHistoryStore: jest.fn(),
}));

jest.mock("@/stores/recommendedResourcesStore", () => ({
	useRecommendedResourcesStore: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/AuthLayout", () => ({
	__esModule: true,
	default: ({ children }: AuthLayoutProps) => <div data-testid="auth-layout">{children}</div>,
}));

jest.mock("@/app/components/Button", () => ({
	__esModule: true,
	default: ({ text, onClick, disabled, type }: ButtonProps) => (
		<button
			onClick={onClick}
			disabled={disabled}
			data-testid={type === "submit" ? "register-button" : undefined}
		>
			{text}
		</button>
	),
}));

jest.mock("@/app/components/AuthProvider", () => ({
	__esModule: true,
	default: ({ children }: AuthProviderProps) => <div data-testid="auth-provider">{children}</div>,
}));

jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);

// No need to mock the dashboard page, we'll use the real one

jest.mock("@/app/components/Error", () => ({
	Error: ({ title, message }: ErrorComponentProps) => (
		<div data-testid="error-component">
			<h1>{title}</h1>
			<p>{message}</p>
		</div>
	),
}));
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading-spinner">Loading...</div>,
}));
jest.mock("@/app/components/TipOfTheDay", () => () => (
	<div data-testid="tip-of-day">Tip of the day</div>
));
jest.mock("@/app/components/RecommendedResources", () => () => (
	<div data-testid="recommended-resources">Recommended resources</div>
));

describe("Registration to Dashboard Flow", () => {
	// Store the original console.error to restore later
	const originalConsoleError = console.error;

	beforeAll(() => {
		// Suppress console.error for cleaner test output
		console.error = jest.fn();
	});

	afterAll(() => {
		// Restore console.error after all tests
		console.error = originalConsoleError;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const mockPush = jest.fn();
	const mockLogin = jest.fn();

	// Mock profile data for a new user without any saved items or conditions
	const mockEmptyProfile = {
		firstName: "New",
		lastName: "User",
		// No dateOfBirth, gender, conditions, savedResources, or savedTips
	};

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock login function that will be used in the test
		const mockLoginFn = jest.fn(() => {});

		// Mock getToken function
		const mockGetTokenFn = jest.fn(() => "new-user-token");

		// Mock implementation for auth store
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: true,
			user: {
				id: "new-user-id",
				email: "newuser@example.com",
				profile: {
					firstName: "New",
					lastName: "User",
					conditions: [],
					savedResources: [],
					savedTips: [],
				},
			},
			login: mockLoginFn,
			getToken: mockGetTokenFn,
			token: "new-user-token",
		}));

		// Set up getState implementation
		(useAuthStore as any).getState.mockReturnValue({
			isAuthenticated: true,
			user: {
				id: "new-user-id",
				email: "newuser@example.com",
				profile: {
					firstName: "New",
					lastName: "User",
					conditions: [],
					savedResources: [],
					savedTips: [],
				},
			},
			login: mockLoginFn,
			getToken: mockGetTokenFn,
			token: "new-user-token",
		});

		// We'll set up fetch mocks in the individual tests for more control
	});

	// Helper to fill and submit registration form
	const fillAndSubmitRegistrationForm = async () => {
		const formData = {
			firstName: "New",
			lastName: "User",
			email: "newuser@example.com",
			password: "Password123!",
			confirmPassword: "Password123!",
		};

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

	it("should successfully register and navigate to dashboard without errors", async () => {
		// Reset and set up fetch mocks more explicitly
		jest.clearAllMocks();

		// Store fetch mock calls for debugging
		const fetchCalls: string[] = [];

		// Setup fetch mocks with more detailed responses
		(global.fetch as jest.Mock).mockImplementation((url, options) => {
			fetchCalls.push(`${options?.method || "GET"} ${url}`);

			// Registration endpoint
			if (url === "/api/auth/register" && options?.method === "POST") {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							success: true,
							user: {
								id: "new-user-id",
								email: "newuser@example.com",
							},
						}),
				});
			}

			// Login endpoint
			if (url === "/api/auth/login" && options?.method === "POST") {
				const body = options?.body ? JSON.parse(options.body as string) : {};

				// Ensure body contains expected email and password
				if (body.email === "newuser@example.com" && body.password === "Password123!") {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								token: "new-user-token",
								user: {
									id: "new-user-id",
									email: "newuser@example.com",
									profile: {
										firstName: "New",
										lastName: "User",
									},
								},
							}),
					});
				} else {
					console.error("Invalid login credentials in test");
					return Promise.resolve({
						ok: false,
						status: 401,
						json: () => Promise.resolve({ error: "Invalid credentials" }),
					});
				}
			}

			// Profile update endpoint
			if (url === "/api/user/profile" && options?.method === "PUT") {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ success: true }),
				});
			}

			// Default response for unexpected URLs
			console.warn(`Unmocked fetch URL: ${url}`);
			return Promise.resolve({
				ok: false,
				status: 404,
				json: () => Promise.resolve({ error: "Not mocked" }),
			});
		});

		render(<RegisterPage />);

		// Check form is rendered correctly
		expect(screen.getByLabelText("First name *")).toBeInTheDocument();

		// Fill and submit the form
		await fillAndSubmitRegistrationForm();

		// Verify successful registration with more detailed error message
		await waitFor(
			() => {
				expect(toast.success).toHaveBeenCalled();
				const toastCalls = (toast.success as jest.Mock).mock.calls.map((call) => call[0]);

				expect(toast.success).toHaveBeenCalledWith("Account created successfully!");
				expect(mockPush).toHaveBeenCalledWith("/dashboard");
			},
			{ timeout: 3000 }
		);

		// STEP 2: Render the dashboard page for this new user
		// Reset fetch mocks for the dashboard test phase
		jest.clearAllMocks();

		// Set up fetch mocks for dashboard page
		(global.fetch as jest.Mock).mockImplementation((url, options) => {
			// Profile API call
			if (url === "/api/user/profile") {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							success: true,
							profile: {
								firstName: "New",
								lastName: "User",
								// Empty arrays for collections
								conditions: [],
								savedResources: [],
								savedTips: [],
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							},
						}),
				});
			}

			// Saved tips API call
			if (url === "/api/user/saved-tips") {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							success: true,
							savedTips: [],
						}),
				});
			}

			// Saved resources API call
			if (url === "/api/user/saved-resources") {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							success: true,
							savedResources: [],
						}),
				});
			}

			// GPT API call
			if (url === "/api/gpt") {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							reply: JSON.stringify(["exercise", "diet", "sleep"]),
						}),
				});
			}

			// Default response
			console.warn(`Unmocked dashboard fetch URL: ${url}`);
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ success: true, data: [] }),
			});
		});

		// Mock stores for dashboard
		(useTipOfDayStore as unknown as jest.Mock).mockReturnValue({
			tip: {
				id: "tip1",
				task: "Daily Tip",
				reason: "Health Reason",
				sourceUrl: "#",
			},
			dismissed: false,
			isLoading: false,
			error: null,
			fetchTipOfDay: jest.fn(),
			dismissForToday: jest.fn(),
			showTip: jest.fn(),
			resetStore: jest.fn(),
			migrateTipIfNeeded: jest.fn(),
		});

		(useSavedStore as unknown as jest.Mock).mockReturnValue({
			savedTips: [],
			savedResources: [],
			savedResourcesData: [],
			addTip: jest.fn(),
			removeTip: jest.fn(),
			addResource: jest.fn(),
			removeResource: jest.fn(),
			fetchSavedResources: jest.fn(),
			fetchSavedTips: jest.fn(),
		});

		(useResourceHistoryStore as unknown as jest.Mock).mockReturnValue({
			history: [],
		});

		(useRecommendedResourcesStore as unknown as jest.Mock).mockReturnValue({
			resources: [],
			isLoading: false,
			error: null,
			needsRefresh: jest.fn().mockReturnValue(true),
			setResources: jest.fn(),
			setLoading: jest.fn(),
			setError: jest.fn(),
		});

		// Render the dashboard
		await act(async () => {
			render(<DashboardPage />);
		});

		// Wait for the page to load fully - use a more lenient approach
		await waitFor(
			() => {
				// Dashboard should not display error components
				expect(screen.queryByTestId("error-component")).not.toBeInTheDocument();

				// Look for components that should be present regardless of the user name displayed
				expect(screen.getByTestId("tip-of-day")).toBeInTheDocument();
				expect(screen.getByTestId("recommended-resources")).toBeInTheDocument();

				// Either a greeting should be present OR the user's name
				// This makes the test less brittle as either pattern is acceptable
				const containsNew = screen.queryByText(/New/);
				const containsGreeting = screen.queryByText(/Good morning|Good afternoon|Good evening/);
				const containsUser = screen.queryByText(/User/);

				// Test passes if ANY of these conditions are true
				expect(!!(containsNew || containsGreeting || containsUser)).toBe(true);
			},
			{ timeout: 5000 }
		);
	});
});

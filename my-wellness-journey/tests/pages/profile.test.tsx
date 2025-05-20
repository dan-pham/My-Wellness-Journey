"use client";

import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthNavigation } from "@/app/hooks/useAuthNavigation";
import toast from "react-hot-toast";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/app/hooks/useAuthNavigation", () => ({
	useAuthNavigation: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

// Mock fetchWithAuth
jest.mock("@/lib/auth/authFetch", () => ({
	fetchWithAuth: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);
jest.mock("@/app/components/AuthProvider", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock("@/app/components/Button", () => ({
	__esModule: true,
	default: ({
		text,
		onClick,
		disabled,
	}: {
		text: string;
		onClick?: () => void;
		disabled?: boolean;
	}) => (
		<button
			onClick={onClick}
			disabled={disabled}
			data-testid={`button-${text.toLowerCase().replace(/\s+/g, "-")}`}
		>
			{text}
		</button>
	),
}));

jest.mock("@/app/components/profile/HealthConditionsTab", () => ({
	__esModule: true,
	default: ({ initialConditions, onSave, isSaving }: any) => (
		<div data-testid="health-conditions-tab">
			<h2>Health Conditions Tab</h2>
			<ul>
				{initialConditions.map((condition: any) => (
					<li key={condition.id}>{condition.name}</li>
				))}
			</ul>
			<button
				onClick={() => onSave(["Asthma", "Diabetes"])}
				disabled={isSaving}
				data-testid="save-conditions"
			>
				{isSaving ? "Saving..." : "Save Conditions"}
			</button>
		</div>
	),
}));

jest.mock("@/app/components/profile/PersonalInfoTab", () => ({
	__esModule: true,
	default: ({ initialProfile, onSave, isSaving }: any) => (
		<div data-testid="personal-info-tab">
			<h2>Personal Information Tab</h2>
			<p>First Name: {initialProfile.firstName}</p>
			<p>Last Name: {initialProfile.lastName}</p>
			<button
				onClick={() =>
					onSave({
						firstName: "Jane",
						lastName: "Doe",
						dateOfBirth: initialProfile.dateOfBirth,
						gender: initialProfile.gender,
					})
				}
				disabled={isSaving}
				data-testid="save-personal-info"
			>
				{isSaving ? "Saving..." : "Save Personal Info"}
			</button>
		</div>
	),
}));

jest.mock("@/app/components/profile/AccountTab", () => ({
	__esModule: true,
	default: ({
		userEmail,
		onUpdateEmail,
		onUpdatePassword,
		onSignOut,
		onDeleteAccount,
		isUpdatingEmail,
		isUpdatingPassword,
		isDeletingAccount,
	}: any) => (
		<div data-testid="account-tab">
			<h2>Account Tab</h2>
			<p>Email: {userEmail}</p>
			<button
				onClick={() =>
					onUpdateEmail({
						currentEmail: userEmail,
						newEmail: "new@example.com",
						confirmEmail: "new@example.com",
					})
				}
				disabled={isUpdatingEmail}
				data-testid="update-email"
			>
				{isUpdatingEmail ? "Updating..." : "Update Email"}
			</button>
			<button
				onClick={() =>
					onUpdatePassword({
						currentPassword: "oldpassword",
						newPassword: "newpassword",
						confirmPassword: "newpassword",
					})
				}
				disabled={isUpdatingPassword}
				data-testid="update-password"
			>
				{isUpdatingPassword ? "Updating..." : "Update Password"}
			</button>
			<button onClick={onSignOut} data-testid="sign-out">
				Sign Out
			</button>
			<button
				onClick={() => onDeleteAccount("password123")}
				disabled={isDeletingAccount}
				data-testid="delete-account"
			>
				{isDeletingAccount ? "Deleting..." : "Delete Account"}
			</button>
		</div>
	),
}));

describe("Profile Page", () => {
	const mockPush = jest.fn();
	const mockHandleSignOut = jest.fn();
	const mockFetchWithAuth = require("@/lib/auth/authFetch").fetchWithAuth;

	const mockUser = {
		id: "1",
		email: "test@example.com",
	};

	const mockProfile = {
		firstName: "John",
		lastName: "Doe",
		dateOfBirth: "1990-01-01",
		gender: "male",
		conditions: [
			{ id: "asthma", name: "Asthma" },
			{ id: "hypertension", name: "Hypertension" },
		],
		user: {
			email: "test@example.com",
		},
	};

	// Store original console.error
	const originalConsoleError = console.error;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock console.error
		console.error = jest.fn();

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			user: mockUser,
		}));

		// Mock useAuthNavigation
		(useAuthNavigation as jest.Mock).mockImplementation(() => ({
			handleSignOut: mockHandleSignOut,
		}));

		// Mock fetchWithAuth for profile data
		mockFetchWithAuth.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ profile: mockProfile }),
		});
	});

	afterAll(() => {
		// Restore console.error
		console.error = originalConsoleError;
	});

	it("renders loading state initially", async () => {
		// Create a promise that we can control when it resolves
		let resolveProfileFetch: (value: any) => void;
		const profileFetchPromise = new Promise((resolve) => {
			resolveProfileFetch = resolve;
		});

		// Mock fetchWithAuth to return our controlled promise
		mockFetchWithAuth.mockImplementationOnce(() => profileFetchPromise);

		render(<ProfilePage />);

		// Check that loading spinner is shown
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

		// Now resolve the fetch promise
		await act(async () => {
			resolveProfileFetch!({
				ok: true,
				json: () => Promise.resolve({ profile: mockProfile }),
			});
		});
	});

	it("renders profile data after loading", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		expect(screen.getByText("My Health Profile")).toBeInTheDocument();
		expect(screen.getByTestId("health-conditions-tab")).toBeInTheDocument();
	});

	it("switches between tabs", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Default tab is health conditions
		expect(screen.getByTestId("health-conditions-tab")).toBeInTheDocument();

		// Switch to personal info tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Personal Information" }));
		});
		expect(screen.getByTestId("personal-info-tab")).toBeInTheDocument();

		// Switch to account tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Account" }));
		});
		expect(screen.getByTestId("account-tab")).toBeInTheDocument();

		// Back to health conditions
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Health Conditions" }));
		});
		expect(screen.getByTestId("health-conditions-tab")).toBeInTheDocument();
	});

	it("handles saving health conditions", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Mock successful API response for saving conditions
		mockFetchWithAuth.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					profile: {
						...mockProfile,
						conditions: [
							{ id: "asthma", name: "Asthma" },
							{ id: "diabetes", name: "Diabetes" },
						],
					},
				}),
		});

		// Click save button on health conditions tab
		await act(async () => {
			fireEvent.click(screen.getByTestId("save-conditions"));
		});

		await waitFor(() => {
			expect(mockFetchWithAuth).toHaveBeenCalledWith(
				"/api/user/profile",
				expect.objectContaining({
					method: "PUT",
					body: expect.any(String),
				})
			);

			// Check that the success toast was shown
			expect(toast.success).toHaveBeenCalledWith("Health conditions updated successfully");
		});
	});

	it("handles saving personal information", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Switch to personal info tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Personal Information" }));
		});

		// Mock successful API response for saving profile
		mockFetchWithAuth.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					profile: {
						...mockProfile,
						firstName: "Jane",
						lastName: "Doe",
					},
				}),
		});

		// Click save button on personal info tab
		await act(async () => {
			fireEvent.click(screen.getByTestId("save-personal-info"));
		});

		await waitFor(() => {
			expect(mockFetchWithAuth).toHaveBeenCalledWith(
				"/api/user/profile",
				expect.objectContaining({
					method: "PUT",
					body: expect.any(String),
				})
			);

			// Check that the success toast was shown
			expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
		});
	});

	it("handles updating email", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Switch to account tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Account" }));
		});

		// Mock successful API response for updating email
		mockFetchWithAuth.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		// Click update email button
		await act(async () => {
			fireEvent.click(screen.getByTestId("update-email"));
		});

		await waitFor(() => {
			expect(mockFetchWithAuth).toHaveBeenCalledWith(
				"/api/auth/email",
				expect.objectContaining({
					method: "PUT",
					body: expect.any(String),
				})
			);

			// Check that the success toast was shown
			expect(toast.success).toHaveBeenCalledWith("Email update successful.");
		});
	});

	it("handles updating password", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Switch to account tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Account" }));
		});

		// Mock successful API response for updating password
		mockFetchWithAuth.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		// Click update password button
		await act(async () => {
			fireEvent.click(screen.getByTestId("update-password"));
		});

		await waitFor(() => {
			expect(mockFetchWithAuth).toHaveBeenCalledWith(
				"/api/auth/password",
				expect.objectContaining({
					method: "PUT",
					body: expect.any(String),
				})
			);

			// Check that the success toast was shown
			expect(toast.success).toHaveBeenCalledWith("Password updated successfully");
		});
	});

	it("handles sign out", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Switch to account tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Account" }));
		});

		// Click sign out button
		await act(async () => {
			fireEvent.click(screen.getByTestId("sign-out"));
		});

		// Check that handleSignOut was called
		expect(mockHandleSignOut).toHaveBeenCalled();
	});

	it("handles deleting account", async () => {
		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		// Switch to account tab
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Account" }));
		});

		// Mock successful API response for deleting account
		mockFetchWithAuth.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		// Click delete account button
		await act(async () => {
			fireEvent.click(screen.getByTestId("delete-account"));
		});

		await waitFor(() => {
			expect(mockFetchWithAuth).toHaveBeenCalledWith(
				"/api/user/delete",
				expect.objectContaining({
					method: "DELETE",
					body: expect.any(String),
				})
			);

			// Check that the success toast was shown
			expect(toast.success).toHaveBeenCalledWith("Account deleted successfully");

			// Check that handleSignOut was called
			expect(mockHandleSignOut).toHaveBeenCalled();

			// Check that router.push was called to redirect to home
			expect(mockPush).toHaveBeenCalledWith("/");
		});
	});

	it("handles API errors", async () => {
		// Mock failed API response for profile fetch
		mockFetchWithAuth.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve({ error: "Failed to fetch profile" }),
		});

		await act(async () => {
			render(<ProfilePage />);
		});

		await waitFor(() => {
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
			expect(screen.getByText("Error")).toBeInTheDocument();
			expect(
				screen.getByText("Failed to load profile data. Please try again.")
			).toBeInTheDocument();
		});
	});
});

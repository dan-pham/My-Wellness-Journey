import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountTab from "@/app/components/profile/AccountTab";

// Mock child components with proper act wrapping
jest.mock("@/app/components/profile/EmailUpdateForm", () => {
	return function MockEmailUpdateForm({ currentEmail, onUpdateEmail, isUpdating }: any) {
		return (
			<div data-testid="email-update-form">
				<div>Current Email: {currentEmail}</div>
				<button
					onClick={async () => {
						await onUpdateEmail({
							currentEmail: "old@example.com",
							newEmail: "new@example.com",
							confirmEmail: "new@example.com",
						});
					}}
				>
					Update Email
				</button>
				{isUpdating && <div>Updating email...</div>}
			</div>
		);
	};
});

jest.mock("@/app/components/profile/PasswordUpdateForm", () => {
	return function MockPasswordUpdateForm({ onUpdatePassword, isSaving }: any) {
		return (
			<div data-testid="password-update-form">
				<button
					onClick={async () => {
						await onUpdatePassword({
							currentPassword: "oldpass",
							newPassword: "newpass",
							confirmPassword: "newpass",
						});
					}}
				>
					Update Password
				</button>
				{isSaving && <div>Updating password...</div>}
			</div>
		);
	};
});

jest.mock("@/app/components/profile/DeleteAccountModal", () => {
	return function MockDeleteAccountModal({ isOpen, onClose, onConfirm, isDeleting }: any) {
		if (!isOpen) return null;
		return (
			<div data-testid="delete-account-modal">
				<button onClick={onClose}>Cancel</button>
				<button
					onClick={async () => {
						await onConfirm("password123");
					}}
				>
					Confirm Delete
				</button>
				{isDeleting && <div>Deleting account...</div>}
			</div>
		);
	};
});

describe("AccountTab Component", () => {
	const mockOnUpdateEmail = jest.fn().mockResolvedValue(undefined);
	const mockOnUpdatePassword = jest.fn().mockResolvedValue(undefined);
	const mockOnDeleteAccount = jest.fn().mockResolvedValue(undefined);
	const mockOnSignOut = jest.fn();

	const renderComponent = async (props = {}) => {
		const defaultProps = {
			userEmail: "test@example.com",
			onUpdateEmail: mockOnUpdateEmail,
			onUpdatePassword: mockOnUpdatePassword,
			onDeleteAccount: mockOnDeleteAccount,
			onSignOut: mockOnSignOut,
			isUpdatingEmail: false,
			isUpdatingPassword: false,
			isDeletingAccount: false,
			...props,
		};

		let utils;
		await act(async () => {
			utils = render(<AccountTab {...defaultProps} />);
		});
		return utils!;
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the account tab with email and password forms", async () => {
		await renderComponent();

		expect(screen.getByText("Account")).toBeInTheDocument();
		expect(screen.getByTestId("email-update-form")).toBeInTheDocument();
		expect(screen.getByTestId("password-update-form")).toBeInTheDocument();
		expect(screen.getByText("Log out")).toBeInTheDocument();
		expect(screen.getByText("Delete Account")).toBeInTheDocument();
	});

	it("calls onSignOut when log out button is clicked", async () => {
		await renderComponent();

		const logoutButton = screen.getByText("Log out");
		await act(async () => {
			await userEvent.click(logoutButton);
		});

		expect(mockOnSignOut).toHaveBeenCalledTimes(1);
	});

	it("opens delete account modal when delete button is clicked", async () => {
		await renderComponent();

		const deleteButton = screen.getByText("Delete Account");
		await act(async () => {
			await userEvent.click(deleteButton);
		});

		expect(screen.getByTestId("delete-account-modal")).toBeInTheDocument();
	});

	it("calls onDeleteAccount with password when delete is confirmed", async () => {
		await renderComponent();

		// Open the delete modal
		const deleteButton = screen.getByText("Delete Account");
		await act(async () => {
			await userEvent.click(deleteButton);
		});

		// Click confirm delete
		const confirmButton = screen.getByText("Confirm Delete");
		await act(async () => {
			await userEvent.click(confirmButton);
		});

		expect(mockOnDeleteAccount).toHaveBeenCalledWith("password123");
	});

	it("shows loading state when isDeletingAccount is true", async () => {
		await renderComponent({ isDeletingAccount: true });

		// Open the delete modal
		const deleteButton = screen.getByText("Delete Account");
		await act(async () => {
			await userEvent.click(deleteButton);
		});

		expect(screen.getByText("Deleting account...")).toBeInTheDocument();
	});

	it("passes loading state to email form", async () => {
		await renderComponent({ isUpdatingEmail: true });
		expect(screen.getByText("Updating email...")).toBeInTheDocument();
	});

	it("passes loading state to password form", async () => {
		await renderComponent({ isUpdatingPassword: true });
		expect(screen.getByText("Updating password...")).toBeInTheDocument();
	});

	it("handles email update", async () => {
		await renderComponent();

		const updateEmailButton = screen.getByText("Update Email");
		await act(async () => {
			await userEvent.click(updateEmailButton);
		});

		expect(mockOnUpdateEmail).toHaveBeenCalledWith({
			currentEmail: "old@example.com",
			newEmail: "new@example.com",
			confirmEmail: "new@example.com",
		});
	});

	it("handles password update", async () => {
		await renderComponent();

		const updatePasswordButton = screen.getByText("Update Password");
		await act(async () => {
			await userEvent.click(updatePasswordButton);
		});

		expect(mockOnUpdatePassword).toHaveBeenCalledWith({
			currentPassword: "oldpass",
			newPassword: "newpass",
			confirmPassword: "newpass",
		});
	});
});

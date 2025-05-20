import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteAccountModal from "@/app/components/profile/DeleteAccountModal";

// Mock the Button component
jest.mock("@/app/components/Button", () => {
	return function MockButton({ text, disabled, type, className, onClick }: any) {
		return (
			<button
				type={type}
				disabled={disabled}
				className={className}
				onClick={onClick}
				data-testid="delete-button"
			>
				{text}
			</button>
		);
	};
});

describe("DeleteAccountModal", () => {
	const mockOnClose = jest.fn();
	const mockOnConfirm = jest.fn().mockResolvedValue(undefined);

	const renderComponent = (props = {}) => {
		const defaultProps = {
			isOpen: true,
			onClose: mockOnClose,
			onConfirm: mockOnConfirm,
			isDeleting: false,
			...props,
		};
		return render(<DeleteAccountModal {...defaultProps} />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the modal when isOpen is true", () => {
		renderComponent();
		// Look for the heading specifically
		expect(screen.getByRole("heading", { name: /delete account/i })).toBeInTheDocument();
		expect(
			screen.getByText(
				"This action cannot be undone. All your data will be permanently deleted. Please enter your password to confirm."
			)
		).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
	});

	it("does not render when isOpen is false", () => {
		renderComponent({ isOpen: false });
		expect(screen.queryByText("Delete Account")).not.toBeInTheDocument();
	});

	it("calls onClose when cancel button is clicked", async () => {
		renderComponent();
		const cancelButton = screen.getByText("Cancel");

		await act(async () => {
			await userEvent.click(cancelButton);
		});

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it("calls onConfirm with password when form is submitted", async () => {
		renderComponent();

		const passwordInput = screen.getByLabelText("Password");
		const deleteButton = screen.getByTestId("delete-button");

		await act(async () => {
			await userEvent.type(passwordInput, "mypassword");
			await userEvent.click(deleteButton);
		});

		expect(mockOnConfirm).toHaveBeenCalledWith("mypassword");
	});

	it("toggles password visibility when eye icon is clicked", async () => {
		renderComponent();

		const passwordInput = screen.getByLabelText("Password");
		// Find the toggle button by its aria-label
		const toggleButton = screen.getByRole("button", { name: "Show password" });

		// Password should be hidden by default
		expect(passwordInput).toHaveAttribute("type", "password");

		// Click to show password
		await act(async () => {
			await userEvent.click(toggleButton);
		});
		expect(passwordInput).toHaveAttribute("type", "text");

		// Click to hide password again
		const hideButton = screen.getByRole("button", { name: "Hide password" });
		await act(async () => {
			await userEvent.click(hideButton);
		});
		expect(passwordInput).toHaveAttribute("type", "password");
	});

	it("shows loading state when isDeleting is true", () => {
		renderComponent({ isDeleting: true });
		expect(screen.getByText("Deleting...")).toBeInTheDocument();
		expect(screen.getByTestId("delete-button")).toBeDisabled();
	});

	it("disables the delete button when password is empty", () => {
		renderComponent();
		// Use the mocked button with data-testid
		const deleteButton = screen.getByTestId("delete-button");
		// The button should be disabled initially (empty password)
		expect(deleteButton).toBeDisabled();
	});

	it("enables the delete button when password is not empty", async () => {
		renderComponent();
		const passwordInput = screen.getByLabelText("Password");
		const deleteButton = screen.getByTestId("delete-button");

		await act(async () => {
			await userEvent.type(passwordInput, "mypassword");
		});

		expect(deleteButton).not.toBeDisabled();
	});
});

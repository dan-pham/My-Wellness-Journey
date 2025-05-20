import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordUpdateForm from "@/app/components/profile/PasswordUpdateForm";

describe("PasswordUpdateForm", () => {
	const mockOnUpdatePassword = jest.fn().mockResolvedValue(undefined);

	const renderComponent = (props = {}) => {
		const defaultProps = {
			onUpdatePassword: mockOnUpdatePassword,
			isSaving: false,
			...props,
		};
		return render(<PasswordUpdateForm {...defaultProps} />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the form with all password fields", () => {
		renderComponent();

		expect(screen.getByText("Change Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
		expect(screen.getByLabelText("New Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
	});

	it("toggles password visibility when eye icons are clicked", async () => {
		renderComponent();
		const user = userEvent.setup();

		const currentPasswordInput = screen.getByLabelText("Current Password");
		const newPasswordInput = screen.getByLabelText("New Password");
		const confirmPasswordInput = screen.getByLabelText("Confirm Password");

		const toggleButtons = screen.getAllByRole("button", { name: "" });

		// All passwords should be hidden by default
		expect(currentPasswordInput).toHaveAttribute("type", "password");
		expect(newPasswordInput).toHaveAttribute("type", "password");
		expect(confirmPasswordInput).toHaveAttribute("type", "password");

		// Toggle current password visibility
		await act(async () => {
			await user.click(toggleButtons[0]);
		});
		expect(currentPasswordInput).toHaveAttribute("type", "text");

		// Toggle new password visibility
		await act(async () => {
			await user.click(toggleButtons[1]);
		});
		expect(newPasswordInput).toHaveAttribute("type", "text");

		// Toggle confirm password visibility
		await act(async () => {
			await user.click(toggleButtons[2]);
		});
		expect(confirmPasswordInput).toHaveAttribute("type", "text");
	});

	it("calls onUpdatePassword with form data when submitted", async () => {
		renderComponent();
		const user = userEvent.setup();

		const currentPasswordInput = screen.getByLabelText("Current Password");
		const newPasswordInput = screen.getByLabelText("New Password");
		const confirmPasswordInput = screen.getByLabelText("Confirm Password");
		const submitButton = screen.getByRole("button", { name: /update password/i });

		await act(async () => {
			await user.type(currentPasswordInput, "oldpassword");
			await user.type(newPasswordInput, "newpassword123");
			await user.type(confirmPasswordInput, "newpassword123");
		});
		
		await act(async () => {
			await user.click(submitButton);
		});

		await waitFor(() => {
			expect(mockOnUpdatePassword).toHaveBeenCalledWith({
				currentPassword: "oldpassword",
				newPassword: "newpassword123",
				confirmPassword: "newpassword123",
			});
		});
	});

	it("resets the form after successful submission", async () => {
		renderComponent();
		const user = userEvent.setup();

		const currentPasswordInput = screen.getByLabelText("Current Password");
		const newPasswordInput = screen.getByLabelText("New Password");
		const confirmPasswordInput = screen.getByLabelText("Confirm Password");
		const submitButton = screen.getByRole("button", { name: /update password/i });

		await act(async () => {
			await user.type(currentPasswordInput, "oldpassword");
			await user.type(newPasswordInput, "newpassword123");
			await user.type(confirmPasswordInput, "newpassword123");
		});
		
		// Mock implementation that resolves after a small delay
		mockOnUpdatePassword.mockImplementationOnce(() => 
			new Promise(resolve => setTimeout(resolve, 10))
		);
		
		await act(async () => {
			await user.click(submitButton);
		});
		
		await waitFor(() => {
			expect(currentPasswordInput).toHaveValue("");
			expect(newPasswordInput).toHaveValue("");
			expect(confirmPasswordInput).toHaveValue("");
		});
	});

	it("shows loading state when isSaving is true", () => {
		renderComponent({ isSaving: true });
		expect(screen.getByText("Updating...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /updating.../i })).toBeDisabled();
	});

	it("disables the submit button when any field is empty", async () => {
		renderComponent();
		const user = userEvent.setup();
		
		const submitButton = screen.getByRole("button", { name: /update password/i });

		// All fields empty
		expect(submitButton).not.toBeDisabled();

		// Fill only current password
		await act(async () => {
			await user.type(screen.getByLabelText("Current Password"), "oldpassword");
		});
		expect(submitButton).not.toBeDisabled();

		// Fill new password
		await act(async () => {
			await user.type(screen.getByLabelText("New Password"), "newpassword123");
		});
		expect(submitButton).not.toBeDisabled();

		// Fill confirm password
		await act(async () => {
			await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
		});
		expect(submitButton).not.toBeDisabled();
	});
});

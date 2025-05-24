import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PersonalInfoTab from "@/app/components/profile/PersonalInfoTab";

// Mock the formatDate utility
jest.mock("@/utils/stringUtils", () => ({
	formatDate: (date: string) => date || "",
}));

describe("PersonalInfoTab", () => {
	const mockOnSave = jest.fn().mockResolvedValue(undefined);
	const initialProfile = {
		firstName: "John",
		lastName: "Doe",
		dateOfBirth: "1990-01-01",
		gender: "male",
	};

	const renderComponent = (props = {}) => {
		const defaultProps = {
			initialProfile,
			onSave: mockOnSave,
			isSaving: false,
			...props,
		};
		return render(<PersonalInfoTab {...defaultProps} />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the form with initial profile data", () => {
		renderComponent();

		expect(screen.getByLabelText("First Name")).toHaveValue("John");
		expect(screen.getByLabelText("Last Name")).toHaveValue("Doe");
		expect(screen.getByLabelText("Date of Birth")).toHaveValue("1990-01-01");
		expect(screen.getByLabelText("Gender")).toHaveValue("male");
	});

	it("updates form fields when user types", async () => {
		renderComponent();
		const user = userEvent.setup();

		const firstNameInput = screen.getByLabelText("First Name");
		const lastNameInput = screen.getByLabelText("Last Name");
		const dobInput = screen.getByLabelText("Date of Birth");
		const genderSelect = screen.getByLabelText("Gender");

		await act(async () => {
			await user.clear(firstNameInput);
			await user.type(firstNameInput, "Jane");
		});

		await act(async () => {
			await user.clear(lastNameInput);
			await user.type(lastNameInput, "Smith");
		});

		await act(async () => {
			await user.clear(dobInput);
			await user.type(dobInput, "1995-05-15");
		});

		await act(async () => {
			await user.selectOptions(genderSelect, "female");
		});

		await waitFor(() => {
			expect(firstNameInput).toHaveValue("Jane");
			expect(lastNameInput).toHaveValue("Smith");
			expect(dobInput).toHaveValue("1995-05-15");
			expect(genderSelect).toHaveValue("female");
		});
	});

	it("calls onSave with updated profile data when form is submitted", async () => {
		renderComponent();
		const user = userEvent.setup();

		const firstNameInput = screen.getByLabelText("First Name");

		await act(async () => {
			await user.clear(firstNameInput);
			await user.type(firstNameInput, "Jane");
		});

		const submitButton = screen.getByRole("button", { name: /save changes/i });

		await act(async () => {
			await user.click(submitButton);
		});

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith({
				...initialProfile,
				firstName: "Jane",
			});
		});
	});

	it("shows loading state when isSaving is true", () => {
		renderComponent({ isSaving: true });
		expect(screen.getByText("Saving...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /saving.../i })).toBeDisabled();
	});

	it("updates when initialProfile prop changes", async () => {
		const { rerender } = renderComponent();

		// Initial render with John Doe
		expect(screen.getByLabelText("First Name")).toHaveValue("John");

		// Update props
		const newProfile = { ...initialProfile, firstName: "Alice" };

		await act(async () => {
			rerender(
				<PersonalInfoTab initialProfile={newProfile} onSave={mockOnSave} isSaving={false} />
			);
		});

		// Should update to show Alice
		await waitFor(() => {
			expect(screen.getByLabelText("First Name")).toHaveValue("Alice");
		});
	});
});

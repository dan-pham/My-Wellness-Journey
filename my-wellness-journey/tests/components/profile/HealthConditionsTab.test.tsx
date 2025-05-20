import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HealthConditionsTab from "@/app/components/profile/HealthConditionsTab";
import { FaTimes } from "react-icons/fa";

// Mock the react-icons
jest.mock("react-icons/fa", () => ({
	FaTimes: () => <span data-testid="remove-icon">X</span>,
	FaPlus: () => <span data-testid="add-icon">+</span>,
}));

// Mock the levenshteinDistance utility
jest.mock("@/utils/stringUtils", () => ({
	levenshteinDistance: (a: string, b: string) => {
		// Simple mock implementation for testing
		if (a === b) return 0;
		if (a.includes(b) || b.includes(a)) return Math.abs(a.length - b.length);
		return Math.max(a.length, b.length) / 2;
	},
}));

// Mock the Button component
jest.mock("@/app/components/Button", () => {
	return function MockButton({ text, disabled, onClick }: any) {
		return (
			<button 
				disabled={disabled} 
				onClick={onClick}
				data-testid={text === "Add" ? "add-button" : "save-button"}
			>
				{text}
			</button>
		);
	};
});

describe("HealthConditionsTab", () => {
	const mockOnSave = jest.fn().mockResolvedValue(undefined);
	const initialConditions = [
		{ id: "1", name: "Hypertension" },
		{ id: "2", name: "Type 2 Diabetes" },
	];

	const renderComponent = (props = {}) => {
		const defaultProps = {
			initialConditions,
			onSave: mockOnSave,
			isSaving: false,
			...props,
		};
		return render(<HealthConditionsTab {...defaultProps} />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the component with initial conditions", () => {
		renderComponent();

		// Check that initial conditions are displayed
		expect(screen.getByText("My Conditions")).toBeInTheDocument();
		
		// Find the user's conditions section (first section)
		const sections = screen.getAllByRole('heading');
		const myConditionsSection = sections[0];
		const sectionContainer = myConditionsSection.parentElement;
		
		// Check within this section for the conditions
		expect(within(sectionContainer!).getByText("Hypertension")).toBeInTheDocument();
		expect(within(sectionContainer!).getByText("Type 2 Diabetes")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Add a condition")).toBeInTheDocument();
	});

	it("allows adding a new condition", async () => {
		renderComponent();

		const input = screen.getByPlaceholderText("Add a condition");
		const addButton = screen.getByTestId("add-button");

		await act(async () => {
			await userEvent.type(input, "Asthma");
		});
		
		await act(async () => {
			await userEvent.click(addButton);
		});

		// Find the user's conditions section
		const sections = screen.getAllByRole('heading');
		const myConditionsSection = sections[0];
		const sectionContainer = myConditionsSection.parentElement;
		
		// Check that the condition was added to the user's list
		expect(within(sectionContainer!).getByText("Asthma")).toBeInTheDocument();
	});

	it("shows suggestions when typing", async () => {
		renderComponent();

		const input = screen.getByPlaceholderText("Add a condition");
		
		await act(async () => {
			await userEvent.type(input, "diab");
		});

		// Should show suggestions based on the input
		expect(screen.getByText("Type 2 Diabetes")).toBeInTheDocument();
	});

	it("allows removing a condition", async () => {
		const { container } = renderComponent();

		// Find the user's conditions section (first section)
		const sections = screen.getAllByRole('heading');
		const myConditionsSection = sections[0];
		const sectionContainer = myConditionsSection.parentElement;
		
		// Initially both conditions should be in the user's list
		const userConditionsBefore = within(sectionContainer!).getAllByText(/Hypertension|Type 2 Diabetes/);
		expect(userConditionsBefore.length).toBe(2);
		
		// Find the remove icons (X) next to conditions
		const removeIcons = screen.getAllByTestId("remove-icon");
		
		// Click the first one (Hypertension)
		await act(async () => {
			await userEvent.click(removeIcons[0]);
		});

		// After removal, only one condition should remain in the user's list
		const userConditionsAfter = within(sectionContainer!).getAllByText(/Type 2 Diabetes/);
		expect(userConditionsAfter.length).toBe(1);
		expect(within(sectionContainer!).queryByText("Hypertension")).not.toBeInTheDocument();
		
		// But Hypertension should now appear in the common conditions section
		const commonConditionsSection = sections[1];
		const commonContainer = commonConditionsSection.parentElement;
		expect(within(commonContainer!).getByText("Hypertension")).toBeInTheDocument();
	});

	it("calls onSave with updated conditions when save button is clicked", async () => {
		renderComponent();

		// Add a new condition
		const input = screen.getByPlaceholderText("Add a condition");
		const addButton = screen.getByTestId("add-button");

		await act(async () => {
			await userEvent.type(input, "Asthma");
		});
		
		await act(async () => {
			await userEvent.click(addButton);
		});

		// Click save
		const saveButton = screen.getByTestId("save-button");
		
		await act(async () => {
			await userEvent.click(saveButton);
		});

		// Should call onSave with all conditions
		expect(mockOnSave).toHaveBeenCalledWith(["Hypertension", "Type 2 Diabetes", "Asthma"]);
	});

	it("shows loading state when isSaving is true", () => {
		renderComponent({ isSaving: true });
		expect(screen.getByText("Saving...")).toBeInTheDocument();
		expect(screen.getByTestId("save-button")).toBeDisabled();
	});

	it("updates when initialConditions prop changes", async () => {
		const { rerender } = renderComponent();

		// Find the user's conditions section (first section)
		const sections = screen.getAllByRole('heading');
		const myConditionsSection = sections[0];
		const sectionContainer = myConditionsSection.parentElement;
		
		// Initially both conditions should be in the user's list
		const userConditionsBefore = within(sectionContainer!).getAllByText(/Hypertension|Type 2 Diabetes/);
		expect(userConditionsBefore.length).toBe(2);

		// Update props with new conditions
		const newConditions = [
			{ id: "3", name: "Asthma" },
			{ id: "4", name: "Arthritis" },
		];

		await act(async () => {
			rerender(
				<HealthConditionsTab initialConditions={newConditions} onSave={mockOnSave} isSaving={false} />
			);
		});

		// After rerender, the new conditions should be in the user's list
		const userConditionsAfter = within(sectionContainer!).getAllByText(/Asthma|Arthritis/);
		expect(userConditionsAfter.length).toBe(2);
		
		// And the old conditions should not be in the user's list
		expect(within(sectionContainer!).queryByText("Hypertension")).not.toBeInTheDocument();
		expect(within(sectionContainer!).queryByText("Type 2 Diabetes")).not.toBeInTheDocument();
		
		// But the old conditions should now appear in the common conditions section
		const commonConditionsSection = sections[1];
		const commonContainer = commonConditionsSection.parentElement;
		expect(within(commonContainer!).getByText("Hypertension")).toBeInTheDocument();
		expect(within(commonContainer!).getByText("Type 2 Diabetes")).toBeInTheDocument();
	});
});

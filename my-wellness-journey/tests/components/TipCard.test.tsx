import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TipCard from "@/app/components/TipCard";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => {
	return {
		toast: {
			error: jest.fn(),
			success: jest.fn(),
		},
	};
});

// Mock the auth and saved stores
jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

// Get the mocked functions (needs to be after the jest.mock calls)
const mockedUseAuthStore = jest.mocked(require("@/stores/authStore").useAuthStore);
const mockedUseSavedStore = jest.mocked(require("@/stores/savedStore").useSavedStore);

// Mock Next.js Link component
jest.mock("next/link", () => {
	return ({ children, href, className }: any) => {
		return (
			<a href={href} className={className}>
				{children}
			</a>
		);
	};
});

describe("TipCard Component", () => {
	const mockTip = {
		id: "tip-123",
		task: "Health Tip Task",
		reason: "This is the reason why this health tip is important for your wellness.",
		sourceUrl: "https://example.com/source",
		saved: false,
	};

	const mockOnSaveToggle = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		// Default mocks
		mockedUseSavedStore.mockReturnValue({ savedTips: [] });
		mockedUseAuthStore.mockReturnValue({ isAuthenticated: false });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders tip card with reason", () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);
		
		// Check if the reason text is inside the card
		const reasonText = screen.getByText(mockTip.reason);
		expect(reasonText).toBeInTheDocument();
	});

	it("shows unsaved bookmark icon when not saved", () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const saveButton = screen.getByLabelText("Save tip");
		expect(saveButton).toBeInTheDocument();
	});

	it("shows filled bookmark icon when saved", () => {
		render(<TipCard tip={{ ...mockTip, saved: true }} onSaveToggle={mockOnSaveToggle} />);

		const unsaveButton = screen.getByLabelText("Remove from saved");
		expect(unsaveButton).toBeInTheDocument();
	});

	it("calls onSaveToggle when save button is clicked", () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const saveButton = screen.getByLabelText("Save tip");
		fireEvent.click(saveButton);

		expect(mockOnSaveToggle).toHaveBeenCalledWith(mockTip.id);
	});

	it('has a working "Read Source" link', () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const readSourceLink = screen.getByText("Read Source");
		expect(readSourceLink).toBeInTheDocument();
		expect(readSourceLink).toHaveAttribute("href", `/tips/${mockTip.id}`);
	});
});

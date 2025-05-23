import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TipCard from "@/app/components/TipCard";
import { Tip } from "@/types/tip";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => {
	const mockToast = {
		error: jest.fn(),
		success: jest.fn(),
	};
	return {
		...jest.requireActual("react-hot-toast"),
		toast: mockToast,
	};
});

// Get the mock toast functions
const mockToast = jest.requireMock("react-hot-toast").toast;

// Mock react-icons
jest.mock("react-icons/fa", () => ({
	FaBookmark: () => <div data-testid="filled-bookmark">Filled Bookmark</div>,
	FaRegBookmark: () => <div data-testid="empty-bookmark">Empty Bookmark</div>,
}));

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

describe("TipCard Component", () => {
	const mockTip: Tip = {
		id: "tip-123",
		task: "Health Tip Task",
		reason: "This is the reason why this health tip is important for your wellness.",
		sourceUrl: "https://example.com/source",
		saved: false,
		dateGenerated: new Date().toISOString(),
		tag: ["test"],
	};

	const mockOnSaveToggle = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		// Default mocks
		mockedUseSavedStore.mockReturnValue({ savedTips: [] });
		mockedUseAuthStore.mockReturnValue({ isAuthenticated: true });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders tip card with properly wrapped reason text", () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		// Check if the reason text is inside the card with proper wrapping classes
		const reasonText = screen.getByText(mockTip.reason);
		expect(reasonText).toHaveClass(
			"text-sm",
			"text-primary-subheading",
			"whitespace-normal",
			"break-words"
		);
	});

	it("handles long reason text without truncation", () => {
		const reason = "This is a very long reason text that should not be truncated. ".repeat(10).trim();
		const longTip: Tip = {
			...mockTip,
			reason,
		};
		
		render(<TipCard tip={longTip} onSaveToggle={mockOnSaveToggle} />);
		
		// Use a function to match text content to handle normalization
		const reasonText = screen.getByText((content) => content.includes(reason));
		expect(reasonText).toBeVisible();
		expect(reasonText.textContent?.trim()).toBe(reason);
	});

	it("shows unsaved bookmark icon when not saved", () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const saveButton = screen.getByLabelText("Save tip");
		expect(saveButton).toBeInTheDocument();
		expect(screen.getByTestId("empty-bookmark")).toBeInTheDocument();
	});

	it("shows filled bookmark icon when saved", () => {
		const savedTip: Tip = {
			...mockTip,
			saved: true,
		};
		mockedUseSavedStore.mockReturnValue({ savedTips: [savedTip.id] });

		render(<TipCard tip={savedTip} onSaveToggle={mockOnSaveToggle} />);

		const unsaveButton = screen.getByLabelText("Remove from saved");
		expect(unsaveButton).toBeInTheDocument();
		expect(screen.getByTestId("filled-bookmark")).toBeInTheDocument();
	});

	it("calls onSaveToggle when save button is clicked", async () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const saveButton = screen.getByLabelText("Save tip");
		await fireEvent.click(saveButton);

		expect(mockOnSaveToggle).toHaveBeenCalledWith(mockTip.id);
	});

	it("shows error toast when trying to save while not authenticated", async () => {
		mockedUseAuthStore.mockReturnValue({ isAuthenticated: false });

		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const saveButton = screen.getByLabelText("Save tip");
		await fireEvent.click(saveButton);

		expect(mockToast.error).toHaveBeenCalledWith("Please log in to save tips");
		expect(mockOnSaveToggle).not.toHaveBeenCalled();
	});

	it("links directly to external source URL", () => {
		render(<TipCard tip={mockTip} onSaveToggle={mockOnSaveToggle} />);

		const readSourceLink = screen.getByText("Read Source");
		expect(readSourceLink).toBeInTheDocument();
		expect(readSourceLink).toHaveAttribute("href", mockTip.sourceUrl);
		expect(readSourceLink).toHaveAttribute("target", "_blank");
		expect(readSourceLink).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("does not show source link when sourceUrl is not provided", () => {
		const tipWithoutSource: Tip = {
			...mockTip,
			sourceUrl: "", // Empty string instead of undefined since sourceUrl is required
		};
		render(<TipCard tip={tipWithoutSource} onSaveToggle={mockOnSaveToggle} />);

		const readSourceLink = screen.queryByText("Read Source");
		expect(readSourceLink).not.toBeInTheDocument();
	});
});

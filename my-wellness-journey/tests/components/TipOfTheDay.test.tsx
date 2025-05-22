import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TipOfTheDay from "@/app/components/TipOfTheDay";
import { Tip } from "@/types/tip";

// Mock the TipCard component to verify what props it receives
jest.mock("@/app/components/TipCard", () => {
	return jest.fn(({ tip, onSaveToggle, onMarkDone }) => (
		<div data-testid="mock-tip-card">
			<h3 data-testid="tip-task">{tip.task}</h3>
			<p data-testid="tip-reason">{tip.reason}</p>
			<button onClick={() => onSaveToggle(tip.id)}>Save Toggle</button>
			{onMarkDone && <button onClick={() => onMarkDone(tip.id)}>Mark Done</button>}
		</div>
	));
});

// Mock the Loading component
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading">Loading...</div>,
}));

// Mock the useTipOfDayStore
jest.mock("@/stores/tipOfTheDayStore", () => ({
	useTipOfDayStore: jest.fn(() => ({
		migrateTipIfNeeded: jest.fn(),
	})),
}));

// Mock the useSavedStore
jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(() => ({
		savedTips: [],
	})),
}));

describe("TipOfTheDay Component", () => {
	const mockTip: Tip = {
		id: "tip-123",
		task: "Daily Health Tip",
		reason: "This is important for your wellness",
		sourceUrl: "https://example.com",
		saved: false,
		done: false,
	};

	const mockOnSaveToggle = jest.fn();
	const mockOnMarkDone = jest.fn();
	const mockOnDismiss = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders loading state correctly", () => {
		render(
			<TipOfTheDay
				tip={null}
				isLoading={true}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
			/>
		);

		expect(screen.getByTestId("loading")).toBeInTheDocument();
		expect(screen.getByText("Loading your daily tip...")).toBeInTheDocument();
	});

	it("renders dismissed state correctly with reset button", () => {
		render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={true}
				onShowTip={mockOnDismiss}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
			/>
		);

		expect(screen.getByTestId("dismissed-message")).toBeInTheDocument();
		expect(screen.getByTestId("dismissed-message")).toHaveTextContent("Your daily wellness tip is hidden");

		const resetButton = screen.getByText("Show Today's Tip");
		fireEvent.click(resetButton);
		expect(mockOnDismiss).toHaveBeenCalled();
	});

	it("clicking Show Today's Tip should show the tip after dismissal", () => {
		// First render in dismissed state
		const { rerender } = render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={true}
				onShowTip={mockOnDismiss}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
			/>
		);

		// Verify we're showing the dismissed state
		expect(screen.getByTestId("dismissed-message")).toBeInTheDocument();

		// Click the "Show Today's Tip" button
		const resetButton = screen.getByText("Show Today's Tip");
		fireEvent.click(resetButton);
		expect(mockOnDismiss).toHaveBeenCalled();

		// Now simulate the state update that should happen in the parent component
		// by rerendering with dismissed=false
		rerender(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onShowTip={mockOnDismiss}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
			/>
		);

		// Verify the tip is now shown
		expect(screen.queryByTestId("dismissed-message")).not.toBeInTheDocument();
		expect(screen.getByTestId("tip-task")).toBeInTheDocument();
		expect(screen.getByTestId("tip-task")).toHaveTextContent(mockTip.task);
	});

	it("renders tip correctly with task and reason text", () => {
		render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				onMarkDone={mockOnMarkDone}
				savedTips={[]}
			/>
		);

		expect(screen.getByText("Today's Wellness Tip")).toBeInTheDocument();

		// Check that the TipCard component receives the correct props
		expect(screen.getByTestId("mock-tip-card")).toBeInTheDocument();
		expect(screen.getByTestId("tip-task")).toHaveTextContent(mockTip.task);
		expect(screen.getByTestId("tip-reason")).toHaveTextContent(mockTip.reason);
	});

	it("renders dismiss button when allowDismiss is true", () => {
		render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onDismiss={mockOnDismiss}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
				allowDismiss={true}
			/>
		);

		const dismissButton = screen.getByText("Dismiss for today");
		expect(dismissButton).toBeInTheDocument();

		fireEvent.click(dismissButton);
		expect(mockOnDismiss).toHaveBeenCalled();
	});

	it("does not render dismiss button when allowDismiss is false", () => {
		render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onDismiss={mockOnDismiss}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
				allowDismiss={false}
			/>
		);

		expect(screen.queryByText("Dismiss for today")).not.toBeInTheDocument();
	});

	it("passes onMarkDone prop to TipCard when provided", () => {
		render(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				onMarkDone={mockOnMarkDone}
				savedTips={[]}
			/>
		);

		const markDoneButton = screen.getByText("Mark Done");
		fireEvent.click(markDoneButton);
		expect(mockOnMarkDone).toHaveBeenCalledWith(mockTip.id);
	});

	it("does not render anything when tip is null and not loading", () => {
		const { container } = render(
			<TipOfTheDay
				tip={null}
				isLoading={false}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
			/>
		);

		expect(container.firstChild).toBeNull();
	});
});

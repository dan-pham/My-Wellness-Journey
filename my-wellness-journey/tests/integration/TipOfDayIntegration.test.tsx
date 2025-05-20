import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import TipOfTheDay from "@/app/components/TipOfTheDay";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import { Tip } from "@/types/tip";

// Don't mock TipCard - we want to test the actual component rendering
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading">Loading...</div>,
}));

// Mock the store but keep its implementation
jest.mock("@/stores/tipOfTheDayStore", () => ({
	useTipOfDayStore: jest.fn(),
}));

describe("TipOfTheDay Integration", () => {
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

	beforeEach(() => {
		jest.clearAllMocks();
		(useTipOfDayStore as unknown as jest.Mock).mockReturnValue({
			tip: mockTip,
			dismissed: false,
			isLoading: false,
			error: null,
			fetchTipOfDay: jest.fn(),
			dismissForToday: jest.fn(),
			showTip: jest.fn(),
		});
	});

	it("renders the tip with visible task and reason text", async () => {
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

		// Verify the heading text is displayed
		expect(screen.getByText("Today's Wellness Tip")).toBeInTheDocument();

		// Verify the task text is displayed
		const taskElement = screen.getByText(mockTip.task);
		expect(taskElement).toBeInTheDocument();
		expect(taskElement).toBeVisible();

		// Verify the reason text is displayed
		const reasonElement = screen.getByText(mockTip.reason);
		expect(reasonElement).toBeInTheDocument();
		expect(reasonElement).toBeVisible();

		// Verify the Read Source link is displayed
		expect(screen.getByText("Read Source")).toBeInTheDocument();
	});

	it("renders the tip with proper structure from the store", async () => {
		// Create a mock implementation that simulates fetching from the store
		const mockFetchTipOfDay = jest.fn().mockImplementation(() => {
			(useTipOfDayStore as unknown as jest.Mock).mockReturnValue({
				tip: mockTip,
				dismissed: false,
				isLoading: false,
				error: null,
				fetchTipOfDay: mockFetchTipOfDay,
				dismissForToday: jest.fn(),
				showTip: jest.fn(),
			});
		});

		// Initially set loading state
		(useTipOfDayStore as unknown as jest.Mock).mockReturnValue({
			tip: null,
			dismissed: false,
			isLoading: true,
			error: null,
			fetchTipOfDay: mockFetchTipOfDay,
			dismissForToday: jest.fn(),
			showTip: jest.fn(),
		});

		const { rerender } = render(
			<TipOfTheDay
				tip={null}
				isLoading={true}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				savedTips={[]}
			/>
		);

		// Verify loading state
		expect(screen.getByTestId("loading")).toBeInTheDocument();

		// Simulate tip loaded from store
		await act(async () => {
			mockFetchTipOfDay();
		});

		// Re-render with the updated props
		rerender(
			<TipOfTheDay
				tip={mockTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				onMarkDone={mockOnMarkDone}
				savedTips={[]}
			/>
		);

		// Verify the task text is displayed and visible
		const taskElement = screen.getByText(mockTip.task);
		expect(taskElement).toBeInTheDocument();
		expect(taskElement).toBeVisible();
		expect(window.getComputedStyle(taskElement).display).not.toBe("none");

		// Verify the reason text is displayed and visible
		const reasonElement = screen.getByText(mockTip.reason);
		expect(reasonElement).toBeInTheDocument();
		expect(reasonElement).toBeVisible();
		expect(window.getComputedStyle(reasonElement).display).not.toBe("none");
	});

	it("correctly handles a real-world tip structure", () => {
		// This test uses a structure that exactly matches what would come from the API
		const realWorldTip: Tip = {
			id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fnutrition.html",
			task: "Eat a balanced diet with plenty of fruits and vegetables",
			reason:
				"Proper nutrition is essential for maintaining good health and preventing chronic diseases.",
			sourceUrl: "https://medlineplus.gov/nutrition.html",
			dateGenerated: new Date().toISOString(),
			tag: ["nutrition"],
			saved: false,
			done: false,
		};

		render(
			<TipOfTheDay
				tip={realWorldTip}
				isLoading={false}
				dismissed={false}
				onSaveToggle={mockOnSaveToggle}
				onMarkDone={mockOnMarkDone}
				savedTips={[]}
			/>
		);

		// Check for the task text
		const taskElement = screen.getByText(realWorldTip.task);
		expect(taskElement).toBeInTheDocument();
		expect(taskElement).toBeVisible();

		// Check for the reason text
		const reasonElement = screen.getByText(realWorldTip.reason);
		expect(reasonElement).toBeInTheDocument();
		expect(reasonElement).toBeVisible();
	});
});

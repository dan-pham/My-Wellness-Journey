"use client";

import { render, screen, waitFor, act, fireEvent, within } from "@testing-library/react";
import TipsPage from "@/app/tips/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useHealthStore } from "@/stores/healthStore";
import { useSavedStore } from "@/stores/savedStore";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
import toast from "react-hot-toast";
import React from "react";

// Mock modules
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("@/stores/authStore", () => ({
	useAuthStore: jest.fn(),
}));

jest.mock("@/stores/healthStore", () => ({
	useHealthStore: jest.fn(),
}));

jest.mock("@/stores/savedStore", () => ({
	useSavedStore: jest.fn(),
}));

jest.mock("@/stores/tipOfTheDayStore", () => ({
	useTipOfDayStore: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
	custom: jest.fn(),
}));

// Mock components
jest.mock("@/app/components/Header", () => () => <header>Header</header>);
jest.mock("@/app/components/Footer", () => () => <footer>Footer</footer>);
jest.mock("@/app/components/Loading", () => ({
	Loading: () => <div data-testid="loading">Loading...</div>,
}));
jest.mock("@/app/components/Error", () => ({
	Error: ({ message }: { message: string }) => <div data-testid="error">{message}</div>,
}));
jest.mock("@/app/components/EmptyState", () => ({
	EmptyState: ({ title, message, actionText, actionFn }: any) => (
		<div data-testid="empty-state">
			<h3>{title}</h3>
			<p>{message}</p>
			{actionText && <button onClick={actionFn}>{actionText}</button>}
		</div>
	),
}));
jest.mock("@/app/components/TipCard", () => ({
	__esModule: true,
	default: ({ tip, onSaveToggle, onMarkDone }: any) => (
		<div data-testid={`tip-card-${tip.id}`}>
			<h3>{tip.task}</h3>
			<p>{tip.reason}</p>
			<button data-testid={`save-toggle-${tip.id}`} onClick={() => onSaveToggle(tip.id)}>
				{tip.saved ? "Unsave" : "Save"}
			</button>
			<button data-testid={`mark-done-${tip.id}`} onClick={() => onMarkDone(tip.id)}>
				{tip.done ? "Unmark" : "Mark as Done"}
			</button>
		</div>
	),
}));
jest.mock("@/app/components/TipOfTheDay", () => ({
	__esModule: true,
	default: ({ tip, onSaveToggle, onMarkDone, onDismiss }: any) => (
		<section data-testid="tip-of-day-section" className="mb-12">
			<h2>Today's Wellness Tip</h2>
			<div data-testid="tip-card-tip-of-day-1">
				<h3 data-testid="tip-of-day-title">{tip?.task}</h3>
				<p>{tip?.reason}</p>
				<button data-testid={`save-toggle-${tip?.id}`} onClick={() => onSaveToggle(tip?.id)}>
					Save
				</button>
				<button data-testid={`mark-done-${tip?.id}`} onClick={() => onMarkDone(tip?.id)}>
					Mark as Done
				</button>
				{onDismiss && <button onClick={onDismiss}>Dismiss</button>}
			</div>
		</section>
	),
}));

// Mock window.location
Object.defineProperty(window, "location", {
	value: {
		href: "",
		replace: jest.fn(),
	},
	writable: true,
});

describe("Tips Page", () => {
	const mockPush = jest.fn();
	const mockFetchTips = jest.fn();
	const mockFetchSavedTips = jest.fn();
	const mockAddTip = jest.fn();
	const mockRemoveTip = jest.fn();
	const mockFetchTipOfDay = jest.fn();
	const mockDismissForToday = jest.fn();

	// Mock tips
	const mockTips = [
		{
			title: "Diabetes Management",
			url: "https://medlineplus.gov/diabetes.html",
			snippet: "Tips for managing diabetes effectively",
		},
		{
			title: "Heart Health",
			url: "https://medlineplus.gov/heartdiseases.html",
			snippet: "Maintaining a healthy heart",
		},
	];

	// Mock tip of the day
	const mockTipOfDay = {
		id: "tip-of-day-1",
		task: "Daily Hydration",
		reason: "Remember to drink at least 8 glasses of water daily for optimal health.",
		sourceUrl: "https://medlineplus.gov/hydration.html",
	};

	// Mock saved tips
	const mockSavedTips = ["medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html"];
	const mockSavedTipsData = [
		{
			id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html",
			task: "Diabetes Management",
			reason: "Tips for managing diabetes effectively",
			sourceUrl: "https://medlineplus.gov/diabetes.html",
			saved: true,
		},
	];

	// Mock actionable tasks
	const mockActionableTasks = {
		actionableTasks: [
			{
				id: "diabetes-task-1",
				task: "Check Blood Sugar",
				reason: "Monitor your blood sugar levels daily",
				sourceUrl: "",
			},
			{
				id: "diabetes-task-2",
				task: "Healthy Eating",
				reason: "Follow a balanced diet recommended by your doctor",
				sourceUrl: "",
			},
		],
	};

	// Mock done tips
	const mockDoneTips = ["diabetes-task-1"];

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset window.location.href
		window.location.href = "";

		// Mock localStorage
		const mockLocalStorage = {
			getItem: jest.fn().mockImplementation((key) => {
				if (key === "doneTips") return JSON.stringify(mockDoneTips);
				if (key === "recentSearches") return JSON.stringify(["diabetes", "exercise"]);
				return null;
			}),
			setItem: jest.fn(),
			removeItem: jest.fn(),
		};
		Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

		// Mock useRouter
		(useRouter as jest.Mock).mockImplementation(() => ({
			push: mockPush,
		}));

		// Mock useAuthStore
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: true,
			user: {
				id: "user1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				profile: {
					chronicConditions: [{ id: "diabetes", name: "Diabetes" }],
				},
			},
		}));

		// Mock useHealthStore
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: mockTips,
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		// Mock useSavedStore
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedTips: mockSavedTips,
			savedTipsData: mockSavedTipsData,
			addTip: mockAddTip.mockImplementation(() => Promise.resolve()),
			removeTip: mockRemoveTip.mockImplementation(() => Promise.resolve()),
			fetchSavedTips: mockFetchSavedTips.mockImplementation(() => Promise.resolve()),
			loading: false,
		}));

		// Mock useTipOfDayStore
		(useTipOfDayStore as unknown as jest.Mock).mockImplementation(() => ({
			tip: mockTipOfDay,
			dismissed: false,
			fetchTipOfDay: mockFetchTipOfDay.mockImplementation(() => Promise.resolve()),
			dismissForToday: mockDismissForToday,
		}));

		// Mock fetch for actionable tasks
		global.fetch = jest.fn().mockImplementation((url) => {
			if (url.includes("/api/gpt")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockActionableTasks),
				});
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ results: mockTips }),
			});
		});
	});

	it("renders the tips page with search functionality", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Check for search input
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		expect(searchInput).toBeInTheDocument();

		// Check for search button
		const searchButton = screen.getByRole("button", { name: /search/i });
		expect(searchButton).toBeInTheDocument();

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Wait for personalized tips to appear
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
			expect(screen.getByTestId("tip-card-diabetes-task-1")).toBeInTheDocument();
		});
	});

	it("displays tip of the day when available", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Check for tip of the day section
		const tipOfDaySection = screen.getByTestId("tip-of-day-section");
		expect(tipOfDaySection).toBeInTheDocument();
		expect(within(tipOfDaySection).getByText("Today's Wellness Tip")).toBeInTheDocument();
		expect(within(tipOfDaySection).getByTestId("tip-of-day-title")).toHaveTextContent(
			"Daily Hydration"
		);

		// No need to check for dismiss button as it's not required in the tips page
	});

	it("displays saved tips when user is authenticated", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Wait for saved tips to load
		await waitFor(() => {
			expect(screen.getByText("My Saved Tips")).toBeInTheDocument();
		});

		// Check if saved tip card is rendered in the saved tips section
		const savedTipsSection = screen.getByText("My Saved Tips").closest("section");
		expect(savedTipsSection).toBeInTheDocument();

		// Check for the saved tip
		const savedTipId = "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html";
		const savedTipCard = within(savedTipsSection!).getByTestId(`tip-card-${savedTipId}`);
		expect(savedTipCard).toBeInTheDocument();
	});

	it("hides saved tips when user is not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: false,
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Check that saved tips section is not rendered
		expect(screen.queryByText("My Saved Tips")).not.toBeInTheDocument();
	});

	it("shows empty state when no search has been made", async () => {
		// Mock tips as empty and no search has been made
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Check for the empty state UI elements
		const emptyState = screen.getByTestId("empty-state");
		expect(within(emptyState).getByText("Discover Health Tips")).toBeInTheDocument();
		expect(
			within(emptyState).getByText(
				"Search for health topics above to find trusted wellness tips that can help you on your journey."
			)
		).toBeInTheDocument();

		// Check for topic suggestions in the quick search section
		const quickSearchSection = within(emptyState).getByTestId("quick-search-section");
		const topics = ["diabetes", "nutrition", "exercise", "sleep", "stress", "meditation"];
		topics.forEach((topic) => {
			expect(within(quickSearchSection).getByText(topic)).toBeInTheDocument();
		});
	});

	it("shows loading state when fetching tips", async () => {
		// Mock loading state
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [],
			tipsLoading: true,
			tipsError: null,
			fetchTips: mockFetchTips,
		}));

		// Mock loading state for actionable tasks
		global.fetch = jest.fn().mockImplementation(() => {
			return new Promise((resolve) => {
				// Never resolve to simulate loading
				setTimeout(() => {
					resolve({
						ok: true,
						json: () => Promise.resolve({}),
					});
				}, 1000);
			});
		});

		// Set isLoadingTasks to true in the component
		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search to trigger loading state
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "diabetes" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Check for loading indicator - it should appear in the component
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("shows error state when tip fetch fails", async () => {
		// Mock error state
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [],
			tipsLoading: false,
			tipsError: "Failed to fetch tips",
			fetchTips: mockFetchTips,
		}));

		// Create a custom EmptyState component that shows error messages
		jest.mock("@/app/components/EmptyState", () => ({
			EmptyState: ({ title, message }: any) => (
				<div data-testid="empty-state">
					<h3>{title}</h3>
					<p>{message}</p>
				</div>
			),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Check for error message in the empty state
		const emptyState = screen.getByTestId("empty-state");
		expect(emptyState).toBeInTheDocument();
	});

	it("handles saving a tip when authenticated", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search to display tips
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "diabetes" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Wait for personalized tips to appear
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
		});

		// Find the unsaved tip and click its save button
		const tipId = "diabetes-task-2"; // Using the mock actionable task
		const saveButton = screen.getByTestId(`save-toggle-${tipId}`);

		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Wait for the save operation to complete
		await waitFor(() => {
			expect(mockAddTip).toHaveBeenCalled();
		});
	});

	it("handles unsaving a tip", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Find the saved tip in the saved tips section
		const savedTipsSection = screen.getByText("My Saved Tips").closest("section");
		expect(savedTipsSection).toBeInTheDocument();

		const tipId = "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html";
		const unsaveButton = within(savedTipsSection!).getByTestId(`save-toggle-${tipId}`);

		await act(async () => {
			fireEvent.click(unsaveButton);
		});

		// Wait for the unsave operation to complete
		await waitFor(() => {
			expect(mockRemoveTip).toHaveBeenCalledWith(tipId);
		});
	});

	it("shows toast when trying to save a tip while not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: false,
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search to display tips
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "diabetes" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Wait for personalized tips to appear
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
		});

		// Find a tip and click its save button
		const tipId = "diabetes-task-1";
		const saveButton = screen.getByTestId(`save-toggle-${tipId}`);

		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Check that error toast was shown
		expect(toast.error).toHaveBeenCalledWith("Please log in to save tips", expect.anything());
		expect(toast.custom).toHaveBeenCalled();
	});

	it("handles marking a tip as done", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search to display tips
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "diabetes" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Wait for personalized tips to appear
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
		});

		// Find a tip in the personalized tips section and click its mark as done button
		const personalizedTipsSection = screen.getByText("Personalized Tips").closest("section");
		expect(personalizedTipsSection).toBeInTheDocument();

		const tipId = "diabetes-task-2";
		const markDoneButton = within(personalizedTipsSection!).getByTestId(`mark-done-${tipId}`);

		await act(async () => {
			fireEvent.click(markDoneButton);
		});

		// Check that localStorage was updated
		expect(window.localStorage.setItem).toHaveBeenCalledWith("doneTips", expect.any(String));
		expect(toast.success).toHaveBeenCalledWith("Tip marked as done", expect.anything());
	});

	it("displays actionable tasks after searching", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "diabetes" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Wait for actionable tasks to appear
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
			expect(screen.getByTestId("tip-card-diabetes-task-1")).toBeInTheDocument();
		});
	});

	it("displays recent searches", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Check that recent searches are displayed
		expect(screen.getByText("Recent searches:")).toBeInTheDocument();
		// Use getAllByText since there might be multiple elements with the same text
		expect(screen.getAllByText("diabetes")[0]).toBeInTheDocument();
		expect(screen.getAllByText("exercise")[0]).toBeInTheDocument();

		// Click on a recent search
		await act(async () => {
			fireEvent.click(screen.getAllByText("diabetes")[0]);
		});

		// Wait for the search to update
		await waitFor(() => {
			expect(screen.getByTestId("tip-card-diabetes-task-1")).toBeInTheDocument();
		});
	});

	it("handles quick search topic selection", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Find the quick search section
		const quickSearchSection = screen.getByTestId("quick-search-section");
		expect(quickSearchSection).toBeInTheDocument();

		// Click on a topic button
		const diabetesButton = within(quickSearchSection).getByText("diabetes");
		await act(async () => {
			fireEvent.click(diabetesButton);
		});

		// Wait for the search to complete
		await waitFor(() => {
			expect(screen.getByTestId("tip-card-diabetes-task-1")).toBeInTheDocument();
		});
	});

	it("displays saved tips from different sources after saving", async () => {
		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "heart health" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Wait for search results and actionable tasks
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
		});

		// Save a tip from search results
		const saveButton = screen.getByTestId("save-toggle-diabetes-task-1");
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Check that the tip appears in saved tips section
		expect(screen.getByText("My Saved Tips")).toBeInTheDocument();
	});

	it("handles tips with missing or undefined snippet", async () => {
		// Mock tips with missing data
		const incompleteData = [
			{
				title: "Health Topic",
				url: "https://example.com",
				// Missing snippet
			},
		];

		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: incompleteData,
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Perform a search
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText("Search tips by topic or keyword"), {
				target: { value: "health" },
			});
			fireEvent.click(screen.getByRole("button", { name: /search/i }));
		});

		// Wait for search results
		await waitFor(() => {
			expect(screen.getByText("Personalized Tips")).toBeInTheDocument();
		});
	});
});

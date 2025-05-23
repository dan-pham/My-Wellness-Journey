"use client";

import { render, screen, waitFor, act, fireEvent, within } from "@testing-library/react";
import TipsPage from "@/app/tips/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useHealthStore } from "@/stores/healthStore";
import { useSavedStore } from "@/stores/savedStore";
import { useTipOfDayStore } from "@/stores/tipOfTheDayStore";
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
jest.mock("react-hot-toast", () => {
	const mockToast = {
		success: jest.fn(),
		error: jest.fn(),
		custom: jest.fn(),
	};
	return {
		__esModule: true,
		default: mockToast,
	};
});

const mockToast = jest.requireMock("react-hot-toast").default;

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
	default: ({ tip, onSaveToggle }: any) => (
		<div
			className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
			onClick={(e) => e.stopPropagation()}
		>
			<div className="flex items-start justify-between gap-2 mb-4 px-2">
				<p className="font-medium text-primary-heading">{tip.task}</p>
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onSaveToggle(tip.id);
					}}
					type="button"
					className="text-primary-accent hover:scale-110 transition-transform duration-200 flex-shrink-0"
					aria-label={tip.saved ? "Remove from saved" : "Save tip"}
					data-testid={`save-button-${tip.id}`}
				>
					{tip.saved ? "Unsave" : "Save"}
				</button>
			</div>
			<div className="flex items-start gap-2 mb-4 px-2">
				<p className="text-sm text-primary-subheading whitespace-normal break-words">{tip.reason}</p>
			</div>
			<div className="flex justify-end gap-4">
				{tip.sourceUrl && (
					<a
						href={tip.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
					>
						Read Source
					</a>
				)}
			</div>
		</div>
	),
}));
jest.mock("@/app/components/TipOfTheDay", () => ({
	__esModule: true,
	default: ({ tip, onSaveToggle, onDismiss }: any) => (
		<section data-testid="tip-of-day-section" className="mb-12">
			<h2>Today's Wellness Tip</h2>
			<div data-testid="tip-card-tip-of-day-1">
				<h3 data-testid="tip-of-day-title">{tip?.task}</h3>
				<p>{tip?.reason}</p>
				<button data-testid={`save-toggle-${tip?.id}`} onClick={() => onSaveToggle(tip?.id)}>
					Save
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
			id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Check%20Blood%20Sugar",
			task: "Check Blood Sugar",
			reason: "Monitor your blood sugar levels daily",
			sourceUrl: "https://medlineplus.gov/diabetes.html",
			dateGenerated: new Date().toISOString(),
			tag: ["diabetes"],
			saved: false,
		},
	];

	// Mock tip of the day
	const mockTipOfDay = {
		id: "tip-of-day-1",
		task: "Daily Hydration",
		reason: "Remember to drink at least 8 glasses of water daily for optimal health.",
		sourceUrl: "https://medlineplus.gov/hydration.html",
		dateGenerated: new Date().toISOString(),
		tag: ["hydration"],
		saved: false,
	};

	// Mock saved tips
	const mockSavedTips = [
		"medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Check%20Blood%20Sugar",
	];
	const mockSavedTipsData = [
		{
			id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Check%20Blood%20Sugar",
			task: "Check Blood Sugar",
			reason: "Monitor your blood sugar levels daily",
			sourceUrl: "https://medlineplus.gov/diabetes.html",
			dateGenerated: new Date().toISOString(),
			tag: ["diabetes"],
			saved: true,
		},
	];

	// Mock actionable tasks
	const mockActionableTasks = {
		actionableTasks: [
			{
				id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Check%20Blood%20Sugar",
				task: "Check Blood Sugar",
				reason: "Monitor your blood sugar levels daily",
				sourceUrl: "https://medlineplus.gov/diabetes.html",
				saved: false,
				dateGenerated: new Date().toISOString(),
				tag: ["diabetes"],
			},
			{
				id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Healthy%20Eating",
				task: "Healthy Eating",
				reason: "Follow a balanced diet recommended by your doctor",
				sourceUrl: "https://medlineplus.gov/diabetes.html",
				saved: false,
				dateGenerated: new Date().toISOString(),
				tag: ["diabetes"],
			},
		],
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset window.location.href
		window.location.href = "";

		// Mock localStorage
		const mockLocalStorage = {
			getItem: jest.fn(),
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
			tips: [],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		// Mock useSavedStore
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedTips: [],
			savedTipsData: [],
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

		// Mock all API endpoints globally for all tests
		global.fetch = jest.fn().mockImplementation((url) => {
			if (url.includes("/api/gpt")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ actionableTasks: [mockTips[0]] }),
				});
			}
			if (url.includes("/api/medlineplus")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({
						total: 1,
						results: [{
							title: "Check Blood Sugar",
							url: "https://medlineplus.gov/diabetes.html",
							snippet: "Monitor your blood sugar levels daily"
						}]
					}),
				});
			}
			if (url.includes("/api/user/saved-tips")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ savedTips: [] }),
				});
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({}),
			});
		});
	});

	it("renders the tips page with search functionality", async () => {
		// Mock health store to return tips after search
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [mockTips[0]],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Check for search input
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		expect(searchInput).toBeInTheDocument();

		// Check for search button using specific test ID
		const searchButton = screen.getByTestId("tip-search-button");
		expect(searchButton).toBeInTheDocument();

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Wait for tips to appear
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
			expect(screen.getByText("Monitor your blood sugar levels daily")).toBeInTheDocument();
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
	});

	it("displays saved tips when user is authenticated", async () => {
		// Mock the saved store with existing saved tips
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedTips: mockSavedTips,
			savedTipsData: mockSavedTipsData,
			addTip: mockAddTip.mockImplementation(() => Promise.resolve()),
			removeTip: mockRemoveTip.mockImplementation(() => Promise.resolve()),
			fetchSavedTips: mockFetchSavedTips.mockImplementation(() => Promise.resolve()),
			loading: false,
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Wait for saved tips to load
		await waitFor(() => {
			expect(screen.getByText("My Saved Tips")).toBeInTheDocument();
		});

		// Check if saved tip card is rendered
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
		});
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

		// The QuickSearch component should be rendered with empty-state test ID
		const quickSearch = screen.getByTestId("empty-state");
		expect(quickSearch).toBeInTheDocument();
		expect(within(quickSearch).getByText("Discover Health Tips")).toBeInTheDocument();
		expect(
			within(quickSearch).getByText(
				"Search for health topics above to find trusted wellness tips that can help you on your journey."
			)
		).toBeInTheDocument();
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

		// Use the specific test ID for the search button
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		const searchButton = screen.getByTestId("tip-search-button");

		// Perform a search to trigger loading state
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Verify that loading indicator is visible
		const loadingElements = screen.getAllByTestId("loading");
		const loadingElement = loadingElements[0];
		expect(loadingElement).toBeVisible();
	});

	it("shows error state when tip fetch fails", async () => {
		// Store the original console.error
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock error state
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [],
			tipsLoading: false,
			tipsError: "Failed to fetch tips",
			fetchTips: mockFetchTips,
		}));

		// Mock the fetch to fail
		global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error("Failed to fetch")));

		await act(async () => {
			render(<TipsPage />);
		});

		// Use the specific test ID for the search button
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		const searchButton = screen.getByTestId("tip-search-button");

		// Perform a search to trigger error state
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "test" } });
			fireEvent.click(searchButton);
		});

		// Wait for the error state to appear
		await waitFor(() => {
			const emptyState = screen.getByTestId("empty-state");
			expect(emptyState).toBeInTheDocument();
			expect(within(emptyState).getByText("No tips found.")).toBeInTheDocument();
		});

		// Restore console.error after test
		console.error = originalConsoleError;
	});

	it("handles saving a tip when authenticated", async () => {
		// Mock health store to return tips after search
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [mockTips[0]],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Use the specific test ID for the search button
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		const searchButton = screen.getByTestId("tip-search-button");

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Wait for tips to load and verify content
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
			expect(screen.getByText("Monitor your blood sugar levels daily")).toBeInTheDocument();
		});

		// Find and click the save button using aria-label
		const saveButton = screen.getByLabelText("Save tip");
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Wait for the save operation to complete
		await waitFor(() => {
			expect(mockAddTip).toHaveBeenCalledWith(
				"medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Check%20Blood%20Sugar",
				expect.any(Object)
			);
			expect(mockToast.success).toHaveBeenCalledWith("Tip saved");
		});
	});

	it("handles unsaving a tip", async () => {
		// Mock the tip as already saved
		const savedTip = {
			id: "medline-https%3A%2F%2Fmedlineplus.gov%2Fdiabetes.html-Check%20Blood%20Sugar",
			task: "Check Blood Sugar",
			reason: "Monitor your blood sugar levels daily",
			sourceUrl: "https://medlineplus.gov/diabetes.html",
			saved: true,
		};

		// Mock saved store with the saved tip and removeTip function
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedTips: [savedTip.id],
			savedTipsData: [savedTip],
			removeTip: mockRemoveTip.mockImplementation(() => Promise.resolve()),
			addTip: mockAddTip.mockImplementation(() => Promise.resolve()),
			fetchSavedTips: mockFetchSavedTips.mockImplementation(() => Promise.resolve()),
			loading: false,
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Wait for saved tips section to load
		await waitFor(() => {
			expect(screen.getByText("My Saved Tips")).toBeInTheDocument();
		});

		// Find the saved tips section
		const savedTipsSection = screen.getByText("My Saved Tips").closest("section");
		expect(savedTipsSection).toBeInTheDocument();

		// Find and click the unsave button within the saved tips section
		const unsaveButton = within(savedTipsSection!).getByTestId(`save-button-${savedTip.id}`);
		await act(async () => {
			fireEvent.click(unsaveButton);
		});

		// Wait for the unsave operation to complete
		await waitFor(() => {
			expect(mockRemoveTip).toHaveBeenCalledWith(savedTip.id);
			expect(mockToast.success).toHaveBeenCalledWith("Tip removed from saved");
		});
	});

	it("shows toast when trying to save a tip while not authenticated", async () => {
		// Mock user as not authenticated
		(useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
			isAuthenticated: false,
		}));

		// Mock health store to return a tip
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [mockTips[0]],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Use the specific test ID for the search button
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		const searchButton = screen.getByTestId("tip-search-button");

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Wait for tip to appear and find save button
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
		});

		// Find and click the save button
		const saveButton = screen.getByLabelText("Save tip");
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Verify the toast message was shown
		expect(mockToast.error).toHaveBeenCalledWith("Please log in to save tips", expect.anything());
	});

	it("displays actionable tasks after searching", async () => {
		// Mock health store to return tips after search
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [mockTips[0]],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Use the specific test ID for the search button
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		const searchButton = screen.getByTestId("tip-search-button");

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "diabetes" } });
			fireEvent.click(searchButton);
		});

		// Wait for tips to appear in SearchResults
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
			expect(screen.getByText("Monitor your blood sugar levels daily")).toBeInTheDocument();
		});
	});

	it("handles quick search topic selection", async () => {
		// Mock health store to return tips after search
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			tips: [mockTips[0]],
			tipsLoading: false,
			tipsError: null,
			fetchTips: mockFetchTips.mockImplementation(() => Promise.resolve()),
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Find and click the specific quick search button
		const diabetesButton = screen.getByTestId("quick-search-diabetes");
		await act(async () => {
			fireEvent.click(diabetesButton);
		});

		// Verify search results are shown
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
			expect(screen.getByText("Monitor your blood sugar levels daily")).toBeInTheDocument();
		});
	});

	it("displays saved tips from different sources after saving", async () => {
		// Mock saved store with initial saved tip
		(useSavedStore as unknown as jest.Mock).mockImplementation(() => ({
			savedTips: mockSavedTips,
			savedTipsData: mockSavedTipsData,
			addTip: mockAddTip.mockImplementation(() => Promise.resolve()),
			removeTip: mockRemoveTip.mockImplementation(() => Promise.resolve()),
			fetchSavedTips: mockFetchSavedTips.mockImplementation(() => Promise.resolve()),
			loading: false,
		}));

		await act(async () => {
			render(<TipsPage />);
		});

		// Verify saved tip is displayed
		await waitFor(() => {
			expect(screen.getByText("Check Blood Sugar")).toBeInTheDocument();
			expect(screen.getByText("Monitor your blood sugar levels daily")).toBeInTheDocument();
		});
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

		// Use the specific test ID for the search button
		const searchInput = screen.getByPlaceholderText("Search tips by topic or keyword");
		const searchButton = screen.getByTestId("tip-search-button");

		// Perform a search
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "health" } });
			fireEvent.click(searchButton);
		});

		// Wait for search results
		await waitFor(() => {
			const personalizedTipsHeadings = screen.getAllByText("Personalized Tips");
			expect(personalizedTipsHeadings).toHaveLength(1);
		});
	});
});

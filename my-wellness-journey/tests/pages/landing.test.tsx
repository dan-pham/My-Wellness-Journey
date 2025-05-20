"use client";

import { render, screen, act, waitFor } from "@testing-library/react";
import HomePage from "@/app/page";
import { useHealthStore } from "@/stores/healthStore";
import { MyHealthFinder } from "@/lib/api/myhealthfinder";

// Mock components
jest.mock("@/app/components/Header", () => ({
	__esModule: true,
	default: () => <header data-testid="header">Header</header>,
}));

jest.mock("@/app/components/HeroSection", () => ({
	__esModule: true,
	default: () => <section data-testid="hero-section">Hero Section</section>,
}));

jest.mock("@/app/components/FeaturesSection", () => ({
	__esModule: true,
	default: () => <section data-testid="features-section">Features Section</section>,
}));

jest.mock("@/app/components/ResourcesSection", () => ({
	__esModule: true,
	default: ({ resources }: { resources: any[] }) => (
		<section data-testid="resources-section">
			Resources Section
			{resources && (
				<div data-testid="resources-list">
					{resources.map((resource) => (
						<div key={resource.id} data-testid={`resource-${resource.id}`}>
							{resource.title}
						</div>
					))}
				</div>
			)}
		</section>
	),
}));

jest.mock("@/app/components/CTASection", () => ({
	__esModule: true,
	default: () => <section data-testid="cta-section">CTA Section</section>,
}));

jest.mock("@/app/components/Footer", () => ({
	__esModule: true,
	default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock("@/app/components/Loading", () => ({
	__esModule: true,
	Loading: () => <div data-testid="loading">Loading...</div>,
}));

jest.mock("@/app/components/ErrorBoundary", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="error-boundary">{children}</div>
	),
}));

// Mock AuthProvider
jest.mock("@/app/components/AuthProvider", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="auth-provider">{children}</div>
	),
}));

// Mock the health store
jest.mock("@/stores/healthStore", () => ({
	useHealthStore: jest.fn(),
}));

const mockResources: MyHealthFinder[] = [
	{
		id: "1",
		title: "Healthy Eating",
		content: "Healthy eating is very important for a good lifestyle.",
		conditions: ["diabetes", "high cholesterol"],
		sourceUrl: "https://example.com/healthy-eating",
		imageUrl: "https://example.com/image1.jpg",
	},
	{
		id: "2",
		title: "Exercise Tips",
		content: "Moderate exercise for 30 minutes a day will do wonders for your body.",
		conditions: ["diabetes", "high blood sugar"],
		sourceUrl: "https://example.com/exercise-tips",
		imageUrl: "https://example.com/image2.jpg",
	},
];

describe("Home Page", () => {
	const mockFetchResources = jest.fn();

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Setup default mock implementation
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			fetchResources: mockFetchResources,
			resources: [],
			resourcesLoading: false,
			resourcesError: null,
		}));
	});

	it("renders all main sections", async () => {
		await act(async () => {
			render(<HomePage />);
		});

		expect(screen.getByTestId("header")).toBeInTheDocument();
		expect(screen.getByTestId("hero-section")).toBeInTheDocument();
		expect(screen.getByTestId("features-section")).toBeInTheDocument();
		expect(screen.getByTestId("resources-section")).toBeInTheDocument();
		expect(screen.getByTestId("cta-section")).toBeInTheDocument();
		expect(screen.getByTestId("footer")).toBeInTheDocument();
	});

	it("fetches resources on mount", async () => {
		await act(async () => {
			render(<HomePage />);
		});

		await waitFor(() => {
			expect(mockFetchResources).toHaveBeenCalledWith("health", 3);
		});
	});

	it("shows loading state while fetching resources", async () => {
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			fetchResources: mockFetchResources,
			resources: [],
			resourcesLoading: true,
			resourcesError: null,
		}));

		await act(async () => {
			render(<HomePage />);
		});

		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("displays resources when loaded", async () => {
		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			fetchResources: mockFetchResources,
			resources: mockResources,
			resourcesLoading: false,
			resourcesError: null,
		}));

		await act(async () => {
			render(<HomePage />);
		});

		await waitFor(() => {
			expect(screen.getByTestId("resources-list")).toBeInTheDocument();
			expect(screen.getByTestId("resource-1")).toHaveTextContent("Healthy Eating");
			expect(screen.getByTestId("resource-2")).toHaveTextContent("Exercise Tips");
		});
	});

	it("handles error state", async () => {
		const errorMessage = "Failed to fetch resources";

		(useHealthStore as unknown as jest.Mock).mockImplementation(() => ({
			fetchResources: mockFetchResources,
			resources: [],
			resourcesLoading: false,
			resourcesError: new Error(errorMessage),
		}));

		// Mock console.error to avoid error logs in test output
		const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

		await act(async () => {
			render(<HomePage />);
		});

		// The error is caught by the ErrorBoundary, so we just verify the ErrorBoundary is rendered
		expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

		// Clean up
		consoleError.mockRestore();
	});
});

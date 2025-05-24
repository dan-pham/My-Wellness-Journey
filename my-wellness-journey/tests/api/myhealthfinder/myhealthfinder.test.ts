import { NextRequest } from "next/server";
import { GET } from "@/app/api/myhealthfinder/route";

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Mock fetch API
global.fetch = jest.fn();

// Simple helper to create a NextRequest
interface SearchRequestParams {
	keyword?: string;
	limit?: string;
}

const createRequest = (params: SearchRequestParams = {}) => {
	const url = new URL("http://localhost:3000/api/myhealthfinder");
	if (params.keyword) url.searchParams.set("keyword", params.keyword);
	if (params.limit) url.searchParams.set("limit", params.limit);

	return {
		url: url.toString(),
		nextUrl: { pathname: "/api/myhealthfinder" },
	} as unknown as NextRequest;
};

describe("MyHealthFinder API Route", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Test successful API call
	it("should return health tips from Health.gov API", async () => {
		// Mock successful API response
		const mockApiResponse = {
			Result: {
				Total: 2,
				Items: [
					{
						Id: "1",
						Title: "Test Tip 1",
					},
					{
						Id: "2",
						Title: "Test Tip 2",
					},
				],
			},
		};

		(fetch as jest.Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockApiResponse),
			})
		);

		// Create a request with search params
		const req = createRequest({
			keyword: "diabetes",
			limit: "5",
		});

		// Call the API route
		const response = await GET(req);
		const data = await response.json();

		// Verify response
		expect(response.status).toBe(200);
		expect(data).toEqual(mockApiResponse);

		// Verify that fetch was called with the right URL
		expect(fetch).toHaveBeenCalledWith(
			"https://health.gov/myhealthfinder/api/v3/topicsearch.json?keyword=diabetes&lang=en&limit=5",
			expect.objectContaining({
				headers: expect.objectContaining({
					Accept: "application/json",
				}),
			})
		);
	});

	// Test default parameters
	it("should use default parameters when not provided", async () => {
		// Mock successful API response
		(fetch as jest.Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ data: "default" }),
			})
		);

		// Create a request with no params
		const req = createRequest();

		// Call the API route
		await GET(req);

		// Verify that fetch was called with default parameters
		expect(fetch).toHaveBeenCalledWith(
			"https://health.gov/myhealthfinder/api/v3/topicsearch.json?keyword=general&lang=en&limit=10",
			expect.any(Object)
		);
	});

	// Test API error handling
	it("should handle API errors gracefully", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock failed API response
		(fetch as jest.Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: false,
				status: 500,
			})
		);

		// Create a request
		const req = createRequest({ keyword: "test" });

		// Call the API route
		const response = await GET(req);
		const data = await response.json();

		// Verify error response
		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to fetch health tips");

		// Restore console.error
		console.error = originalConsoleError;
	});

	// Test fetch error handling
	it("should handle fetch errors", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock fetch to throw an error
		(fetch as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error("Network error")));

		// Create a request
		const req = createRequest();

		// Call the API route
		const response = await GET(req);
		const data = await response.json();

		// Verify error response
		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to fetch health tips");

		// Restore console.error
		console.error = originalConsoleError;
	});
});

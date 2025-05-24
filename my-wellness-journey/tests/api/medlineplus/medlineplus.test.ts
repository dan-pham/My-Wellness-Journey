import { NextRequest } from "next/server";
import { GET } from "@/app/api/medlineplus/route";
import * as medlinePlusApi from "@/lib/api/medlineplus";

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Mock the medlineplus API functions
jest.mock("@/lib/api/medlineplus", () => ({
	searchMedlinePlus: jest.fn(),
}));

// Simple helper to create a NextRequest
interface SearchRequestParams {
	query?: string;
	maxResults?: string;
}

const createRequest = (params: SearchRequestParams = {}) => {
	const url = new URL("http://localhost:3000/api/medlineplus");
	if (params.query) url.searchParams.set("query", params.query);
	if (params.maxResults) url.searchParams.set("maxResults", params.maxResults);

	return {
		url: url.toString(),
		nextUrl: { pathname: "/api/medlineplus" },
	} as unknown as NextRequest;
};

describe("MedlinePlus API Route", () => {
	// Context parameter required by withApiMiddleware if used
	const context = { params: {} };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Test successful search
	it("should return search results when a valid query is provided", async () => {
		// Mock the searchMedlinePlus function to return test data
		const mockResults = {
			total: 2,
			results: [
				{
					title: "Test Result 1",
					url: "https://medlineplus.gov/test1",
					snippet: "Test snippet 1",
				},
				{
					title: "Test Result 2",
					url: "https://medlineplus.gov/test2",
					snippet: "Test snippet 2",
				},
			],
		};
		(medlinePlusApi.searchMedlinePlus as jest.Mock).mockResolvedValue(mockResults);

		// Create a request with search params
		const req = createRequest({ query: "diabetes", maxResults: "5" });

		// Call the API route
		const response = await GET(req);
		const data = await response.json();

		// Verify response
		expect(response.status).toBe(200);
		expect(data).toEqual(mockResults);

		// Verify the searchMedlinePlus function was called with the right params
		expect(medlinePlusApi.searchMedlinePlus).toHaveBeenCalledWith("diabetes", 5);
	});

	// Test empty query
	it("should return empty results when no query is provided", async () => {
		const req = createRequest();

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({ total: 0, results: [] });

		// Verify the searchMedlinePlus function was not called
		expect(medlinePlusApi.searchMedlinePlus).not.toHaveBeenCalled();
	});

	// Test default maxResults
	it("should use default maxResults when not provided", async () => {
		// Mock the searchMedlinePlus function
		(medlinePlusApi.searchMedlinePlus as jest.Mock).mockResolvedValue({
			total: 1,
			results: [
				{
					title: "Test Result",
					url: "https://example.com",
					snippet: "Test snippet",
				},
			],
		});

		const req = createRequest({ query: "test" });

		await GET(req);

		// Verify the default value of 10 was used
		expect(medlinePlusApi.searchMedlinePlus).toHaveBeenCalledWith("test", 10);
	});

	// Test error handling
	it("should return a 500 error when the API call fails", async () => {
		// Mock the searchMedlinePlus function to throw an error
		const mockError = new Error("API Error");
		(medlinePlusApi.searchMedlinePlus as jest.Mock).mockRejectedValue(mockError);

		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		const req = createRequest({ query: "test" });

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to fetch MedlinePlus data.");
		expect(data.details).toBe("API Error");

		// Restore console.error
		console.error = originalConsoleError;
	});
});

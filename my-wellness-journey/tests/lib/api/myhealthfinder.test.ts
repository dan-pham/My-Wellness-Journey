/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { fetchHealthData, fetchHealthDataById } from "@/lib/api/myhealthfinder";

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("MyHealthFinder API", () => {
	// Reset mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
		mockFetch.mockReset();
	});

	describe("fetchHealthData function", () => {
		it("should make an API call with the correct parameters", async () => {
			// Setup mock response
			const mockResponse = {
				Result: {
					Resources: {
						Resource: [],
					},
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce(mockResponse),
			});

			// Call the function
			await fetchHealthData("diabetes", 5);

			// Check that fetch was called with the right URL and parameters
			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/myhealthfinder?"));
			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("keyword=diabetes"));
			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=5"));
		});

		it("should handle a successful response with multiple resources", async () => {
			// Setup mock response
			const mockResponse = {
				Result: {
					Resources: {
						Resource: [
							{
								Id: "1",
								Title: "Healthy Eating",
								MyHFDescription: "Eat healthy foods",
								Sections: {
									section: [
										{
											Content: "Detailed content about healthy eating",
										},
									],
								},
								AccessibleVersion: "https://example.com/healthy-eating",
								ImageUrl: "https://example.com/image1.jpg",
							},
							{
								Id: "2",
								Title: "Exercise Regularly",
								MyHFDescription: "Stay active",
								Sections: {
									section: [
										{
											Content: "Detailed content about exercise",
										},
									],
								},
								HealthfinderUrl: "https://example.com/exercise",
							},
						],
					},
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce(mockResponse),
			});

			// Call the function
			const result = await fetchHealthData("fitness", 2);

			// Check the result
			expect(result).toEqual({
				success: true,
				healthData: [
					{
						id: "1",
						title: "Healthy Eating",
						content: "Detailed content about healthy eating",
						conditions: "fitness",
						source: "health.gov",
						sourceUrl: "https://example.com/healthy-eating",
						imageUrl: "https://example.com/image1.jpg",
					},
					{
						id: "2",
						title: "Exercise Regularly",
						content: "Detailed content about exercise",
						conditions: "fitness",
						source: "health.gov",
						sourceUrl: "https://example.com/exercise",
						imageUrl: null,
					},
				],
			});
		});

		it("should handle a single resource response", async () => {
			// Setup mock response with a single resource (not in an array)
			const mockResponse = {
				Result: {
					Resources: {
						Resource: {
							Id: "1",
							Title: "Healthy Eating",
							MyHFDescription: "Eat healthy foods",
							Sections: {
								section: [
									{
										Content: "Detailed content about healthy eating",
									},
								],
							},
							AccessibleVersion: "https://example.com/healthy-eating",
						},
					},
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce(mockResponse),
			});

			// Call the function
			const result = await fetchHealthData("nutrition");

			// Check the result
			expect(result.healthData).toHaveLength(1);
			expect(result.healthData[0].title).toBe("Healthy Eating");
		});

		it("should handle API errors gracefully", async () => {
			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Setup mock error response
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			// Call the function
			const result = await fetchHealthData("test");

			// Check the result
			expect(result).toEqual({
				success: false,
				healthData: [],
			});

			// Restore the original implementations
			console.error = originalConsoleError;
		});
	});

	describe("fetchHealthDataById function", () => {
		it("should fetch and return health data for a specific ID", async () => {
			// Setup mock response
			const mockResponse = {
				Result: {
					Resources: {
						Resource: {
							Id: "123",
							Title: "Test Resource",
							MyHFDescription: "Test description",
							Sections: {
								section: [
									{
										Content: "Detailed content",
									},
								],
							},
							AccessibleVersion: "https://example.com/resource/123",
							ImageUrl: "https://example.com/images/test.jpg",
						},
					},
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce(mockResponse),
			});

			// Call the function
			const result = await fetchHealthDataById("123");

			// Check the result
			expect(result).toEqual({
				id: "123",
				title: "Test Resource",
				content: "Detailed content",
				conditions: ["general"],
				source: "health.gov",
				sourceUrl: "https://example.com/resource/123",
				imageUrl: "https://example.com/images/test.jpg",
			});
			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/myhealthfinder/123"));
		});

		it("should handle non-existent resource", async () => {
			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Setup mock response for non-existent resource
			const mockResponse = {
				Result: {
					Resources: {},
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValueOnce(mockResponse),
			});

			// Call the function
			const result = await fetchHealthDataById("nonexistent");

			// Check the result
			expect(result).toBeNull();

			// Restore the original implementations
			console.error = originalConsoleError;
		});

		it("should handle API errors", async () => {
			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Setup mock error response
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			// Call the function
			const result = await fetchHealthDataById("error");

			// Check the result
			expect(result).toBeNull();

			// Restore the original implementations
			console.error = originalConsoleError;
		});
	});
});

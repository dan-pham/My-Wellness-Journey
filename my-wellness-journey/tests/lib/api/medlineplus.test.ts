/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { searchMedlinePlus, getHealthTopicDetails } from "@/lib/api/medlineplus";
import { xml2js } from "xml-js";

// Mock the xml-js module
jest.mock("xml-js", () => ({
	xml2js: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("MedlinePlus API", () => {
	// Reset mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
		(fetch as jest.Mock).mockReset();
	});

	describe("searchMedlinePlus function", () => {
		it("should return empty results when no query is provided", async () => {
			const result = await searchMedlinePlus("");
			expect(result).toEqual({ total: 0, results: [] });
			expect(fetch).not.toHaveBeenCalled();
		});

		it("should make an API call with the correct parameters", async () => {
			// Setup mock response
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce("<xml>Test XML</xml>"),
			});

			(xml2js as jest.Mock).mockReturnValueOnce({
				nlmSearchResult: {
					list: {
						document: [],
					},
				},
			});

			// Call the function
			await searchMedlinePlus("diabetes", 5);

			// Check that fetch was called with the right URL and parameters
			expect(fetch).toHaveBeenCalledWith(
				"https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=diabetes&retmax=5"
			);
		});

		it("should parse XML response and return formatted results", async () => {
			// Setup mock response
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce("<xml>Test XML</xml>"),
			});

			// Mock the parsed XML result
			(xml2js as jest.Mock).mockReturnValueOnce({
				nlmSearchResult: {
					list: {
						document: [
							{
								_attributes: {
									url: "https://medlineplus.gov/test1",
								},
								content: [
									{
										_attributes: { name: "title" },
										_text: "Test Title 1",
									},
									{
										_attributes: { name: "snippet" },
										_text: "Test Snippet 1",
									},
								],
							},
							{
								_attributes: {
									url: "https://medlineplus.gov/test2",
								},
								content: [
									{
										_attributes: { name: "title" },
										_text: "Test Title 2",
									},
									{
										_attributes: { name: "snippet" },
										_text: "Test Snippet 2",
									},
								],
							},
						],
					},
				},
			});

			// Call the function
			const result = await searchMedlinePlus("test", 10);

			// Check the result
			expect(result).toEqual({
				total: 2,
				results: [
					{
						title: "Test Title 1",
						url: "https://medlineplus.gov/test1",
						snippet: "Test Snippet 1",
					},
					{
						title: "Test Title 2",
						url: "https://medlineplus.gov/test2",
						snippet: "Test Snippet 2",
					},
				],
			});
		});

		it("should handle single document result", async () => {
			// Setup mock response
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce("<xml>Test XML</xml>"),
			});

			// Mock the parsed XML result with a single document
			(xml2js as jest.Mock).mockReturnValueOnce({
				nlmSearchResult: {
					list: {
						document: {
							_attributes: {
								url: "https://medlineplus.gov/single",
							},
							content: [
								{
									_attributes: { name: "title" },
									_text: "Single Title",
								},
								{
									_attributes: { name: "snippet" },
									_text: "Single Snippet",
								},
							],
						},
					},
				},
			});

			// Call the function
			const result = await searchMedlinePlus("test", 1);

			// Check the result
			expect(result).toEqual({
				total: 1,
				results: [
					{
						title: "Single Title",
						url: "https://medlineplus.gov/single",
						snippet: "Single Snippet",
					},
				],
			});
		});

		it("should handle HTML tags in content", async () => {
			// Setup mock response
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce("<xml>Test XML</xml>"),
			});

			// Mock the parsed XML result with HTML in the fields
			(xml2js as jest.Mock).mockReturnValueOnce({
				nlmSearchResult: {
					list: {
						document: {
							_attributes: {
								url: "https://medlineplus.gov/html",
							},
							content: [
								{
									_attributes: { name: "title" },
									_text: "<b>HTML</b> Title",
								},
								{
									_attributes: { name: "snippet" },
									_text: "Snippet with <span class='highlight'>highlighted</span> text",
								},
							],
						},
					},
				},
			});

			// Call the function
			const result = await searchMedlinePlus("html");

			// Check the result
			expect(result.results[0].title).toBe("HTML Title");
			expect(result.results[0].snippet).toBe("Snippet with highlighted text");
		});

		it("should handle API errors", async () => {
			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Setup mock response for a failed request
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			// Call the function and expect it to throw
			await expect(searchMedlinePlus("error")).rejects.toThrow("MedlinePlus API error: 404");

			// Restore console.error
			console.error = originalConsoleError;
		});

		it("should handle parsing errors and empty responses", async () => {
			// Temporarily suppress console.warn for this test
			const originalConsoleWarn = console.warn;
			console.warn = jest.fn();

			// Setup mock for successful fetch but invalid XML
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce("<invalid>"),
			});

			// Mock the parser to return invalid data
			(xml2js as jest.Mock).mockReturnValueOnce({});

			// Call the function - should still return empty results without throwing
			const result = await searchMedlinePlus("invalid");
			expect(result).toEqual({ total: 0, results: [] });

			// Restore console.warn
			console.warn = originalConsoleWarn;
		});
	});

	describe("getHealthTopicDetails function", () => {
		it("should extract JSON-LD from page if available", async () => {
			const mockJsonLd = {
				"@context": "https://schema.org",
				"@type": "MedicalWebPage",
				headline: "Diabetes",
				description: "Information about diabetes",
			};

			const mockHtml = `
				<html>
					<head>
						<title>Diabetes</title>
						<script type="application/ld+json">
						${JSON.stringify(mockJsonLd)}
						</script>
					</head>
				</html>
			`;

			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce(mockHtml),
			});

			const result = await getHealthTopicDetails("https://medlineplus.gov/diabetes.html");
			expect(result).toEqual(mockJsonLd);
		});

		it("should return basic info if JSON-LD is not available", async () => {
			const mockHtml = `
				<html>
					<head>
						<title>Diabetes</title>
					</head>
				</html>
			`;

			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce(mockHtml),
			});

			const result = await getHealthTopicDetails("https://medlineplus.gov/diabetes.html");
			expect(result).toEqual({
				url: "https://medlineplus.gov/diabetes.html",
				title: "Diabetes",
			});
		});

		it("should handle fetch errors", async () => {
			// Temporarily suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			await expect(getHealthTopicDetails("https://medlineplus.gov/error")).rejects.toThrow(
				"Failed to fetch resource: 500"
			);

			// Restore console.error
			console.error = originalConsoleError;
		});
	});
});

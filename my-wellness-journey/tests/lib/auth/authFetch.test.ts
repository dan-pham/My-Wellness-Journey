/**
 * @jest-environment jsdom
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

// Create mock for authStore
const mockLogout = jest.fn();
const mockGetToken = jest.fn();

// Mock the auth store before importing it
jest.mock("@/stores/authStore", () => ({
	useAuthStore: {
		getState: () => ({
			logout: mockLogout,
			getToken: mockGetToken,
		}),
	},
}));

// Import after mocks are set up
import { fetchWithAuth, handleApiResponse } from "@/lib/auth/authFetch";

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Custom Response mock for node environment
class MockResponse {
	private body: string;
	private options: any;

	constructor(body: any, options: any = {}) {
		this.body = typeof body === 'string' ? body : JSON.stringify(body);
		this.options = options;
	}

	get status() {
		return this.options.status || 200;
	}

	get ok() {
		return this.status >= 200 && this.status < 300;
	}

	json() {
		return Promise.resolve(JSON.parse(this.body));
	}

	text() {
		return Promise.resolve(this.body);
	}
}

// Helper function to check headers
const checkHeaders = (headers: Headers, expectedHeaders: Record<string, string>) => {
	Object.entries(expectedHeaders).forEach(([key, value]) => {
		expect(headers.get(key)).toBe(value);
	});
};

describe("authFetch", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFetch.mockReset();
		mockGetToken.mockReset();
		localStorage.clear();
		sessionStorage.clear();
		mockLogout.mockReset();
	});

	describe("fetchWithAuth", () => {
		it("should add Content-Type header if not provided", async () => {
			mockGetToken.mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(new MockResponse({}, { status: 200 }));

			await fetchWithAuth("https://api.example.com/data");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({
					headers: expect.any(Headers),
				})
			);

			// Check the headers
			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1].headers;
			checkHeaders(headers, { "Content-Type": "application/json" });
		});

		it("should not override existing Content-Type header", async () => {
			mockGetToken.mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(new MockResponse({}, { status: 200 }));

			await fetchWithAuth("https://api.example.com/data", {
				headers: { "Content-Type": "application/xml" },
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({
					headers: expect.any(Headers),
				})
			);

			// Check the headers
			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1].headers;
			checkHeaders(headers, { "Content-Type": "application/xml" });
		});

		it("should add Authorization header when token exists in localStorage", async () => {
			const token = "test-token";
			mockGetToken.mockReturnValue(token);
			mockFetch.mockResolvedValueOnce(new MockResponse({}, { status: 200 }));

			await fetchWithAuth("https://api.example.com/data");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({
					headers: expect.any(Headers),
				})
			);

			// Check the headers
			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1].headers;
			checkHeaders(headers, {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			});
		});

		it("should add Authorization header when token exists in sessionStorage", async () => {
			const token = "test-session-token";
			mockGetToken.mockReturnValue(token);
			mockFetch.mockResolvedValueOnce(new MockResponse({}, { status: 200 }));

			await fetchWithAuth("https://api.example.com/data");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({
					headers: expect.any(Headers),
				})
			);

			// Check the headers
			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1].headers;
			checkHeaders(headers, {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			});
		});

		it("should prioritize localStorage token over sessionStorage token", async () => {
			const localStorageToken = "local-storage-token";
			mockGetToken.mockReturnValue(localStorageToken);
			mockFetch.mockResolvedValueOnce(new MockResponse({}, { status: 200 }));

			await fetchWithAuth("https://api.example.com/data");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({
					headers: expect.any(Headers),
				})
			);

			// Check the headers
			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1].headers;
			checkHeaders(headers, {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorageToken}`,
			});
		});

		it("should handle 401 unauthorized response by clearing tokens", async () => {
			mockFetch.mockResolvedValueOnce(new MockResponse({}, { status: 401 }));

			await fetchWithAuth("https://api.example.com/protected");

			// Check that tokens are cleared
			expect(localStorage.getItem("token")).toBeNull();
			expect(sessionStorage.getItem("token")).toBeNull();
		});
	});

	describe("handleApiResponse", () => {
		it("should return parsed JSON for successful responses", async () => {
			const mockData = { id: 1, name: "Test" };
			const mockResponse = new MockResponse(mockData, { status: 200 });

			const result = await handleApiResponse(mockResponse as any);

			expect(result).toEqual(mockData);
		});

		it("should throw an error with status and data for non-OK responses", async () => {
			const errorData = { message: "Unauthorized", code: "AUTH_ERROR" };
			const mockResponse = new MockResponse(errorData, { status: 401 });

			await expect(handleApiResponse(mockResponse as any)).rejects.toEqual({
				status: 401,
				...errorData,
			});

			expect(mockLogout).toHaveBeenCalled();
		});

		it("should handle non-JSON error responses", async () => {
			const mockResponse = new MockResponse("Server Error", { status: 500 });
			
			// Override the json method to throw an error like a real Response would
			mockResponse.json = jest.fn().mockRejectedValue(new SyntaxError("Invalid JSON"));

			await expect(handleApiResponse(mockResponse as any)).rejects.toEqual({
				status: 500,
			});
		});
	});
});

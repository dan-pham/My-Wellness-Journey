/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware } from "@/lib/apiHandler";

// Mock the CORS middleware
jest.mock("@/lib/cors", () => ({
	runCorsMiddleware: jest.fn().mockResolvedValue(undefined),
}));

// Import the mock to access it in tests
import { runCorsMiddleware } from "@/lib/cors";

describe("apiHandler", () => {
	// Reset all mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Helper to create mock request
	const createMockRequest = () => {
		return {
			headers: new Headers(),
			ip: "127.0.0.1",
			nextUrl: { pathname: "/api/test" },
		} as unknown as NextRequest;
	};

	// Helper to create a mock context
	const createMockContext = (params = {}) => ({
		params: params as Record<string, string | string[]>,
	});

	describe("withApiMiddleware", () => {
		it("should call the handler function with the request and context", async () => {
			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler
			const wrappedHandler = withApiMiddleware(mockHandler);

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			await wrappedHandler(mockRequest, mockContext);

			// Verify the handler was called with request and context
			expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockContext);
		});

		it("should apply CORS middleware by default", async () => {
			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler
			const wrappedHandler = withApiMiddleware(mockHandler);

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			await wrappedHandler(mockRequest, mockContext);

			// Verify CORS middleware was called
			expect(runCorsMiddleware).toHaveBeenCalled();
		});

		it("should skip CORS middleware when enableCors is false", async () => {
			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler with CORS disabled
			const wrappedHandler = withApiMiddleware(mockHandler, { enableCors: false });

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			await wrappedHandler(mockRequest, mockContext);

			// Verify CORS middleware was not called
			expect(runCorsMiddleware).not.toHaveBeenCalled();
		});

		it("should apply rate limiting if a rate limiter is provided", async () => {
			// Create a mock rate limiter that allows the request
			const mockRateLimiter = jest.fn().mockResolvedValue(null);

			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler with rate limiter
			const wrappedHandler = withApiMiddleware(mockHandler, {
				rateLimiter: mockRateLimiter,
			});

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			await wrappedHandler(mockRequest, mockContext);

			// Verify rate limiter was called
			expect(mockRateLimiter).toHaveBeenCalledWith(mockRequest);
			// Verify handler was called (since rate limit allowed the request)
			expect(mockHandler).toHaveBeenCalled();
		});

		it("should return rate limiter response when rate limit is exceeded", async () => {
			// Create a mock rate limiter that blocks the request
			const mockRateLimitResponse = NextResponse.json(
				{ error: "Rate limit exceeded" },
				{ status: 429 }
			);

			const mockRateLimiter = jest.fn().mockResolvedValue(mockRateLimitResponse);

			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler with rate limiter
			const wrappedHandler = withApiMiddleware(mockHandler, {
				rateLimiter: mockRateLimiter,
			});

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			const response = await wrappedHandler(mockRequest, mockContext);

			// Verify rate limiter was called
			expect(mockRateLimiter).toHaveBeenCalledWith(mockRequest);
			// Verify handler was not called
			expect(mockHandler).not.toHaveBeenCalled();
			// Verify the rate limit response was returned
			expect(response.status).toBe(429);
			// Verify the response body
			const responseBody = await response.json();
			expect(responseBody).toEqual({ error: "Rate limit exceeded" });
		});

		it("should add CORS headers to rate limit responses", async () => {
			// Prepare a mock next response with CORS headers
			const mockNextResponse = NextResponse.next();
			mockNextResponse.headers.set("access-control-allow-origin", "*");
			mockNextResponse.headers.set("access-control-allow-methods", "GET,POST");

			// Simulate runCorsMiddleware adding headers to the response
			(runCorsMiddleware as jest.Mock).mockImplementationOnce(
				(_req: NextRequest, res: NextResponse) => {
					res.headers.set("access-control-allow-origin", "*");
					res.headers.set("access-control-allow-methods", "GET,POST");
					return Promise.resolve();
				}
			);

			// Create a mock rate limiter that blocks the request
			const mockRateLimitResponse = NextResponse.json(
				{ error: "Rate limit exceeded" },
				{ status: 429 }
			);

			const mockRateLimiter = jest.fn().mockResolvedValue(mockRateLimitResponse);

			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler with rate limiter
			const wrappedHandler = withApiMiddleware(mockHandler, {
				rateLimiter: mockRateLimiter,
			});

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			const response = await wrappedHandler(mockRequest, mockContext);

			// Verify CORS headers were added to the rate limit response
			expect(response.headers.get("access-control-allow-origin")).toBe("*");
			expect(response.headers.get("access-control-allow-methods")).toBe("GET,POST");
		});

		it("should add CORS headers to the handler response", async () => {
			// Prepare a mock next response with CORS headers
			const mockNextResponse = NextResponse.next();
			mockNextResponse.headers.set("access-control-allow-origin", "*");
			mockNextResponse.headers.set("access-control-allow-methods", "GET,POST");

			// Simulate runCorsMiddleware adding headers to the response
			(runCorsMiddleware as jest.Mock).mockImplementationOnce(
				(_req: NextRequest, res: NextResponse) => {
					res.headers.set("access-control-allow-origin", "*");
					res.headers.set("access-control-allow-methods", "GET,POST");
					return Promise.resolve();
				}
			);

			// Create a mock handler function
			const mockHandlerResponse = NextResponse.json({ success: true });
			const mockHandler = jest.fn().mockResolvedValue(mockHandlerResponse);

			// Apply middleware to the handler
			const wrappedHandler = withApiMiddleware(mockHandler);

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			const response = await wrappedHandler(mockRequest, mockContext);

			// Verify CORS headers were added to the handler response
			expect(response.headers.get("access-control-allow-origin")).toBe("*");
			expect(response.headers.get("access-control-allow-methods")).toBe("GET,POST");
		});

		it("should handle and format errors thrown by the handler", async () => {
			// Create a mock console.error to capture logs
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Create a mock handler that throws an error
			const mockError = new Error("Test error message");
			const mockHandler = jest.fn().mockImplementation(() => {
				throw mockError;
			});

			// Apply middleware to the handler
			const wrappedHandler = withApiMiddleware(mockHandler);

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			const response = await wrappedHandler(mockRequest, mockContext);

			// Verify the response status is 500
			expect(response.status).toBe(500);

			// Verify the error message contains the actual error in test environment
			const responseBody = await response.json();
			expect(responseBody.error).toBe("Error: Test error message");

			// Verify error was logged
			expect(console.error).toHaveBeenCalled();

			// Restore console.error
			console.error = originalConsoleError;
		});

		it("should handle non-Error objects thrown by the handler", async () => {
			// Create a mock console.error to capture logs
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Create a mock handler that throws a non-Error object
			const mockHandler = jest.fn().mockImplementation(() => {
				throw "String error";
			});

			// Apply middleware to the handler
			const wrappedHandler = withApiMiddleware(mockHandler);

			// Create mock request and context
			const mockRequest = createMockRequest();
			const mockContext = createMockContext();

			// Call the wrapped handler
			const response = await wrappedHandler(mockRequest, mockContext);

			// Verify the response status is 500
			expect(response.status).toBe(500);

			// Verify the error message is generic for non-Error objects
			const responseBody = await response.json();
			expect(responseBody.error).toBe("Error: Unknown error");

			// Verify error was logged
			expect(console.error).toHaveBeenCalled();

			// Restore console.error
			console.error = originalConsoleError;
		});

		it("should pass params from the context to the handler", async () => {
			// Create a mock handler function
			const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

			// Apply middleware to the handler
			const wrappedHandler = withApiMiddleware(mockHandler);

			// Create mock request and context with params
			const mockRequest = createMockRequest();
			const mockParams = { id: "123", slug: ["test", "path"] };
			const mockContext = createMockContext(mockParams);

			// Call the wrapped handler
			await wrappedHandler(mockRequest, mockContext);

			// Verify the handler was called with the params
			expect(mockHandler).toHaveBeenCalledWith(
				mockRequest,
				expect.objectContaining({
					params: mockParams,
				})
			);
		});
	});
});

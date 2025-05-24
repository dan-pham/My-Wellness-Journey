/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

jest.mock("cors", () => {
	return jest.fn(() => {
		// @ts-ignore - Ignoring TypeScript checking on dynamic parameters
		return (req, res, next) => {
			// Add CORS headers based on the request
			const origin = req.headers.origin;
			if (origin) {
				res.setHeader("access-control-allow-origin", origin);
			}

			// Set allowed methods
			res.setHeader("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");

			// Set allowed headers
			res.setHeader("access-control-allow-headers", "Content-Type, Authorization");

			// Set credentials flag
			res.setHeader("access-control-allow-credentials", "true");

			// Set max age
			res.setHeader("access-control-max-age", "86400");

			// Call next to indicate CORS has been applied
			next();
		};
	});
});

import { NextRequest, NextResponse } from "next/server";
import { runCorsMiddleware } from "@/lib/cors";

describe("CORS Middleware", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the cors mock for each test
		const corsMock = jest.requireMock("cors");
		corsMock.mockClear();
	});

	it("should apply CORS headers to NextResponse", async () => {
		// Create a mock request and response
		const mockRequest = {
			method: "GET",
			headers: new Headers({
				origin: "http://localhost:3000",
			}),
		} as unknown as NextRequest;

		const mockResponse = NextResponse.next();

		// Apply CORS
		await runCorsMiddleware(mockRequest, mockResponse);

		// Verify headers were applied
		expect(mockResponse.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
		expect(mockResponse.headers.get("access-control-allow-methods")).toBe(
			"GET,POST,PUT,DELETE,OPTIONS"
		);
		expect(mockResponse.headers.get("access-control-allow-headers")).toBe(
			"Content-Type, Authorization"
		);
		expect(mockResponse.headers.get("access-control-allow-credentials")).toBe("true");
		expect(mockResponse.headers.get("access-control-max-age")).toBe("86400");
	});

	it("should handle different request methods", async () => {
		// Create test cases for different methods
		const methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

		for (const method of methods) {
			// Create a mock request with the current method
			const mockRequest = {
				method,
				headers: new Headers({
					origin: "http://localhost:3000",
				}),
			} as unknown as NextRequest;

			const mockResponse = NextResponse.next();

			// Apply CORS
			await runCorsMiddleware(mockRequest, mockResponse);

			// Verify headers were applied correctly for each method
			expect(mockResponse.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
			expect(mockResponse.headers.get("access-control-allow-methods")).toContain(method);
		}
	});

	it("should handle requests with no origin header", async () => {
		// Create a mock request with no origin
		const mockRequest = {
			method: "GET",
			headers: new Headers(),
		} as unknown as NextRequest;

		const mockResponse = NextResponse.next();

		// Apply CORS
		await runCorsMiddleware(mockRequest, mockResponse);

		// Verify method headers were still set
		expect(mockResponse.headers.get("access-control-allow-methods")).toBe(
			"GET,POST,PUT,DELETE,OPTIONS"
		);
		expect(mockResponse.headers.get("access-control-allow-headers")).toBe(
			"Content-Type, Authorization"
		);
	});

	it("should correctly process headers from NextRequest", async () => {
		// Create a mock request with multiple custom headers
		const mockRequest = {
			method: "GET",
			headers: new Headers({
				origin: "http://localhost:3000",
				"content-type": "application/json",
				authorization: "Bearer token123",
				"x-custom-header": "custom-value",
			}),
		} as unknown as NextRequest;

		const mockResponse = NextResponse.next();

		// Apply CORS
		await runCorsMiddleware(mockRequest, mockResponse);

		expect(mockResponse.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
	});
});

/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { authenticate } from "@/middleware/auth";

// Mock jwt
jest.mock("jsonwebtoken", () => ({
	verify: jest.fn(),
}));

// Mock environment variable
process.env.JWT_SECRET = "test-jwt-secret";

describe("Auth Middleware", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Helper to create a mock request with cookies
	function createMockRequest(authToken?: string) {
		return {
			cookies: {
				get: jest.fn().mockImplementation((name) => {
					if (name === "auth_token" && authToken) {
						return { value: authToken };
					}
					return undefined;
				}),
			},
		} as unknown as NextRequest;
	}

	it("should return userId when token is valid", async () => {
		// Setup valid token and decoded value
		const token = "valid-token";
		const decodedValue = { id: "user123" };

		// Mock jwt.verify to return a decoded value
		(jwt.verify as jest.Mock).mockReturnValueOnce(decodedValue);

		// Create request with token
		const req = createMockRequest(token);

		// Call middleware
		const result = await authenticate(req);

		// Assert that jwt.verify was called with the right arguments
		expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);

		// Assert the result contains the user ID
		expect(result).toEqual({ userId: "user123" });
	});

	it("should return 401 when no token is provided", async () => {
		// Create request without token
		const req = createMockRequest();

		// Call middleware
		const result = await authenticate(req);

		// Should be a response object with 401 status
		expect(result).toBeInstanceOf(NextResponse);

		// Check the response details
		const response = result as NextResponse;
		expect(response.status).toBe(401);

		// Check the response body
		const body = await response.json();
		expect(body).toEqual({ error: "Authentication required" });
	});

	it("should return 401 when token is invalid", async () => {
		// Setup invalid token
		const token = "invalid-token";

		// Mock jwt.verify to throw an error
		(jwt.verify as jest.Mock).mockImplementationOnce(() => {
			throw new Error("Invalid token");
		});

		// Create request with token
		const req = createMockRequest(token);

		// Call middleware
		const result = await authenticate(req);

		// Should be a response object with 401 status
		expect(result).toBeInstanceOf(NextResponse);

		// Check the response details
		const response = result as NextResponse;
		expect(response.status).toBe(401);

		// Check the response body
		const body = await response.json();
		expect(body).toEqual({ error: "Invalid authentication" });
	});

	it("should return 500 when an unexpected error occurs", async () => {
		// Setup token
		const token = "valid-token";

		// Mock cookies.get to throw an error
		const req = {
			cookies: {
				get: jest.fn().mockImplementation(() => {
					throw new Error("Unexpected error");
				}),
			},
		} as unknown as NextRequest;

		// Call middleware
		const result = await authenticate(req);

		// Should be a response object with 500 status
		expect(result).toBeInstanceOf(NextResponse);

		// Check the response details
		const response = result as NextResponse;
		expect(response.status).toBe(500);

		// Check the response body
		const body = await response.json();
		expect(body).toEqual({ error: "Authentication failed" });
	});
});

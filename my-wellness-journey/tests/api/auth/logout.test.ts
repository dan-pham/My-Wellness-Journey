import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/api/auth/logout/route";
import User from "@/models/user";
import jwt from "jsonwebtoken";
import { authenticate as originalAuthenticate } from "@/middleware/auth";

// Define the type for the authenticate function
type AuthenticateFunction = typeof originalAuthenticate;

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
	authenticate: jest.fn(),
}));

// Simple helper to create a NextRequest with headers
const createRequest = (headers: Record<string, string> = {}) => {
	return {
		headers: {
			get: jest.fn((name: string) => headers[name] || null),
		},
		nextUrl: { pathname: "/api/auth/logout" },
		ip: "127.0.0.1",
	} as unknown as NextRequest;
};

describe("Auth API - Logout", () => {
	let user;
	let token: string;
	let authenticate: jest.MockedFunction<AuthenticateFunction>;

	// Set up a user and token before each test
	beforeEach(async () => {
		// Reset all mocks before each test
		jest.resetAllMocks();

		// Import the mocked function
		({ authenticate } = require("@/middleware/auth"));

		// By default, make authenticate return a successful auth result
		authenticate.mockResolvedValue({ userId: "test-user-id" });

		// Create a test user
		user = await User.create({
			email: "test@example.com",
			password: "password123",
		});

		// Generate a token for this user
		const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
		token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
	});

	// Test 200 success
	it("should logout user successfully", async () => {
		// Create request with auth token
		const req = createRequest({
			authorization: `Bearer ${token}`,
		});

		const response = await POST(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toBeDefined();
	});

	// Test 401 no token
	it("should return 401 when no token is provided", async () => {
		// Mock authenticate to return a 401 response
		authenticate.mockResolvedValue(
			NextResponse.json({ error: "Unauthorized - No valid token provided" }, { status: 401 })
		);

		// Create request with no auth token
		const req = createRequest();

		const response = await POST(req);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBeDefined();
		expect(data.error).toBe("Unauthorized - No valid token provided");
	});

	// Test 401 invalid token format
	it("should return 401 when token format is invalid", async () => {
		// Mock authenticate to return a 401 response
		authenticate.mockResolvedValue(
			NextResponse.json({ error: "Unauthorized - No valid token provided" }, { status: 401 })
		);

		// Create request with invalid token format
		const req = createRequest({
			authorization: "InvalidFormat",
		});

		const response = await POST(req);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBeDefined();
		expect(data.error).toBe("Unauthorized - No valid token provided");
	});

	// Test 500 server error
	it("should return 500 when server error occurs", async () => {
		// Suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Make it throw an error
		authenticate.mockImplementationOnce(() => {
			throw new Error("Database error");
		});

		const req = createRequest({
			authorization: `Bearer ${token}`,
		});

		const response = await POST(req);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBeDefined();
		expect(data.error).toBe("Logout failed");

		// Restore original implementations
		console.error = originalConsoleError;
	});
});

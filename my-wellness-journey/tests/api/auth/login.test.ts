/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Mock the rate limiter
jest.mock("@/middleware/rateLimit", () => ({
	authRateLimiter: jest.fn().mockResolvedValue(null),
}));

// Mock the encryption functions
jest.mock("@/lib/encryption", () => ({
	encrypt: jest.fn((text) => `encrypted:${text}`),
	decrypt: jest.fn((text) => (text.startsWith("encrypted:") ? text.substring(10) : text)),
}));

// Mock the CORS middleware
jest.mock("@/lib/cors", () => ({
	runCorsMiddleware: jest.fn().mockResolvedValue(undefined),
}));

// Simple helper to create a NextRequest
interface LoginRequestBody {
	email: string;
	password: string;
}

const createRequest = (body: LoginRequestBody) => {
	return {
		json: jest.fn().mockResolvedValue(body),
		nextUrl: { pathname: "/api/auth/login" },
		ip: "127.0.0.1",
		headers: {
			get: jest.fn(() => null),
		},
	} as unknown as NextRequest;
};

// Context parameter required by withApiMiddleware
const context = { params: {} };

describe("Auth API - Login", () => {
	beforeEach(async () => {
		// Create a test user before each test
		await User.create({
			email: "test@example.com",
			password: "password123",
		});
	});

	const originalConsoleError = console.error;

	beforeAll(() => {
		// Suppress console.error for this test
		console.error = jest.fn();
	});

	afterAll(() => {
		// Restore console.error
		console.error = originalConsoleError;
	});

	// Test 200 success
	it("should login user with valid credentials", async () => {
		const req = createRequest({
			email: "test@example.com",
			password: "password123",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.token).toBeDefined();
		expect(data.user).toBeDefined();
		expect(data.user.email).toBe("test@example.com");
		expect(data.user.password).toBeUndefined();
	});

	// Test 401 unauthorized - wrong password
	it("should return 401 for incorrect password", async () => {
		const req = createRequest({
			email: "test@example.com",
			password: "wrongpassword",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBeDefined();
		expect(data.error).toBe("Invalid credentials");
	});

	// Test 401 unauthorized - user not found
	it("should return 401 for non-existent user", async () => {
		const req = createRequest({
			email: "nonexistent@example.com",
			password: "password123",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBeDefined();
		expect(data.error).toBe("Invalid credentials");
	});

	// Test 400 validation error - missing email
	it("should return 400 when email is missing", async () => {
		const req = createRequest({
			email: "",
			password: "password123",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.email).toBeDefined();
	});

	// Test 400 validation error - missing password
	it("should return 400 when password is missing", async () => {
		const req = createRequest({
			email: "test@example.com",
			password: "",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.password).toBeDefined();
	});

	// Test 400 validation error - invalid email format
	it("should return 400 when email format is invalid", async () => {
		const req = createRequest({
			email: "not-an-email",
			password: "password123",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.email).toBeDefined();
	});

	// Test 500 server error
	it("should return 500 when server error occurs", async () => {
		// Temporarily suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock a server error by making User.findOne throw an error
		const originalFindOne = User.findOne;
		User.findOne = jest.fn().mockImplementationOnce(() => {
			throw new Error("Database error");
		});

		const req = createRequest({
			email: "test@example.com",
			password: "password123",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBeDefined();

		// Restore the original implementations
		User.findOne = originalFindOne;
		console.error = originalConsoleError;
	});
});

import { NextRequest, NextResponse } from "next/server";
import { PUT } from "@/app/api/auth/password/route";
import User from "@/models/user";
import mongoose from "mongoose";
import { authenticate as originalAuthenticate } from "@/middleware/auth";
import { validateAndSanitizeInput as originalValidateInput } from "@/middleware/validation";

// Define the types for mocked functions
type AuthenticateFunction = typeof originalAuthenticate;
type ValidateInputFunction = typeof originalValidateInput;

interface MockUser {
	_id: string | mongoose.Types.ObjectId;
	comparePassword: jest.Mock;
	save: jest.Mock;
	[key: string]: any; // Allow additional properties
}

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
	authenticate: jest.fn(),
}));

// Mock the validation middleware
jest.mock("@/middleware/validation", () => ({
	validateAndSanitizeInput: jest.fn(),
	isRequired: jest.fn(),
	minLength: jest.fn(),
	passwordStrength: jest.fn(),
}));

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Mock the rate limiter
jest.mock("@/middleware/rateLimit", () => ({
	passwordRateLimiter: jest.fn().mockResolvedValue(null),
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
const createRequest = (body: Record<string, any> = {}) => {
	return {
		headers: {
			get: jest.fn(() => null),
		},
		json: jest.fn().mockResolvedValue(body),
		nextUrl: { pathname: "/api/auth/password" },
		ip: "127.0.0.1",
	} as unknown as NextRequest;
};

// Context parameter required by withApiMiddleware
const context = { params: {} };

describe("Auth API - Update Password", () => {
	let userId: string;
	let authenticate: jest.MockedFunction<AuthenticateFunction>;
	let validateAndSanitizeInput: jest.MockedFunction<ValidateInputFunction>;
	let mockUser: MockUser;

	beforeEach(async () => {
		// Reset all mocks
		jest.resetAllMocks();

		// Import the mocked functions
		({ authenticate } = require("@/middleware/auth"));
		({ validateAndSanitizeInput } = require("@/middleware/validation"));

		// Create a mock user ID
		userId = new mongoose.Types.ObjectId().toString();

		// Create a mock user with working comparePassword
		mockUser = {
			_id: userId,
			comparePassword: jest.fn().mockResolvedValue(true),
			save: jest.fn().mockResolvedValue(true),
			password: "hashedPassword123",
		};

		// Setup default mock behaviors
		authenticate.mockResolvedValue({ userId });

		validateAndSanitizeInput.mockReturnValue(
			jest.fn().mockResolvedValue({
				validated: {
					currentPassword: "password123",
					newPassword: "newPassword123",
				},
			})
		);

		User.findById = jest.fn().mockReturnValue({
			select: jest.fn().mockResolvedValue(mockUser),
		});
	});

	// Test 200 success
	it("should update password successfully", async () => {
		const req = createRequest({
			currentPassword: "password123",
			newPassword: "newPassword123",
		});

		const response = await PUT(req, context);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toBe("Password updated successfully");
	});

	// Test 401 unauthorized
	it("should return 401 when not authenticated", async () => {
		// Mock authenticate to return a 401 response
		authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

		const req = createRequest({
			currentPassword: "password123",
			newPassword: "newPassword123",
		});

		const response = await PUT(req, context);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe("Unauthorized");
	});

	// Test 400 validation error
	it("should return 400 when validation fails", async () => {
		// Mock validation to return a 400 response
		validateAndSanitizeInput.mockReturnValue(
			jest
				.fn()
				.mockResolvedValue(
					NextResponse.json({ errors: { newPassword: ["Password too weak"] } }, { status: 400 })
				)
		);

		const req = createRequest({
			currentPassword: "password123",
			newPassword: "weak",
		});

		const response = await PUT(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
	});

	// Test 400 incorrect current password
	it("should return 400 when current password is incorrect", async () => {
		// Create a new mock user with comparePassword returning false
		const incorrectPasswordUser: MockUser = {
			_id: userId,
			comparePassword: jest.fn().mockResolvedValue(false),
			save: jest.fn().mockResolvedValue(true),
		};

		// Override the default mock for this test only
		User.findById = jest.fn().mockReturnValue({
			select: jest.fn().mockResolvedValue(incorrectPasswordUser),
		});

		const req = createRequest({
			currentPassword: "wrongPassword",
			newPassword: "newPassword123",
		});

		const response = await PUT(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Current password is incorrect");
	});

	// Test 404 user not found
	it("should return 404 when user is not found", async () => {
		// Mock findById to return null
		User.findById = jest.fn().mockReturnValue({
			select: jest.fn().mockResolvedValue(null),
		});

		const req = createRequest({
			currentPassword: "password123",
			newPassword: "newPassword123",
		});

		const response = await PUT(req, context);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("User not found");
	});

	// Test 500 server error
	it("should return 500 when server error occurs", async () => {
		// Suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock User.findById to throw an error
		jest.spyOn(User, "findById").mockImplementation(() => {
			throw new Error("Database error");
		});

		const req = createRequest({
			currentPassword: "password123",
			newPassword: "newPassword123",
		});

		const response = await PUT(req, context);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to change password");

		// Restore console.error
		console.error = originalConsoleError;
	});
});

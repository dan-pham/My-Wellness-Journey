import { NextRequest, NextResponse } from "next/server";
import { DELETE } from "@/app/api/user/delete/route";
import User from "@/models/user";
import mongoose from "mongoose";
import { authenticate as originalAuthenticate } from "@/middleware/auth";
import { validateAndSanitizeInput as originalValidateInput } from "@/middleware/validation";

type AuthenticateFunction = typeof originalAuthenticate;
type ValidateInputFunction = typeof originalValidateInput;

interface MockUser {
	_id: string | mongoose.Types.ObjectId;
	password?: string;
	comparePassword?: jest.Mock;
	[key: string]: any; // Allow additional properties
}

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
	authenticate: jest.fn(),
}));

// Mock the validation middleware
jest.mock("@/middleware/validation", () => ({
	validateInput: jest.fn(),
	isRequired: jest.fn(),
}));

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Simple helper to create a NextRequest
const createRequest = (body: Record<string, any> = {}) => {
	return {
		headers: {
			get: jest.fn(() => null),
		},
		json: jest.fn().mockResolvedValue(body),
	} as unknown as NextRequest;
};

describe("User API - Delete Account", () => {
	let userId: string;
	let authenticate: jest.MockedFunction<AuthenticateFunction>;
	let validateInput: jest.MockedFunction<ValidateInputFunction>;
	let mockUser: MockUser;

	beforeEach(async () => {
		// Reset all mocks
		jest.resetAllMocks();

		// Import the mocked functions
		({ authenticate } = require("@/middleware/auth"));
		({ validateInput } = require("@/middleware/validation"));

		// Create a mock user ID
		userId = new mongoose.Types.ObjectId().toString();

		// Create a properly typed mock user
		mockUser = {
			_id: userId,
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "hashedPassword123",
			comparePassword: jest.fn().mockResolvedValue(true),
		};

		// Setup default mock behaviors
		authenticate.mockResolvedValue({ userId });

		// Mock validateInput to return a function that returns a valid result
		validateInput.mockReturnValue(
			jest.fn().mockResolvedValue({
				validated: {
					password: "password123",
				},
			})
		);

		// Mock User.findById
		User.findById = jest.fn().mockReturnValue({
			select: jest.fn().mockResolvedValue(mockUser),
		});

		// Mock User.findByIdAndDelete
		User.findByIdAndDelete = jest.fn().mockResolvedValue(true);
	});

	// Test 200 success
	it("should delete user account successfully", async () => {
		const req = createRequest({
			password: "password123",
		});

		const response = await DELETE(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toBe("User account deleted successfully");

		// Verify User.findById was called with the correct ID
		expect(User.findById).toHaveBeenCalledWith(userId);

		// Verify User.findByIdAndDelete was called with the correct ID
		expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId);
	});

	// Test 401 unauthorized
	it("should return 401 when not authenticated", async () => {
		// Mock authenticate to return a 401 response
		authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

		const req = createRequest({
			password: "password123",
		});

		const response = await DELETE(req);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe("Unauthorized");

		// Verify User.findByIdAndDelete was NOT called
		expect(User.findByIdAndDelete).not.toHaveBeenCalled();
	});

	// Test 400 validation error
	it("should return 400 when password is not provided", async () => {
		// Mock validation to return a 400 response
		validateInput.mockReturnValue(
			jest
				.fn()
				.mockResolvedValue(
					NextResponse.json({ errors: { password: ["Password is required"] } }, { status: 400 })
				)
		);

		const req = createRequest({
			// No password provided
		});

		const response = await DELETE(req);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.password).toBeDefined();

		// Verify User.findByIdAndDelete was NOT called
		expect(User.findByIdAndDelete).not.toHaveBeenCalled();
	});

	// Test 404 user not found
	it("should return 404 when user is not found", async () => {
		// Mock User.findById to return null
		User.findById = jest.fn().mockReturnValue({
			select: jest.fn().mockResolvedValue(null),
		});

		const req = createRequest({
			password: "password123",
		});

		const response = await DELETE(req);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe("User not found");

		// Verify User.findByIdAndDelete was NOT called
		expect(User.findByIdAndDelete).not.toHaveBeenCalled();
	});

	// Test 500 server error during findById
	it("should return 500 when error occurs during user lookup", async () => {
		// Suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock User.findById to throw an error
		User.findById = jest.fn().mockImplementation(() => {
			throw new Error("Database error");
		});

		const req = createRequest({
			password: "password123",
		});

		const response = await DELETE(req);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to delete user account");

		// Verify User.findByIdAndDelete was NOT called
		expect(User.findByIdAndDelete).not.toHaveBeenCalled();

		// Restore console.error
		console.error = originalConsoleError;
	});

	// Test 500 server error during delete
	it("should return 500 when error occurs during account deletion", async () => {
		// Suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Setup successful user lookup but failed deletion
		User.findByIdAndDelete = jest.fn().mockImplementation(() => {
			throw new Error("Deletion error");
		});

		const req = createRequest({
			password: "password123",
		});

		const response = await DELETE(req);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to delete user account");

		// Restore console.error
		console.error = originalConsoleError;
	});
});

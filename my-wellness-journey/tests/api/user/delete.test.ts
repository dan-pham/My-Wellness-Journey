import { NextRequest, NextResponse } from "next/server";
import { DELETE } from "@/app/api/user/delete/route";
import User from "@/models/user";
import Profile from "@/models/profile";
import mongoose from "mongoose";
import { authenticate as originalAuthenticate } from "@/middleware/auth";
import {
	validateAndSanitizeInput as originalValidateInput,
	ValidationSchema,
} from "@/middleware/validation";

type AuthenticateFunction = typeof originalAuthenticate;
type ValidateInputFunction = typeof originalValidateInput;

interface MockUser {
	_id: string | mongoose.Types.ObjectId;
	password: string;
	comparePassword: jest.Mock;
	[key: string]: any; // Allow additional properties
}

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
	authenticate: jest.fn(),
}));

// Mock the validation middleware
jest.mock("@/middleware/validation", () => ({
	validateAndSanitizeInput: jest.fn((schema: ValidationSchema) => async (req: NextRequest) => ({
		validated: { password: "password123" },
	})),
	isRequired: jest.fn(),
}));

// Mock the database connection
jest.mock("@/lib/db/connection", () => ({
	ensureConnection: jest.fn(),
}));

// Simple helper to create a NextRequest
const createRequest = (body: Record<string, any> = {}) => {
	const url = new URL("http://localhost:3000/api/user/delete");
	return new NextRequest(url, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
};

describe("User API - Delete Account", () => {
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

		// Mock validateAndSanitizeInput to return a function that returns a valid result
		validateAndSanitizeInput.mockImplementation(
			(schema: ValidationSchema) => async (req: NextRequest) => ({
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

		// Mock Profile.findOneAndDelete
		Profile.findOneAndDelete = jest.fn().mockResolvedValue(true);
	});

	// Test 200 success
	it("should delete user account successfully", async () => {
		const req = createRequest({
			password: "password123",
		});

		const response = await DELETE(req, { params: {} });
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

		const response = await DELETE(req, { params: {} });
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe("Unauthorized");

		// Verify User.findByIdAndDelete was NOT called
		expect(User.findByIdAndDelete).not.toHaveBeenCalled();
	});

	// Test 400 validation error
	it("should return 400 when password is not provided", async () => {
		// Mock validation to return a 400 response
		validateAndSanitizeInput.mockImplementation(
			(schema: ValidationSchema) => async (req: NextRequest) =>
				NextResponse.json({ errors: { password: ["Password is required"] } }, { status: 400 })
		);

		const req = createRequest({});

		const response = await DELETE(req, { params: {} });
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

		const response = await DELETE(req, { params: {} });
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

		const response = await DELETE(req, { params: {} });
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

		const response = await DELETE(req, { params: {} });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe("Failed to delete user account");

		// Restore console.error
		console.error = originalConsoleError;
	});

	// Test 401 when password is incorrect
	it("should return 401 when password is incorrect", async () => {
		// Mock comparePassword to return false (incorrect password)
		mockUser.comparePassword.mockResolvedValue(false);

		const req = createRequest({
			password: "wrongPassword123",
		});

		const response = await DELETE(req, { params: {} });
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe("Invalid password");

		// Verify the account was NOT deleted
		expect(User.findByIdAndDelete).not.toHaveBeenCalled();
		expect(Profile.findOneAndDelete).not.toHaveBeenCalled();
	});
});

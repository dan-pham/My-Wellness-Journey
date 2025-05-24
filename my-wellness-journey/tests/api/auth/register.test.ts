import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import User from "@/models/user";
import Profile from "@/models/profile";
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
interface RegisterRequestBody {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

const createRequest = (body: RegisterRequestBody) => {
	return {
		json: jest.fn().mockResolvedValue(body),
		nextUrl: { pathname: "/api/auth/register" },
		ip: "127.0.0.1",
		headers: {
			get: jest.fn(() => null),
		},
	} as unknown as NextRequest;
};

// Context parameter required by withApiMiddleware
const context = { params: {} };

describe("Auth API - Register", () => {
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
	it("should register a new user successfully", async () => {
		const req = createRequest({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			password: "Password123!",
		});

		try {
			const response = await POST(req, context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.user).toBeDefined();
			expect(data.user.email).toBe("john@example.com");
			expect(data.user.profile).toBeDefined();
			expect(data.user.profile.firstName).toBe("John");
			expect(data.user.profile.lastName).toBe("Doe");

			// Password should not be returned
			expect(data.user.password).toBeUndefined();

			// Verify user was saved to database
			const savedUser = await User.findOne({ email: "john@example.com" });

			expect(savedUser).not.toBeNull();
			expect(savedUser.email).toBe("john@example.com");

			// Verify profile was saved
			const savedProfile = await Profile.findOne({ userId: savedUser._id });

			expect(savedProfile).not.toBeNull();
			expect(savedProfile.firstName).toBe("John");
			expect(savedProfile.lastName).toBe("Doe");
		} catch (error) {
			console.error("Test error:", error);
			throw error;
		}
	});

	// Test 400 duplicate email
	it("should return 400 when email is already registered", async () => {
		// First create a user
		const user = await User.create({
			email: "existing@example.com",
			password: "Password123!",
		});

		await Profile.create({
			userId: user._id,
			firstName: "Existing",
			lastName: "User",
		});

		// Try to register with the same email
		const req = createRequest({
			firstName: "Another",
			lastName: "Person",
			email: "existing@example.com",
			password: "NewPassword123!",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBeDefined();
		expect(data.error).toContain("Email");
	});

	// Test 400 missing firstName
	it("should return 400 when firstName is missing", async () => {
		const req = createRequest({
			firstName: "",
			lastName: "Doe",
			email: "john@example.com",
			password: "Password123!",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.firstName).toBeDefined();
	});

	// Test 400 missing lastName
	it("should return 400 when lastName is missing", async () => {
		const req = createRequest({
			firstName: "John",
			lastName: "",
			email: "john@example.com",
			password: "Password123!",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.lastName).toBeDefined();
	});

	// Test 400 missing email
	it("should return 400 when email is missing", async () => {
		const req = createRequest({
			firstName: "John",
			lastName: "Doe",
			email: "",
			password: "Password123!",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.email).toBeDefined();
	});

	// Test 400 missing password
	it("should return 400 when password is missing", async () => {
		const req = createRequest({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			password: "",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.password).toBeDefined();
	});

	// Test 400 invalid email format
	it("should return 400 when email format is invalid", async () => {
		const req = createRequest({
			firstName: "John",
			lastName: "Doe",
			email: "not-an-email",
			password: "Password123!",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
	});

	// Test 400 password too weak
	it("should return 400 when password is too weak", async () => {
		const req = createRequest({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			password: "weak", // Too weak - missing uppercase, number, and special char
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.errors).toBeDefined();
		expect(data.errors.password).toBeDefined();
	});

	// Test 500 server error
	it("should return 500 when server error occurs", async () => {
		// Suppress console.error for this test
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Mock User.create to throw an error
		const originalSave = mongoose.Model.prototype.save;
		mongoose.Model.prototype.save = jest.fn().mockImplementationOnce(() => {
			throw new Error("Database error");
		});

		const req = createRequest({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			password: "Password123!",
		});

		const response = await POST(req, context);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBeDefined();
		expect(data.error).toBe("Failed to create user");

		// Restore original implementations
		mongoose.Model.prototype.save = originalSave;
		console.error = originalConsoleError;
	});
});

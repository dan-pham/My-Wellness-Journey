import { NextRequest, NextResponse } from "next/server";
import { GET, PUT } from "@/app/api/user/profile/route";
import User from "@/models/user";
import Profile from "@/models/profile";
import mongoose from "mongoose";
import { authenticate as originalAuthenticate } from "@/middleware/auth";

type AuthenticateFunction = typeof originalAuthenticate;

interface MockUser {
	_id: string | mongoose.Types.ObjectId;
	email: string;
	createdAt: Date;
	updatedAt: Date;
	[key: string]: any;
}

interface MockProfile {
	userId: string | mongoose.Types.ObjectId;
	firstName: string;
	lastName: string;
	dateOfBirth?: string;
	gender?: string;
	conditions?: Array<{ id: string; name: string }>;
	savedResources?: Array<{ id: string; savedAt: Date }>;
	savedTips?: Array<{ id: string; savedAt: Date }>;
	save: jest.Mock;
	[key: string]: any;
}

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
	authenticate: jest.fn(),
}));

// Mock the database connection
jest.mock("@/config/db", () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue(true),
}));

// Mock the rate limiter
jest.mock("@/middleware/rateLimit", () => ({
	apiRateLimiter: jest.fn().mockResolvedValue(null),
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
		nextUrl: { pathname: "/api/user/profile" },
		ip: "127.0.0.1",
	} as unknown as NextRequest;
};

// Context parameter required by withApiMiddleware
const context = { params: {} };

describe("User API - Profile", () => {
	let userId: string;
	let authenticate: jest.MockedFunction<AuthenticateFunction>;
	let mockUser: MockUser;
	let mockProfile: MockProfile;

	beforeEach(async () => {
		// Reset all mocks
		jest.resetAllMocks();

		// Import the mocked functions
		({ authenticate } = require("@/middleware/auth"));

		// Create a mock user ID
		userId = new mongoose.Types.ObjectId().toString();

		// Create a properly typed mock user
		mockUser = {
			_id: userId,
			email: "test@example.com",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Create a mock profile
		mockProfile = {
			userId: userId,
			firstName: "Test",
			lastName: "User",
			dateOfBirth: "1955-12-12",
			gender: "male",
			conditions: [],
			savedResources: [],
			savedTips: [],
			save: jest.fn().mockResolvedValue(true),
		};

		// Setup default mock behaviors
		authenticate.mockResolvedValue({ userId });

		// Mock User.findById
		User.findById = jest.fn().mockResolvedValue(mockUser);

		// Mock Profile.findOne
		Profile.findOne = jest.fn().mockResolvedValue(mockProfile);
	});

	// GET Tests
	describe("GET /api/user/profile", () => {
		// Test 200 success
		it("should get user profile successfully", async () => {
			const req = createRequest();

			const response = await GET(req, context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.profile).toBeDefined();
			expect(data.profile.firstName).toBe("Test");
			expect(data.profile.lastName).toBe("User");
			expect(data.profile.dateOfBirth).toBe("1955-12-12");
			expect(data.profile.gender).toBe("male");
		});

		// Test 401 unauthorized
		it("should return 401 when not authenticated", async () => {
			// Mock authenticate to return a 401 response
			authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

			const req = createRequest();

			const response = await GET(req, context);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		// Test 404 user not found
		it("should return 404 when user is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest();

			const response = await GET(req, context);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Profile not found");
		});

		// Test 500 server error
		it("should return 500 when server error occurs", async () => {
			// Suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Mock Profile.findOne to throw an error
			Profile.findOne = jest.fn().mockImplementation(() => {
				throw new Error("Database error");
			});

			const req = createRequest();

			const response = await GET(req, context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to get user profile");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	// PUT Tests
	describe("PUT /api/user/profile", () => {
		// Test 200 success - full profile update
		it("should update user profile successfully", async () => {
			const updatedData = {
				firstName: "Updated",
				lastName: "Name",
				dateOfBirth: "1955-12-12",
				gender: "female",
			};

			const req = createRequest(updatedData);

			const response = await PUT(req, context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.profile).toBeDefined();
			expect(data.profile.firstName).toBe("Updated");
			expect(data.profile.lastName).toBe("Name");
			expect(data.profile.dateOfBirth).toBe("1955-12-12");
			expect(data.profile.gender).toBe("female");

			// Verify save was called
			expect(mockProfile.save).toHaveBeenCalled();
		});

		// Test 200 success - partial profile update
		it("should update partial user profile successfully", async () => {
			const partialUpdate = {
				firstName: "Updated",
				// Only update firstName, leave other fields unchanged
			};

			const req = createRequest(partialUpdate);

			const response = await PUT(req, context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.profile).toBeDefined();
			expect(data.profile.firstName).toBe("Updated");
			expect(data.profile.lastName).toBe("User"); // unchanged
			expect(data.profile.dateOfBirth).toBe("1955-12-12"); // unchanged

			// Verify save was called
			expect(mockProfile.save).toHaveBeenCalled();
		});

		// Test 401 unauthorized
		it("should return 401 when not authenticated", async () => {
			// Mock authenticate to return a 401 response
			authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

			const req = createRequest({
				firstName: "Updated",
			});

			const response = await PUT(req, context);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		// Test 404 user not found
		it("should return 404 when user is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest({
				firstName: "Updated",
			});

			const response = await PUT(req, context);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Profile not found");
		});

		// Test 500 server error
		it("should return 500 when server error occurs", async () => {
			// Suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Mock Profile.findOne to throw an error
			Profile.findOne = jest.fn().mockImplementation(() => {
				throw new Error("Database error");
			});

			const req = createRequest({
				firstName: "Updated",
			});

			const response = await PUT(req, context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to update user profile");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});
});

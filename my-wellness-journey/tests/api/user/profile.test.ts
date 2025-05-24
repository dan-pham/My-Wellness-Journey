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
	dateOfBirth?: string | Date;
	gender?: string;
	conditions?: Array<{ id: string; name: string }>;
	savedResources?: Array<{ id: string; savedAt: Date }>;
	savedTips?: Array<{ id: string; savedAt: Date }>;
	save: jest.Mock;
	set: jest.Mock;
	get: jest.Mock;
	[key: string]: any; // Allow dynamic properties
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

// Mock the profile service functions
jest.mock("@/lib/api/profileService", () => ({
	findProfileOrFail: jest.fn(),
	formatProfileResponse: jest.fn((profile) => ({
		...profile,
		dateOfBirth:
			profile.dateOfBirth instanceof Date
				? profile.dateOfBirth.toISOString().split("T")[0]
				: profile.dateOfBirth,
	})),
}));

// Mock the validation middleware
jest.mock("@/middleware/validation", () => ({
	validateAndSanitizeInput: (schema: any) => async (data: Record<string, unknown>) => {
		return {
			validated: data,
		};
	},
}));

// Mock the database connection function
jest.mock("@/lib/db/connection", () => ({
	ensureConnection: jest.fn().mockResolvedValue(undefined),
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
	let findProfileOrFail: jest.Mock;
	let formatProfileResponse: jest.Mock;

	beforeEach(async () => {
		// Reset all mocks
		jest.resetAllMocks();

		// Import the mocked functions
		({ authenticate } = require("@/middleware/auth"));
		({ findProfileOrFail, formatProfileResponse } = require("@/lib/api/profileService"));

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
			dateOfBirth: new Date("1955-12-12"),
			gender: "male",
			conditions: [],
			savedResources: [],
			savedTips: [],
			save: jest.fn().mockResolvedValue(true),
			set: jest.fn((field: string, value: any) => {
				switch (field) {
					case "firstName":
						mockProfile.firstName = value;
						break;
					case "lastName":
						mockProfile.lastName = value;
						break;
					case "dateOfBirth":
						mockProfile.dateOfBirth = value;
						break;
					case "gender":
						mockProfile.gender = value;
						break;
					case "conditions":
						mockProfile.conditions = value;
						break;
				}
			}),
			get: jest.fn((field: string) => {
				const value = mockProfile[field];
				if (field === "dateOfBirth" && value instanceof Date) {
					return value;
				}
				return value;
			}),
		};

		// Setup default mock behaviors
		authenticate.mockResolvedValue({ userId });
		findProfileOrFail.mockResolvedValue(mockProfile);
		formatProfileResponse.mockImplementation((profile) => ({
			...profile,
			dateOfBirth:
				profile.dateOfBirth instanceof Date
					? profile.dateOfBirth.toISOString().split("T")[0]
					: profile.dateOfBirth,
		}));

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
			authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

			const req = createRequest();

			const response = await GET(req, context);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		// Test 404 user not found
		it("should return 404 when user is not found", async () => {
			findProfileOrFail.mockRejectedValue(new Error("Profile not found"));

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

			findProfileOrFail.mockRejectedValue(new Error("Database error"));

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

			const updatedProfile = {
				...mockProfile,
				save: jest.fn().mockResolvedValue(true),
				set: jest.fn((field: string, value: any) => {
					switch (field) {
						case "firstName":
							updatedProfile.firstName = value;
							break;
						case "lastName":
							updatedProfile.lastName = value;
							break;
						case "dateOfBirth":
							updatedProfile.dateOfBirth = value;
							break;
						case "gender":
							updatedProfile.gender = value;
							break;
						case "conditions":
							updatedProfile.conditions = value;
							break;
					}
				}),
			};

			findProfileOrFail.mockResolvedValue(updatedProfile);

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
			expect(updatedProfile.save).toHaveBeenCalled();
		});

		// Test 200 success - partial profile update
		it("should update partial user profile successfully", async () => {
			const partialUpdate = {
				firstName: "Updated",
			};

			const updatedProfile = {
				...mockProfile,
				save: jest.fn().mockResolvedValue(true),
				set: jest.fn((field: string, value: any) => {
					switch (field) {
						case "firstName":
							updatedProfile.firstName = value;
							break;
						case "lastName":
							updatedProfile.lastName = value;
							break;
						case "dateOfBirth":
							updatedProfile.dateOfBirth = value;
							break;
						case "gender":
							updatedProfile.gender = value;
							break;
						case "conditions":
							updatedProfile.conditions = value;
							break;
					}
				}),
			};

			findProfileOrFail.mockResolvedValue(updatedProfile);

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
			expect(updatedProfile.save).toHaveBeenCalled();
		});

		// Test 404 user not found
		it("should return 404 when user is not found", async () => {
			// Suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			findProfileOrFail.mockRejectedValue(new Error("Profile not found"));

			const req = createRequest({
				firstName: "Updated",
			});

			const response = await PUT(req, context);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Profile not found");

			// Restore console.error
			console.error = originalConsoleError;
		});

		// Test 500 server error
		it("should return 500 when server error occurs", async () => {
			// Suppress console.error for this test
			const originalConsoleError = console.error;
			console.error = jest.fn();

			findProfileOrFail.mockRejectedValue(new Error("Database error"));

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

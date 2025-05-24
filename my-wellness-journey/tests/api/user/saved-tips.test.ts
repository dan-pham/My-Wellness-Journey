import { NextRequest, NextResponse } from "next/server";
import { GET, POST, DELETE } from "@/app/api/user/saved-tips/route";
import Profile from "@/models/profile";
import mongoose from "mongoose";
import { authenticate as originalAuthenticate } from "@/middleware/auth";
import {
	validateAndSanitizeInput as originalValidateInput,
	ValidationSchema,
} from "@/middleware/validation";

// Define the type for the authenticate function
type AuthenticateFunction = typeof originalAuthenticate;

// Define an interface for our mock profile
interface MockProfile {
	userId: string | mongoose.Types.ObjectId;
	savedTips: Array<{
		id: string | mongoose.Types.ObjectId;
		savedAt: Date;
	}>;
	save: jest.Mock;
	[key: string]: any; // Allow additional properties
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

// Mock the validation middleware
jest.mock("@/middleware/validation", () => ({
	validateAndSanitizeInput: jest.fn((schema: ValidationSchema) => async (req: NextRequest) => ({
		validated: { tipId: "test-tip-id" },
	})),
	isRequired: jest.fn(),
}));

// Simple helper to create a NextRequest
const createRequest = (body: Record<string, any> = {}, urlParams?: Record<string, string>) => {
	const req = {
		headers: {
			get: jest.fn(() => null),
		},
		json: jest.fn().mockResolvedValue(body),
		url: "http://localhost/api/user/saved-tips",
		nextUrl: { pathname: "/api/user/saved-tips" },
		ip: "127.0.0.1",
	} as unknown as NextRequest;

	// For requests with URL parameters
	if (urlParams) {
		// Mock the URL class and searchParams
		const searchParamsObj = new URLSearchParams();
		Object.entries(urlParams).forEach(([key, value]) => {
			searchParamsObj.append(key, value);
		});

		// Create a mock URL that will be used when the code calls `new URL(req.url)`
		const mockUrl = {
			searchParams: searchParamsObj,
		};

		// Mock the global URL constructor
		global.URL = jest.fn(() => mockUrl) as any;
	}

	return req;
};

describe("User API - Saved Tips", () => {
	let userId: string;
	let tipId: string;
	let authenticate: jest.MockedFunction<AuthenticateFunction>;
	let validateAndSanitizeInput: jest.MockedFunction<typeof originalValidateInput>;
	let mockProfile: MockProfile;

	beforeEach(async () => {
		// Reset all mocks
		jest.resetAllMocks();

		// Import the mocked functions
		({ authenticate } = require("@/middleware/auth"));
		({ validateAndSanitizeInput } = require("@/middleware/validation"));

		// Create IDs
		userId = new mongoose.Types.ObjectId().toString();
		tipId = new mongoose.Types.ObjectId().toString();

		// Create a properly typed mock profile with saved tips
		mockProfile = {
			userId: userId,
			savedTips: [
				{
					id: new mongoose.Types.ObjectId().toString(),
					savedAt: new Date(),
				},
			],
			save: jest.fn().mockResolvedValue(true),
		};

		// Setup default mock behaviors
		authenticate.mockResolvedValue({ userId });

		// Mock Profile.findOne
		Profile.findOne = jest.fn().mockResolvedValue(mockProfile);

		// Mock validateAndSanitizeInput to return a function that returns a valid result
		validateAndSanitizeInput.mockImplementation(
			(schema: ValidationSchema) => async (req: NextRequest) => ({
				validated: {
					tipId: tipId,
				},
			})
		);
	});

	// GET Tests
	describe("GET /api/user/saved-tips", () => {
		// Test 200 success
		it("should get saved tips successfully", async () => {
			const req = createRequest();

			const response = await GET(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.savedTips).toBeDefined();
			expect(Array.isArray(data.savedTips)).toBe(true);
			expect(data.savedTips).toHaveLength(1);
		});

		// Test 200 success with no saved tips
		it("should return empty array when no saved tips exist", async () => {
			// Mock profile with empty savedTips array
			const profileWithoutTips: MockProfile = {
				userId: userId,
				savedTips: [], // Empty array
				save: jest.fn().mockResolvedValue(true),
			};

			Profile.findOne = jest.fn().mockResolvedValue(profileWithoutTips);

			const req = createRequest();

			const response = await GET(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.savedTips).toBeDefined();
			expect(Array.isArray(data.savedTips)).toBe(true);
			expect(data.savedTips).toHaveLength(0);
		});

		// Test 401 unauthorized
		it("should return 401 when not authenticated", async () => {
			// Mock authenticate to return a 401 response
			authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

			const req = createRequest();

			const response = await GET(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		// Test 404 profile not found
		it("should return 404 when profile is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest();

			const response = await GET(req, { params: {} });
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

			const response = await GET(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to get saved tips");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	// POST Tests
	describe("POST /api/user/saved-tips", () => {
		// Test 200 success
		it("should save a tip successfully", async () => {
			const req = createRequest({
				tipId: tipId,
			});

			const response = await POST(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe("Tip saved successfully");

			// Verify the saved tip was added with expected properties
			expect(
				mockProfile.savedTips.some((tip) => tip.id === tipId && tip.savedAt instanceof Date)
			).toBe(true);
			expect(mockProfile.save).toHaveBeenCalled();
		});

		// Test 400 missing tipId
		it("should return 400 when tipId is not provided", async () => {
			// Mock validation to return a 400 response
			validateAndSanitizeInput.mockImplementation(
				(schema: ValidationSchema) => async (req: NextRequest) =>
					NextResponse.json({ errors: { tipId: ["Tip ID is required"] } }, { status: 400 })
			);

			const req = createRequest({});

			const response = await POST(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors).toBeDefined();
			expect(data.errors.tipId).toBeDefined();
			expect(data.errors.tipId[0]).toBe("Tip ID is required");
			expect(mockProfile.save).not.toHaveBeenCalled();
		});

		// Test 400 tip already saved
		it("should return 400 when tip is already saved", async () => {
			// Add the tip to be saved to simulate it's already saved
			const existingTipId = tipId;
			mockProfile.savedTips.push({
				id: existingTipId,
				savedAt: new Date(),
			});

			const req = createRequest({
				tipId: existingTipId,
			});

			const response = await POST(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Tip already saved");
			expect(mockProfile.save).not.toHaveBeenCalled();
		});

		// Test 404 profile not found
		it("should return 404 when profile is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest({
				tipId: tipId,
			});

			const response = await POST(req, { params: {} });
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
				tipId: tipId,
			});

			const response = await POST(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to save tip");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	// DELETE Tests
	describe("DELETE /api/user/saved-tips", () => {
		// Test 200 success
		it("should unsave a tip successfully", async () => {
			// Add the tip to be unsaved
			const tipToUnsave = tipId;
			mockProfile.savedTips.push({
				id: tipToUnsave,
				savedAt: new Date(),
			});

			const req = createRequest({}, { tipId: tipToUnsave });

			const response = await DELETE(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe("Tip removed from saved tips");
			expect(mockProfile.save).toHaveBeenCalled();
		});

		// Test 400 missing tipId
		it("should return 400 when tipId is not provided", async () => {
			const req = createRequest({}, {});

			const response = await DELETE(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Tip ID is required");
			expect(mockProfile.save).not.toHaveBeenCalled();
		});

		// Test 404 profile not found
		it("should return 404 when profile is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest({}, { tipId: tipId });

			const response = await DELETE(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Profile not found");
		});

		// Test 404 tip not found
		it("should return 404 when tip is not found in saved tips", async () => {
			const req = createRequest({}, { tipId: "non-existent-tip-id" });

			const response = await DELETE(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Tip not found in saved tips");
			expect(mockProfile.save).not.toHaveBeenCalled();
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

			const req = createRequest({}, { tipId: tipId });

			const response = await DELETE(req, { params: {} });
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to remove tip from saved tips");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});
});

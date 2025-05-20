import { NextRequest, NextResponse } from "next/server";
import { GET, POST, DELETE } from "@/app/api/user/saved-resources/route";
import Profile from "@/models/profile";
import mongoose from "mongoose";
import { authenticate as originalAuthenticate } from "@/middleware/auth";

// Define the type for the authenticate function
type AuthenticateFunction = typeof originalAuthenticate;

// Define an interface for our mock profile
interface MockProfile {
	userId: string | mongoose.Types.ObjectId;
	savedResources: Array<{
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

// Simple helper to create a NextRequest
const createRequest = (body: Record<string, any> = {}, urlParams?: Record<string, string>) => {
	const req = {
		headers: {
			get: jest.fn(() => null),
		},
		json: jest.fn().mockResolvedValue(body),
		url: "http://localhost/api/user/saved-resources",
		nextUrl: { pathname: "/api/user/saved-resources" },
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

describe("User API - Saved Resources", () => {
	let userId: string;
	let resourceId: string;
	let authenticate: jest.MockedFunction<AuthenticateFunction>;
	let mockProfile: MockProfile;

	beforeEach(async () => {
		// Reset all mocks
		jest.resetAllMocks();

		// Import the mocked functions
		({ authenticate } = require("@/middleware/auth"));

		// Create IDs
		userId = new mongoose.Types.ObjectId().toString();
		resourceId = new mongoose.Types.ObjectId().toString();

		// Create a properly typed mock profile with saved resources
		mockProfile = {
			userId: userId,
			savedResources: [
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
	});

	// GET Tests
	describe("GET /api/user/saved-resources", () => {
		// Test 200 success
		it("should get saved resources successfully", async () => {
			const req = createRequest();

			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.savedResources).toBeDefined();
			expect(Array.isArray(data.savedResources)).toBe(true);
			expect(data.savedResources).toHaveLength(1);
		});

		// Test 200 success with no saved resources
		it("should return empty array when no saved resources exist", async () => {
			// Mock profile with no saved resources
			const profileWithoutResources: MockProfile = {
				userId: userId,
				savedResources: [],
				save: jest.fn().mockResolvedValue(true),
			};

			Profile.findOne = jest.fn().mockResolvedValue(profileWithoutResources);

			const req = createRequest();

			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.savedResources).toBeDefined();
			expect(Array.isArray(data.savedResources)).toBe(true);
			expect(data.savedResources).toHaveLength(0);
		});

		// Test 401 unauthorized
		it("should return 401 when not authenticated", async () => {
			// Mock authenticate to return a 401 response
			authenticate.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

			const req = createRequest();

			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		// Test 404 profile not found
		it("should return 404 when profile is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest();

			const response = await GET(req);
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

			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to get saved resources");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	// POST Tests
	describe("POST /api/user/saved-resources", () => {
		// Test 200 success
		it("should save a resource successfully", async () => {
			const req = createRequest({
				resourceId: resourceId,
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe("Resource saved successfully");

			// Verify the saved resource was added
			expect(mockProfile.savedResources.some((r) => r.id === resourceId)).toBe(true);
			expect(mockProfile.save).toHaveBeenCalled();
		});

		// Test 400 missing resourceId
		it("should return 400 when resourceId is not provided", async () => {
			const req = createRequest({
				// No resourceId
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Resource ID is required");
			expect(mockProfile.save).not.toHaveBeenCalled();
		});

		// Test 400 resource already saved
		it("should return 400 when resource is already saved", async () => {
			// Set up a profile with the resource already saved
			const existingResourceId = resourceId;
			mockProfile.savedResources.push({
				id: existingResourceId,
				savedAt: new Date(),
			});

			const req = createRequest({
				resourceId: existingResourceId,
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Resource already saved");
			expect(mockProfile.save).not.toHaveBeenCalled();
		});

		// Test 404 profile not found
		it("should return 404 when profile is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest({
				resourceId: resourceId,
			});

			const response = await POST(req);
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
				resourceId: resourceId,
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to save resource");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});

	// DELETE Tests
	describe("DELETE /api/user/saved-resources", () => {
		// Test 200 success
		it("should unsave a resource successfully", async () => {
			// Add the resource to be deleted
			const resourceToDelete = resourceId;
			mockProfile.savedResources.push({
				id: resourceToDelete,
				savedAt: new Date(),
			});

			const req = createRequest({}, { resourceId: resourceToDelete });

			const response = await DELETE(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe("Resource removed from saved resources");
			expect(mockProfile.save).toHaveBeenCalled();
		});

		// Test 400 missing resourceId
		it("should return 400 when resourceId is not provided", async () => {
			const req = createRequest({}, {});

			const response = await DELETE(req);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Resource ID is required");
			expect(mockProfile.save).not.toHaveBeenCalled();
		});

		// Test 404 profile not found
		it("should return 404 when profile is not found", async () => {
			// Mock Profile.findOne to return null
			Profile.findOne = jest.fn().mockResolvedValue(null);

			const req = createRequest({}, { resourceId: resourceId });

			const response = await DELETE(req);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Profile not found");
		});

		// Test 404 resource not found
		it("should return 404 when resource is not found in saved resources", async () => {
			const req = createRequest({}, { resourceId: "non-existent-resource-id" });

			const response = await DELETE(req);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Resource not found in saved resources");
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

			const req = createRequest({}, { resourceId: resourceId });

			const response = await DELETE(req);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to remove resource from saved resources");

			// Restore console.error
			console.error = originalConsoleError;
		});
	});
});

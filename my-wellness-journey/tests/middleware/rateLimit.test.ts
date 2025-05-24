/**
 * @jest-environment node
 */

// Suppress Mongoose warnings
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

import { NextRequest, NextResponse } from "next/server";
import { authRateLimiter, passwordRateLimiter, apiRateLimiter } from "@/middleware/rateLimit";

describe("Rate Limiting Middleware", () => {
	// Mock Date.now to control time
	const originalDateNow = Date.now;

	// Helper to create mock request with IP and path
	function createMockRequest(ip: string = "127.0.0.1", path: string = "/api/test") {
		return {
			ip,
			headers: new Headers({
				"x-forwarded-for": ip,
			}),
			nextUrl: {
				pathname: path,
			},
		} as unknown as NextRequest;
	}

	beforeEach(() => {
		// Reset the Date.now mock before each test
		jest.resetAllMocks();
		global.Date.now = jest.fn(() => 1000); // Start at timestamp 1000
	});

	afterAll(() => {
		// Restore original Date.now
		global.Date.now = originalDateNow;
	});

	describe("authRateLimiter", () => {
		it("should allow requests under the limit", async () => {
			const req = createMockRequest("127.0.0.1", "/api/auth/login");

			// Make multiple requests below the limit (limit is 10)
			for (let i = 0; i < 9; i++) {
				const result = await authRateLimiter(req);
				expect(result).toBeNull();
			}
		});

		it("should block requests over the limit", async () => {
			const req = createMockRequest("127.0.0.1", "/api/auth/login");

			// Make requests up to the limit (limit is 10)
			for (let i = 0; i < 10; i++) {
				await authRateLimiter(req);
			}

			// The next request should be blocked
			const result = await authRateLimiter(req);

			// Should return a response with 429 status
			expect(result).toBeInstanceOf(NextResponse);
			const response = result as NextResponse;
			expect(response.status).toBe(429);

			// Check response body
			const body = await response.json();
			expect(body).toEqual({
				error: "Too many authentication attempts, please try again later",
			});

			// Check Retry-After header
			expect(response.headers.get("Retry-After")).toBeDefined();
		});

		it("should reset limit after the time window", async () => {
			const req = createMockRequest("127.0.0.1", "/api/auth/login");

			// Make requests up to the limit
			for (let i = 0; i < 10; i++) {
				await authRateLimiter(req);
			}

			// The next request should be blocked
			let result = await authRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);

			// Advance time beyond the window (15 minutes = 900000ms)
			global.Date.now = jest.fn(() => 1000 + 900001);

			// Now the limit should be reset
			result = await authRateLimiter(req);
			expect(result).toBeNull();
		});
	});

	describe("passwordRateLimiter", () => {
		it("should have a stricter limit than general auth", async () => {
			const req = createMockRequest("127.0.0.1", "/api/user/password");

			// Make requests up to the password limit (limit is 5)
			for (let i = 0; i < 5; i++) {
				const result = await passwordRateLimiter(req);
				expect(result).toBeNull();
			}

			// The next request should be blocked
			const result = await passwordRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);
			expect((result as NextResponse).status).toBe(429);
		});

		it("should have a longer reset window", async () => {
			const req = createMockRequest("127.0.0.1", "/api/user/password");

			// Make requests up to the limit
			for (let i = 0; i < 5; i++) {
				await passwordRateLimiter(req);
			}

			// The next request should be blocked
			let result = await passwordRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);

			// Advance time by 30 minutes (not enough for 1 hour window)
			global.Date.now = jest.fn(() => 1000 + 30 * 60 * 1000);

			// Should still be blocked
			result = await passwordRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);

			// Advance time beyond the window (1 hour = 3600000ms)
			global.Date.now = jest.fn(() => 1000 + 3600001);

			// Now the limit should be reset
			result = await passwordRateLimiter(req);
			expect(result).toBeNull();
		});
	});

	describe("apiRateLimiter", () => {
		it("should have a higher limit for API calls", async () => {
			const req = createMockRequest("127.0.0.1", "/api/data");

			// Make many requests below the API limit (limit is 60)
			for (let i = 0; i < 59; i++) {
				const result = await apiRateLimiter(req);
				expect(result).toBeNull();
			}

			// The next request should still be allowed
			let result = await apiRateLimiter(req);
			expect(result).toBeNull();

			// But one more should be blocked
			result = await apiRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);
		});

		it("should have a shorter reset window", async () => {
			const req = createMockRequest("127.0.0.1", "/api/data");

			// Make requests up to the limit
			for (let i = 0; i < 60; i++) {
				await apiRateLimiter(req);
			}

			// The next request should be blocked
			let result = await apiRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);

			// Advance time beyond the window (1 minute = 60000ms)
			global.Date.now = jest.fn(() => 1000 + 60001);

			// Now the limit should be reset
			result = await apiRateLimiter(req);
			expect(result).toBeNull();
		});
	});

	describe("RateLimiter behavior", () => {
		it("should track limits separately by IP", async () => {
			const req1 = createMockRequest("127.0.0.1", "/api/test");
			const req2 = createMockRequest("192.168.1.1", "/api/test");

			// Max out the first IP
			for (let i = 0; i < 10; i++) {
				await authRateLimiter(req1);
			}

			// First IP should be blocked
			let result = await authRateLimiter(req1);
			expect(result).toBeInstanceOf(NextResponse);

			// But second IP should still be allowed
			result = await authRateLimiter(req2);
			expect(result).toBeNull();
		});

		it("should track limits separately by path", async () => {
			const req1 = createMockRequest("127.0.0.1", "/api/path1");
			const req2 = createMockRequest("127.0.0.1", "/api/path2");

			// Max out the first path
			for (let i = 0; i < 10; i++) {
				await authRateLimiter(req1);
			}

			// First path should be blocked
			let result = await authRateLimiter(req1);
			expect(result).toBeInstanceOf(NextResponse);

			// But second path should still be allowed
			result = await authRateLimiter(req2);
			expect(result).toBeNull();
		});

		it("should handle requests with no IP or forwarded-for header", async () => {
			// Create a request with no IP
			const req = {
				ip: undefined,
				headers: new Headers({}),
				nextUrl: {
					pathname: "/api/test",
				},
			} as unknown as NextRequest;

			// Should still work, using "unknown" as the IP
			const result = await authRateLimiter(req);
			expect(result).toBeNull();
		});

		it("should include a Retry-After header with seconds", async () => {
			const req = createMockRequest("127.0.0.1", "/api/test");

			// Max out the limit
			for (let i = 0; i < 10; i++) {
				await authRateLimiter(req);
			}

			// Get the blocked response
			const result = await authRateLimiter(req);
			expect(result).toBeInstanceOf(NextResponse);

			// Check the Retry-After header
			const response = result as NextResponse;
			const retryAfter = response.headers.get("Retry-After");
			expect(retryAfter).toBeDefined();

			// Should be a number in seconds
			const seconds = parseInt(retryAfter as string, 10);
			expect(seconds).toBeGreaterThan(0);
			expect(seconds).toBeLessThanOrEqual(15 * 60); // 15 minutes max
		});
	});
});

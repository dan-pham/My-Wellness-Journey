import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for rate limiting
class RateLimitStore {
	private store: Map<string, { count: number; resetTime: number }>;
	private windowMs: number;

	constructor(windowMs: number) {
		this.store = new Map();
		this.windowMs = windowMs;
	}

	increment(key: string): { count: number; resetTime: number } {
		const now = Date.now();
		const record = this.store.get(key);

		if (!record || now > record.resetTime) {
			// New window
			const newRecord = {
				count: 1,
				resetTime: now + this.windowMs,
			};
			this.store.set(key, newRecord);
			return newRecord;
		}

		// Increment existing window
		record.count++;
		return record;
	}

	get(key: string): { count: number; resetTime: number } | undefined {
		return this.store.get(key);
	}
}

// Create rate limiters with different configurations
const createRateLimiter = (options: { windowMs?: number; max?: number; message?: string }) => {
	const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
	const max = options.max || 100; // 100 requests default
	const message = options.message || "Too many requests, please try again later";
	const store = new RateLimitStore(windowMs);

	return async function applyRateLimit(req: NextRequest) {
		// Get IP address
		const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
		const key = `${ip}:${req.nextUrl.pathname}`;

		// Check rate limit
		const record = store.increment(key);

		if (record.count > max) {
			return NextResponse.json(
				{ error: message },
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil((record.resetTime - Date.now()) / 1000).toString(),
					},
				}
			);
		}

		return null;
	};
};

// Create specific rate limiters
export const authRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // 10 login/registration attempts per 15 minutes
	message: "Too many authentication attempts, please try again later",
});

export const passwordRateLimiter = createRateLimiter({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, // 5 password change attempts per hour
	message: "Too many password change attempts, please try again later",
});

export const apiRateLimiter = createRateLimiter({
	windowMs: 60 * 1000, // 1 minute
	max: 60, // 60 requests per minute
	message: "Too many requests, please try again later",
});

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined in environment variables");
}

// JWT Token expiration
export const JWT_EXPIRES_IN = "7d";

// Cookie Configuration
export const AUTH_COOKIE_CONFIG = {
	name: "auth_token",
	httpOnly: true,
	secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
	sameSite: "strict" as const,
	maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
	path: "/",
} as const;

// Helper function to create auth cookie with token
export function createAuthCookie(token: string) {
	return {
		...AUTH_COOKIE_CONFIG,
		value: token,
	};
}

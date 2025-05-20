import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/config/db";
import User from "@/models/user";
import { validateAndSanitizeInput, isRequired, isEmail } from "@/middleware/validation";
import { authRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined in environment variables");
}

async function loginHandler(req: NextRequest) {
	try {
		// Validate input
		const validationSchema = {
			email: [isRequired("Email"), isEmail()],
			password: [isRequired("Password")],
		};

		const validationResult = await validateAndSanitizeInput(validationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult;
		}

		const { email, password } = validationResult.validated;

		// Connect to database
		await connectDB();

		// Find user by email and include password field (which is excluded by default)
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		// Verify password
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		// Generate JWT token
		const token = jwt.sign({ id: user._id }, JWT_SECRET as string, { expiresIn: "7d" });

		// Return user data and token (exclude password)
		const userData = {
			id: user._id,
			email: user.email,
			createdAt: user.createdAt,
		};

		// Create response
		const response = NextResponse.json({
			success: true,
			user: userData,
			token: token,
		});

		// Set the token as an HTTP-only cookie
		response.cookies.set({
			name: "auth_token",
			value: token,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
	}
}

export const POST = withApiMiddleware(loginHandler, {
	rateLimiter: authRateLimiter,
	enableCors: true,
});

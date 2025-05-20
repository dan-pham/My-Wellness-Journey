import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/config/db";
import User from "@/models/user";
import { validateAndSanitizeInput, isRequired, isEmail } from "@/middleware/validation";
import { authRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import mongoose from "mongoose";
import { JWT_SECRET, JWT_EXPIRES_IN, createAuthCookie } from "@/config/auth";

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

		// Find user by email and include password field
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
		const token = jwt.sign({ id: user._id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });

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
		response.cookies.set(createAuthCookie(token));

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
	} finally {
		// Close the database connection if mongoose has an active connection
		if (mongoose.connection.readyState !== 0) {
			await mongoose.disconnect();
		}
	}
}

// Export the handler with middleware
export const POST = withApiMiddleware(loginHandler, {
	rateLimiter: authRateLimiter,
	enableCors: true,
});

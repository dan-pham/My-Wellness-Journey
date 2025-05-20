import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import { authenticate } from "@/middleware/auth";
import {
	validateAndSanitizeInput,
	isRequired,
	minLength,
	passwordStrength,
} from "@/middleware/validation";
import { passwordRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import jwt from "jsonwebtoken";

async function passwordHandler(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Validate input
		const validationSchema = {
			currentPassword: [isRequired("Current password")],
			newPassword: [isRequired("New password"), minLength(8), passwordStrength()],
		};

		const validationResult = await validateAndSanitizeInput(validationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult;
		}

		const { currentPassword, newPassword } = validationResult.validated;

		// Connect to database
		await connectDB();

		// Find user by ID and include password field
		const user = await User.findById(userId).select("+password");

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Verify current password
		const isMatch = await user.comparePassword(currentPassword);
		if (!isMatch) {
			return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
		}

		// Ensure new password is different from current password
		if (currentPassword === newPassword) {
			return NextResponse.json(
				{
					error: "New password must be different from current password",
				},
				{ status: 400 }
			);
		}

		// Update password
		user.password = newPassword;
		await user.save();

		// Create a response with secure cookie settings
		const response = NextResponse.json({
			success: true,
			message: "Password updated successfully",
		});

		// Refresh the auth token with a new expiration time
		const JWT_SECRET = process.env.JWT_SECRET as string;
		if (JWT_SECRET) {
			const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

			response.cookies.set({
				name: "auth_token",
				value: token,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
				path: "/",
			});
		}

		return response;
	} catch (error) {
		console.error("Change password error:", error);
		return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
	}
}

export const PUT = withApiMiddleware(passwordHandler, {
	rateLimiter: passwordRateLimiter,
	enableCors: true,
});

import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import Profile from "@/models/profile";
import {
	validateAndSanitizeInput,
	isRequired,
	isEmail,
	passwordStrength,
} from "@/middleware/validation";
import { authRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { ensureConnection, closeConnection } from "@/lib/db/connection";

// Validation schema for registration
const VALIDATION_SCHEMA = {
	firstName: [isRequired("First name")],
	lastName: [isRequired("Last name")],
	email: [isRequired("Email"), isEmail()],
	password: [isRequired("Password"), passwordStrength()],
};

async function registerHandler(req: NextRequest) {
	try {
		// Validate and sanitize input
		const validationResult = await validateAndSanitizeInput(VALIDATION_SCHEMA)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult;
		}

		// Get user data from request body
		const { firstName, lastName, email, password } = validationResult.validated;

		// Connect to database
		await ensureConnection();

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
		}

		// Create new user (auth record)
		const user = new User({
			email,
			password,
		});

		// Save user to database
		await user.save();

		// Create associated profile
		const profile = new Profile({
			userId: user._id,
			firstName,
			lastName,
		});

		// Save profile to database
		await profile.save();

		// Return success response without password
		return NextResponse.json({
			success: true,
			user: {
				id: user._id,
				email: user.email,
				createdAt: user.createdAt,
				profile: {
					firstName: profile.firstName,
					lastName: profile.lastName,
				},
			},
		});
	} catch (error) {
		// Check if it's a duplicate key error
		if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
			return NextResponse.json(
				{
					error: "Email is already registered",
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
	} finally {
		// Close the database connection if mongoose has an active connection
		await closeConnection();
	}
}

export const POST = withApiMiddleware(registerHandler, {
	rateLimiter: authRateLimiter,
	enableCors: true,
});

import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import { ensureConnection } from "@/lib/db/connection";
import { validateAndSanitizeInput, sanitizeInput } from "@/middleware/validation";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { createUserValidationSchema } from "./validation";
import { CreateUserRequest, CreateUserResponse, CreateUserError, MongoError } from "./types";

async function createUserHandler(
	req: NextRequest
): Promise<NextResponse<CreateUserResponse | CreateUserError>> {
	try {
		// Validate input
		const validationResult = await validateAndSanitizeInput(createUserValidationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult as NextResponse<CreateUserError>;
		}

		const data = validationResult.validated as CreateUserRequest;

		// Sanitize input
		const sanitizedData = {
			firstName: sanitizeInput(data.firstName),
			lastName: sanitizeInput(data.lastName),
			email: data.email.toLowerCase(), // Emails should be lowercase
			password: data.password,
		};

		await ensureConnection();

		try {
			// Check for existing user with same email
			const existingUser = await User.findOne({ email: sanitizedData.email });
			if (existingUser) {
				return NextResponse.json(
					{ error: "Email already registered" },
					{ status: 409 } // Conflict
				);
			}

			// Create new user
			const user = new User(sanitizedData);

			// Save user to database
			await user.save();

			// Return success response without password
			return NextResponse.json({
				success: true,
				user: {
					id: user._id,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					createdAt: user.createdAt,
				},
			});
		} catch (error) {
			// Handle specific database errors
			const mongoError = error as MongoError;
			if (mongoError.code === 11000) {
				// Duplicate key error
				return NextResponse.json({ error: "Email already registered" }, { status: 409 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Error creating user:", error);
		return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
	}
}

export const POST = withApiMiddleware(createUserHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

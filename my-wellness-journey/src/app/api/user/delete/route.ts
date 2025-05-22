import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import Profile from "@/models/profile";
import { authenticate } from "@/middleware/auth";
import { validateAndSanitizeInput } from "@/middleware/validation";
import { ensureConnection } from "@/lib/db/connection";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { deleteUserValidationSchema } from "./validation";
import { DeleteUserRequest, DeleteUserResponse, DeleteUserError } from "./types";

async function deleteUserHandler(
	req: NextRequest
): Promise<NextResponse<DeleteUserResponse | DeleteUserError>> {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Validate input - require password confirmation
		const validationResult = await validateAndSanitizeInput(deleteUserValidationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult as NextResponse<DeleteUserError>;
		}

		const { password } = validationResult.validated as DeleteUserRequest;

		// Connect to database
		await ensureConnection();

		try {
			// Find user by ID and include password field
			const user = await User.findById(userId).select("+password");

			if (!user) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			// Verify password
			const isPasswordValid = await user.comparePassword(password);
			if (!isPasswordValid) {
				return NextResponse.json({ error: "Invalid password" }, { status: 401 });
			}

			// Delete user's profile first
			await Profile.findOneAndDelete({ userId });

			// Delete user from database
			await User.findByIdAndDelete(userId);

			return NextResponse.json({
				success: true,
				message: "User account deleted successfully",
			});
		} catch (error) {
			if (error instanceof Error && error.message === "User not found") {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Delete account error: ", error);
		return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
	}
}

export const DELETE = withApiMiddleware(deleteUserHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

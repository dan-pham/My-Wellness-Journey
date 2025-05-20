import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/user";
import { authenticate } from "@/middleware/auth";
import { validateInput, isRequired } from "@/middleware/validation";

export async function DELETE(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Validate input - require password confirmation
		const validationSchema = {
			password: [isRequired("Password")],
		};

		const validationResult = await validateInput(validationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult;
		}

		const { password } = validationResult.validated;

		// Connect to database
		await connectDB();

		// Find user by ID and include password field
		const user = await User.findById(userId).select("+password");

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Delete user from database
		await User.findByIdAndDelete(userId);

		return NextResponse.json({
			success: true,
			message: "User account deleted successfully",
		});
	} catch (error) {
		console.error("Delete account error: ", error);
		return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
	}
}

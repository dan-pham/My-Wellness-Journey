import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import connectDB from "@/config/db";
import User from "@/models/user";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Connect to database
		await connectDB();

		// Find user by ID
		const user = await User.findById(userId);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Return basic user data
		return NextResponse.json({
			success: true,
			isAuthenticated: true,
			user: {
				id: user._id,
			},
		});
	} catch (error) {
		console.error("Auth check error:", error);
		return NextResponse.json({ error: "Authentication check failed" }, { status: 500 });
	} finally {
		// Close the database connection if mongoose has an active connection
		if (mongoose.connection.readyState !== 0) {
			await mongoose.disconnect();
		}
	}
}

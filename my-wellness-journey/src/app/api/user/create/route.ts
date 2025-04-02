import { NextResponse } from "next/server";
import User from "@/models/user";
import connectDB from "@/config/db";

export async function POST(req: Request) {
	try {
		await connectDB();

		// Get user data from request body
		const { firstName, lastName, email, password } = await req.json();

		// Create new user
		const user = new User({
			firstName,
			lastName,
			email,
			password: password,
		});

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
		console.error("Error creating user:", error);
		return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
	}
}

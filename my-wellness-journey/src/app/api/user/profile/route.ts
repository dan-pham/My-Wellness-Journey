import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import Profile from "@/models/profile";
import { authenticate } from "@/middleware/auth";
import { sanitizeInput } from "@/middleware/validation";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";

// Fetch user profile
async function getProfileHandler(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Connect to database
		await connectDB();

		// Find profile by user ID
		const profile = await Profile.findOne({ userId });

		if (!profile) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Return profile data
		return NextResponse.json({
			success: true,
			profile: {
				firstName: profile.firstName,
				lastName: profile.lastName,
				dateOfBirth: profile.dateOfBirth,
				gender: profile.gender,
				conditions: profile.conditions || [],
				savedResources: profile.savedResources || [],
				savedTips: profile.savedTips || [],
				createdAt: profile.createdAt,
				updatedAt: profile.updatedAt,
			},
		});
	} catch (error) {
		console.error("Get profile error:", error);
		return NextResponse.json({ error: "Failed to get user profile" }, { status: 500 });
	}
}

// Update user profile
async function updateProfileHandler(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Connect to database
		await connectDB();

		// Get profile data from request body
		const data = await req.json();

		// Sanitize all string inputs
		const sanitizedData = {
			firstName: typeof data.firstName === "string" ? sanitizeInput(data.firstName) : undefined,
			lastName: typeof data.lastName === "string" ? sanitizeInput(data.lastName) : undefined,
			dateOfBirth:
				typeof data.dateOfBirth === "string" ? sanitizeInput(data.dateOfBirth) : undefined,
			gender: typeof data.gender === "string" ? sanitizeInput(data.gender) : undefined,
		};

		// Find profile by user ID
		let profile = await Profile.findOne({ userId });

		// If profile doesn't exist, return 404 error
		if (!profile) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Update existing profile
		if (sanitizedData.firstName !== undefined) profile.firstName = sanitizedData.firstName;
		if (sanitizedData.lastName !== undefined) profile.lastName = sanitizedData.lastName;
		if (sanitizedData.dateOfBirth !== undefined) profile.dateOfBirth = sanitizedData.dateOfBirth;
		if (sanitizedData.gender !== undefined) profile.gender = sanitizedData.gender;
		
		// Update health conditions if provided
		if (data.conditions && Array.isArray(data.conditions)) {
			profile.conditions = data.conditions;
		}

		// Save updated profile
		await profile.save();

		// Return updated profile
		return NextResponse.json({
			success: true,
			profile: {
				firstName: profile.firstName,
				lastName: profile.lastName,
				dateOfBirth: profile.dateOfBirth,
				gender: profile.gender,
				conditions: profile.conditions || [],
				savedResources: profile.savedResources || [],
				savedTips: profile.savedTips || [],
				createdAt: profile.createdAt,
				updatedAt: profile.updatedAt,
			},
		});
	} catch (error) {
		console.error("Update profile error:", error);
		return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
	}
}

export const GET = withApiMiddleware(getProfileHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

export const PUT = withApiMiddleware(updateProfileHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

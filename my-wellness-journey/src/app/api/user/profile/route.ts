import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { sanitizeInput, validateAndSanitizeInput } from "@/middleware/validation";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { formatProfileResponse, findProfileOrFail } from "@/lib/api/profileService";
import { ensureConnection } from "@/lib/db/connection";
import { UpdateProfileRequest } from "./types";
import { isValidName, isValidDateOfBirth, isValidGender, isValidConditions } from "./validation";

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
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);
			return NextResponse.json({
				success: true,
				profile: formatProfileResponse(profile),
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Get profile error:", error);
		return NextResponse.json({ error: "Failed to get user profile" }, { status: 500 });
	}
}

function sanitizeProfileData(data: Partial<UpdateProfileRequest>) {
	return {
		firstName: typeof data.firstName === "string" ? sanitizeInput(data.firstName) : undefined,
		lastName: typeof data.lastName === "string" ? sanitizeInput(data.lastName) : undefined,
		dateOfBirth: typeof data.dateOfBirth === "string" ? sanitizeInput(data.dateOfBirth) : undefined,
		gender: typeof data.gender === "string" ? sanitizeInput(data.gender) : undefined,
		conditions: data.conditions,
	};
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

		// Get request data
		const data = await req.json();

		// Validate input
		const validationSchema = {
			firstName: data.firstName !== undefined ? [isValidName("First name")] : [],
			lastName: data.lastName !== undefined ? [isValidName("Last name")] : [],
			dateOfBirth: data.dateOfBirth !== undefined ? [isValidDateOfBirth()] : [],
			gender: data.gender !== undefined ? [isValidGender()] : [],
			conditions: data.conditions !== undefined ? [isValidConditions()] : [],
		};

		const validationResult = await validateAndSanitizeInput(validationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult;
		}

		const validatedData = validationResult.validated as UpdateProfileRequest;
		const sanitizedData = sanitizeProfileData(validatedData);

		// Connect to database
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);

			// Update existing profile
			if (sanitizedData.firstName !== undefined) profile.firstName = sanitizedData.firstName;
			if (sanitizedData.lastName !== undefined) profile.lastName = sanitizedData.lastName;
			if (sanitizedData.dateOfBirth !== undefined) profile.dateOfBirth = sanitizedData.dateOfBirth;
			if (sanitizedData.gender !== undefined) profile.gender = sanitizedData.gender;
			if (sanitizedData.conditions !== undefined) profile.conditions = sanitizedData.conditions;

			// Save updated profile
			await profile.save();

			return NextResponse.json({
				success: true,
				profile: formatProfileResponse(profile),
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
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

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { validateAndSanitizeInput } from "@/middleware/validation";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { formatProfileResponse, findProfileOrFail } from "@/lib/api/profileService";
import { ensureConnection } from "@/lib/db/connection";
import { UpdateProfileRequest } from "./types";
import { isValidName, isValidDateOfBirth, isValidGender, isValidConditions } from "./validation";

// Sanitize profile data before saving
function sanitizeProfileData(data: UpdateProfileRequest) {
	return {
		firstName: data.firstName,
		lastName: data.lastName,
		dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
		gender: data.gender || "",
		conditions: data.conditions?.map((condition) => ({
			id: condition.id.toLowerCase().replace(/\s+/g, "-"),
			name: condition.name.trim(),
		})),
	};
}

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

		// Validate input - only validate fields that are present
		const validationSchema = {
			...(data.firstName !== undefined && { firstName: [isValidName("First name")] }),
			...(data.lastName !== undefined && { lastName: [isValidName("Last name")] }),
			...(data.dateOfBirth !== undefined && { dateOfBirth: [isValidDateOfBirth()] }),
			...(data.gender !== undefined && { gender: [isValidGender()] }),
			...(data.conditions !== undefined && { conditions: [isValidConditions()] }),
		};

		const validationResult = await validateAndSanitizeInput(validationSchema)(data);
		if (validationResult instanceof NextResponse) {
			// Extract the specific error message if it exists
			const errorResponse = await validationResult.json();
			if (errorResponse.errors?.dateOfBirth?.[0]) {
				return NextResponse.json(
					{
						error: errorResponse.errors.dateOfBirth[0],
					},
					{ status: 400 }
				);
			}
			console.error("updateProfileHandler - Validation failed:", validationResult);
			return validationResult;
		}

		const validatedData = validationResult.validated as UpdateProfileRequest;

		const sanitizedData = sanitizeProfileData(validatedData);

		// Connect to database
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);

			// Update existing profile - only update fields that are present
			if (sanitizedData.firstName !== undefined) profile.firstName = sanitizedData.firstName;
			if (sanitizedData.lastName !== undefined) profile.lastName = sanitizedData.lastName;
			if (sanitizedData.dateOfBirth !== undefined) profile.dateOfBirth = sanitizedData.dateOfBirth;
			if (sanitizedData.gender !== undefined) {
				// Set the raw value to bypass schema encryption
				profile.set("gender", sanitizedData.gender, { strict: false });
			}
			if (sanitizedData.conditions !== undefined) profile.conditions = sanitizedData.conditions;

			// Save updated profile
			await profile.save();

			const formattedResponse = {
				success: true,
				profile: formatProfileResponse(profile),
			};

			return NextResponse.json(formattedResponse);
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				console.error("updateProfileHandler - Profile not found error");
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("updateProfileHandler - Unhandled error:", error);
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

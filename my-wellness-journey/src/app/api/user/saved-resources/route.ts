import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { findProfileOrFail } from "@/lib/api/profileService";
import { ensureConnection } from "@/lib/db/connection";
import { validateAndSanitizeInput } from "@/middleware/validation";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { saveResourceValidationSchema } from "./validation";
import {
	GetSavedResourcesResponse,
	SaveResourceRequest,
	SaveResourceResponse,
	DeleteResourceResponse,
	SavedResourceError,
} from "./types";

async function getSavedResourcesHandler(
	req: NextRequest
): Promise<NextResponse<GetSavedResourcesResponse | SavedResourceError>> {
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
				savedResources: profile.savedResources || [],
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Get saved resources error:", error);
		return NextResponse.json({ error: "Failed to get saved resources" }, { status: 500 });
	}
}

async function saveResourceHandler(
	req: NextRequest
): Promise<NextResponse<SaveResourceResponse | SavedResourceError>> {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Validate input
		const validationResult = await validateAndSanitizeInput(saveResourceValidationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult as NextResponse<SavedResourceError>;
		}

		const { resourceId } = validationResult.validated as SaveResourceRequest;

		// Connect to database
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);

			// Check if resource is already saved
			const isAlreadySaved = profile.savedResources.some(
				(resource: { id: string }) => resource.id === resourceId
			);

			if (isAlreadySaved) {
				return NextResponse.json({ error: "Resource already saved" }, { status: 400 });
			}

			// Add resource to saved resources
			profile.savedResources.push({
				id: resourceId,
				savedAt: new Date(),
			});

			// Save updated profile
			await profile.save();

			return NextResponse.json({
				success: true,
				message: "Resource saved successfully",
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Save resource error:", error);
		return NextResponse.json({ error: "Failed to save resource" }, { status: 500 });
	}
}

async function deleteResourceHandler(
	req: NextRequest
): Promise<NextResponse<DeleteResourceResponse | SavedResourceError>> {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Get resource ID from URL search params
		const { searchParams } = new URL(req.url);
		const resourceId = searchParams.get("resourceId");

		if (!resourceId) {
			return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
		}

		// Connect to database
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);

			// Find index of resource in saved resources array
			const resourceIndex = profile.savedResources.findIndex(
				(resource: { id: string }) => resource.id === resourceId
			);

			if (resourceIndex === -1) {
				return NextResponse.json(
					{ error: "Resource not found in saved resources" },
					{ status: 404 }
				);
			}

			// Remove resource from saved resources
			profile.savedResources.splice(resourceIndex, 1);

			// Save updated profile
			await profile.save();

			return NextResponse.json({
				success: true,
				message: "Resource removed from saved resources",
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Unsave resource error:", error);
		return NextResponse.json(
			{ error: "Failed to remove resource from saved resources" },
			{ status: 500 }
		);
	}
}

export const GET = withApiMiddleware(getSavedResourcesHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

export const POST = withApiMiddleware(saveResourceHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

export const DELETE = withApiMiddleware(deleteResourceHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

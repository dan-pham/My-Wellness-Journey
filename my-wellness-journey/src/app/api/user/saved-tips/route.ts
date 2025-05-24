import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { findProfileOrFail } from "@/lib/api/profileService";
import { ensureConnection } from "@/lib/db/connection";
import { validateAndSanitizeInput } from "@/middleware/validation";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { withApiMiddleware } from "@/lib/apiHandler";
import { saveTipValidationSchema } from "./validation";
import {
	GetSavedTipsResponse,
	SaveTipRequest,
	SaveTipResponse,
	DeleteTipResponse,
	SavedTipError,
} from "./types";

async function getSavedTipsHandler(
	req: NextRequest
): Promise<NextResponse<GetSavedTipsResponse | SavedTipError>> {
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
				savedTips: profile.savedTips || [],
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Get saved tips error:", error);
		return NextResponse.json({ error: "Failed to get saved tips" }, { status: 500 });
	}
}

async function saveTipHandler(
	req: NextRequest
): Promise<NextResponse<SaveTipResponse | SavedTipError>> {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Validate input
		const validationResult = await validateAndSanitizeInput(saveTipValidationSchema)(req);
		if (validationResult instanceof NextResponse) {
			return validationResult as NextResponse<SavedTipError>;
		}

		const { tipId } = validationResult.validated as SaveTipRequest;

		// Connect to database
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);

			// Check if tip is already saved
			const isAlreadySaved = profile.savedTips.some((tip: { id: string }) => tip.id === tipId);

			if (isAlreadySaved) {
				return NextResponse.json({ error: "Tip already saved" }, { status: 400 });
			}

			// Add tip to saved tips
			profile.savedTips.push({
				id: tipId,
				savedAt: new Date(),
			});

			// Save updated profile
			await profile.save();

			return NextResponse.json({
				success: true,
				message: "Tip saved successfully",
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Save tip error:", error);
		return NextResponse.json({ error: "Failed to save tip" }, { status: 500 });
	}
}

async function deleteTipHandler(
	req: NextRequest
): Promise<NextResponse<DeleteTipResponse | SavedTipError>> {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Get tip ID from URL search params
		const { searchParams } = new URL(req.url);
		const receivedTipId = searchParams.get("tipId");

		if (!receivedTipId) {
			return NextResponse.json({ error: "Tip ID is required" }, { status: 400 });
		}

		// Re-encode the received tipId to match the stored format
		const tipId = encodeURIComponent(receivedTipId);

		// Connect to database
		await ensureConnection();

		try {
			const profile = await findProfileOrFail(userId);

			// Find index of tip in saved tips array
			const tipIndex = profile.savedTips.findIndex((tip: { id: string }) => tip.id === tipId);

			if (tipIndex === -1) {
				return NextResponse.json({ error: "Tip not found in saved tips" }, { status: 404 });
			}

			// Remove tip from saved tips
			profile.savedTips.splice(tipIndex, 1);

			// Save updated profile
			await profile.save();

			return NextResponse.json({
				success: true,
				message: "Tip removed from saved tips",
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Profile not found") {
				return NextResponse.json({ error: "Profile not found" }, { status: 404 });
			}
			throw error;
		}
	} catch (error) {
		console.error("Error removing tip from saved tips:", error);
		return NextResponse.json({ error: "Failed to remove tip from saved tips" }, { status: 500 });
	}
}

export const GET = withApiMiddleware(getSavedTipsHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

export const POST = withApiMiddleware(saveTipHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

export const DELETE = withApiMiddleware(deleteTipHandler, {
	rateLimiter: apiRateLimiter,
	enableCors: true,
});

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import Profile from "@/models/profile";
import { authenticate } from "@/middleware/auth";
import mongoose from "mongoose";

// Get user's saved tips
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

		// Find profile by user ID
		const profile = await Profile.findOne({ userId });

		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Return saved tips
		return NextResponse.json({
			success: true,
			savedTips: profile.savedTips || [],
		});
	} catch (error) {
		console.error("Get saved tips error:", error);
		return NextResponse.json({ error: "Failed to get saved tips" }, { status: 500 });
	}
}

// Save a tip
export async function POST(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Get tip ID from request body
		const { tipId } = await req.json();

		if (!tipId) {
			return NextResponse.json({ error: "Tip ID is required" }, { status: 400 });
		}

		// Connect to database
		await connectDB();

		// Find profile by user ID
		let profile = await Profile.findOne({ userId });

		// Create profile if it doesn't exist
		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

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
		console.error("Save tip error:", error);
		return NextResponse.json({ error: "Failed to save tip" }, { status: 500 });
	}
}

// Delete endpoint to unsave a tip
export async function DELETE(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Get tip ID from URL search params
		const { searchParams } = new URL(req.url);
		const tipId = searchParams.get("tipId");

		if (!tipId) {
			return NextResponse.json({ error: "Tip ID is required" }, { status: 400 });
		}

		// Connect to database
		await connectDB();

		// Find profile by user ID
		const profile = await Profile.findOne({ userId });

		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

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
		console.error("Unsave tip error:", error);
		return NextResponse.json({ error: "Failed to remove tip from saved tips" }, { status: 500 });
	}
}

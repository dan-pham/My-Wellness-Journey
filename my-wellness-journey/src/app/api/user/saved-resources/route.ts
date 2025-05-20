import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import Profile from "@/models/profile";
import { authenticate } from "@/middleware/auth";
import mongoose from "mongoose";

// Get saved resources
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

		// Return saved resources
		return NextResponse.json({
			success: true,
			savedResources: profile.savedResources || [],
		});
	} catch (error) {
		console.error("Get saved resources error: ", error);
		return NextResponse.json(
			{
				error: "Failed to get saved resources",
			},
			{ status: 500 }
		);
	}
}

// Save a resource
export async function POST(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		const { userId } = authResult;

		// Get resource ID from request body
		const { resourceId } = await req.json();

		if (!resourceId) {
			return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
		}

		// Connect to database
		await connectDB();

		// Find profile by user ID
		let profile = await Profile.findOne({ userId });

		// Create profile if it doesn't exist
		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Check if resource is already saved
		const isAlreadySaved = profile.savedResources.some(
			(resource: { id: string }) => resource.id === resourceId
		);

		if (isAlreadySaved) {
			return NextResponse.json({ error: "Resource already saved" }, { status: 400 });
		}

		// Add tip to saved resources
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
		console.error("Save resource error: ", error);
		return NextResponse.json({ error: "Failed to save resource" }, { status: 500 });
	}
}

// Unsave a resource
export async function DELETE(req: NextRequest) {
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
		await connectDB();

		// Find profile by user ID
		const profile = await Profile.findOne({ userId });

		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Find index of resource in saved resources array
		const resourceIndex = profile.savedResources.findIndex(
			(resource: { id: mongoose.Types.ObjectId }) => resource.id.toString() === resourceId
		);

		if (resourceIndex === -1) {
			return NextResponse.json({ error: "Resource not found in saved resources" }, { status: 404 });
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
		console.error("Unsave resource error:", error);
		return NextResponse.json(
			{ error: "Failed to remove resource from saved resources" },
			{ status: 500 }
		);
	}
}

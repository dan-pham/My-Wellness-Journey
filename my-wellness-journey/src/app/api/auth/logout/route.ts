import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";

export async function POST(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		// Return a success response since logout is handled client-side
		return NextResponse.json({
			success: true,
			message: "Successfully logged out",
		});
	} catch (error) {
		console.error("Logout error: ", error);
		return NextResponse.json({ error: "Logout failed" }, { status: 500 });
	}
}

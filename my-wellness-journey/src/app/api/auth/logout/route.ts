import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";

export async function POST(req: NextRequest) {
	try {
		// Authenticate user
		const authResult = await authenticate(req);
		if (authResult instanceof NextResponse) {
			return authResult;
		}

		// Create response
		const response = NextResponse.json({
			success: true,
			message: "Successfully logged out",
		});

		// Clear the auth cookie
		response.cookies.set({
			name: "auth_token",
			value: "",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 0, // Expire immediately
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Logout error: ", error);
		return NextResponse.json({ error: "Logout failed" }, { status: 500 });
	}
}

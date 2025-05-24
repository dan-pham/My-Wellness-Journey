import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined in environment variables");
}

export async function authenticate(req: NextRequest) {
	try {
		// Get token from HTTP-only cookie instead of headers
		const token = req.cookies.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		const JWT_SECRET = process.env.JWT_SECRET as string;

		try {
			// Verify the token
			const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
			return { userId: decoded.id };
		} catch (error) {
			// Invalid token
			return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
		}
	} catch (error) {
		return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
	}
}

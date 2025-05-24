import { NextRequest, NextResponse } from "next/server";
import { MyHealthFinderService } from "@/lib/api/myhealthfinder";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const keyword = searchParams.get("keyword") || undefined;
		const limit = searchParams.get("limit") || undefined;

		// Health.gov API for evidence-based health tips
		const data = await MyHealthFinderService.searchTopics(keyword, limit);

		// Return the data to the client
		return NextResponse.json(data);
	} catch (error) {
		console.error("Health.gov API proxy error:", error);
		return NextResponse.json({ error: "Failed to fetch health tips" }, { status: 500 });
	}
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const keyword = searchParams.get("keyword") || "general";
		const lang = "en";
		const categoryId = searchParams.get("categoryId") || "health-condition";
		const limit = searchParams.get("limit") || "10";

		// Health.gov API for evidence-based health tips
		const baseUrl = "https://health.gov/myhealthfinder/api/v3/topicsearch.json";

		const params = new URLSearchParams({
			keyword,
			lang,
			categoryId,
			limit,
		});

		// Make server-side request to the external API
		const response = await fetch(`${baseUrl}?${params.toString()}`, {
			headers: {
				Accept: "application/json",
				// You may need to add an API key or other headers if required
			},
		});

		if (!response.ok) {
			throw new Error(`Health.gov API error: ${response.status}`);
		}

		const data = await response.json();

		// Return the data to the client
		return NextResponse.json(data);
	} catch (error) {
		console.error("Health.gov API proxy error:", error);
		return NextResponse.json({ error: "Failed to fetch health tips" }, { status: 500 });
	}
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = params.id;

		if (!id) {
			return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
		}

		// Health.gov API for specific topic
		const baseUrl = "https://health.gov/myhealthfinder/api/v3/topicsearch.json";

		const searchParams = new URLSearchParams({
			topicId: id,
			lang: "en",
		});

		// Make server-side request to the external API
		const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
			headers: {
				Accept: "application/json",
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
		return NextResponse.json({ error: "Failed to fetch health tip" }, { status: 500 });
	}
}

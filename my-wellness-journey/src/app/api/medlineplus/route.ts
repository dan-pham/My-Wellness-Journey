import { NextRequest, NextResponse } from "next/server";
import { searchMedlinePlus } from "@/lib/api/medlineplus";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const query = searchParams.get("query") || "";
	const maxResults = searchParams.get("maxResults")
		? parseInt(searchParams.get("maxResults") || "10", 10)
		: 10;

	if (!query.trim()) {
		return NextResponse.json({ total: 0, results: [] });
	}

	try {
		const data = await searchMedlinePlus(query, maxResults);
		return NextResponse.json(data);
	} catch (error) {
		console.error("MedlinePlus API Error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch MedlinePlus data.",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

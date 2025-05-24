import { NextRequest, NextResponse } from "next/server";
import { MyHealthFinderService } from "@/lib/api/myhealthfinder";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { id } = params;

		if (!id) {
			return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
		}

		const data = await MyHealthFinderService.getTopicById(id);
		return NextResponse.json(data);
	} catch (error) {
		console.error("Health.gov API proxy error:", error);
		return NextResponse.json({ error: "Failed to fetch health tip" }, { status: 500 });
	}
}

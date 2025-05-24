import { NextRequest, NextResponse } from "next/server";
import { fetchMedlinePlusById } from "@/lib/api/medlineplus";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = params.id;

		if (!id) {
			return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
		}

		const data = await fetchMedlinePlusById(id);
		return NextResponse.json(data);
	} catch (error) {
		console.error("MedlinePlus API proxy error:", error);

		if (error instanceof Error && error.message.includes("Invalid MedlinePlus URL")) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json({ error: "Failed to fetch health tip" }, { status: 500 });
	}
}

import { MedlinePlusUrlFormatter } from "@/utils/medlineplus/urlFormatter";
import { HtmlProcessor } from "@/utils/medlineplus/htmlProcessor";

export interface MedlinePlusResponse {
	url: string;
	title: string;
	content: string;
	metadata: any;
	source: string;
}

export class MedlinePlusService {
	static async fetchById(id: string): Promise<MedlinePlusResponse> {
		// Format the URL
		const urlFormatter = new MedlinePlusUrlFormatter(id);
		const medlineUrl = urlFormatter.format();

		// Fetch the content
		const response = await fetch(medlineUrl, {
			headers: {
				Accept: "text/html",
				"User-Agent": "Mozilla/5.0 (compatible; HealthApp/1.0)",
			},
		});

		if (!response.ok) {
			throw new Error(`MedlinePlus API error: ${response.status}`);
		}

		const html = await response.text();
		const processor = new HtmlProcessor(html);

		return {
			url: medlineUrl,
			title: processor.extractTitle(),
			content: processor.extractContent(),
			metadata: processor.extractJsonLd(),
			source: "MedlinePlus",
		};
	}
}

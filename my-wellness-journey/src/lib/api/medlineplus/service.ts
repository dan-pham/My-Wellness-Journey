import { MedlinePlusSearchResponse, MedlinePlusSearchResult, MedlinePlusResponse } from "./types";
import { stripHtmlTags, parseXmlResponse, extractSearchResults } from "./utils";
import { MedlinePlusUrlFormatter } from "@/utils/medlineplus/urlFormatter";
import { HtmlProcessor } from "@/utils/medlineplus/htmlProcessor";

/**
 * Search MedlinePlus for health information
 */
export async function searchMedlinePlus(
	query: string,
	maxResults: number = 10
): Promise<MedlinePlusSearchResponse> {
	if (!query) {
		return { total: 0, results: [] };
	}

	try {
		// Use the MedlinePlus Web Service API
		const baseUrl = "https://wsearch.nlm.nih.gov/ws/query";

		// Build the API parameters
		const params = new URLSearchParams({
			db: "healthTopics",
			term: query,
			retmax: maxResults.toString(),
		});

		const apiUrl = `${baseUrl}?${params.toString()}`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`MedlinePlus API error: ${response.status}`);
		}

		// Get the response as text
		const xmlText = await response.text();
		const parsed = parseXmlResponse(xmlText);
		const results = extractSearchResults(parsed);

		return {
			total: results.length,
			results,
		};
	} catch (error) {
		console.error("Error searching MedlinePlus:", error);
		throw error;
	}
}

/**
 * Get detailed information about a specific health topic by URL
 */
export async function getHealthTopicDetails(url: string): Promise<any> {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch resource: ${response.status}`);
		}

		const html = await response.text();
		const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

		if (jsonLdMatch && jsonLdMatch[1]) {
			try {
				return JSON.parse(jsonLdMatch[1]);
			} catch (e) {
				console.error("Failed to parse JSON-LD from page", e);
			}
		}

		// Return a simplified object if JSON-LD isn't available
		return {
			url,
			title: html.match(/<title>(.*?)<\/title>/)?.[1] || "Unknown Topic",
		};
	} catch (error) {
		console.error("Error fetching health topic details:", error);
		throw error;
	}
}

/**
 * Fetch MedlinePlus content by ID or URL
 */
export async function fetchMedlinePlusById(id: string): Promise<MedlinePlusResponse> {
	try {
		// Extract the topic from the URL or ID
		let topic = id;
		if (id.startsWith("medline-")) {
			const urlFormatter = new MedlinePlusUrlFormatter(id);
			const url = urlFormatter.format();
			// Extract the topic from the URL
			topic = url.split("medlineplus.gov/")[1]?.split("/")[0] || "";
		}

		// Search for the topic using the API
		const searchResults = await searchMedlinePlus(topic, 1);

		if (!searchResults.results.length) {
			throw new Error("No content found for this topic");
		}

		const result = searchResults.results[0];

		return {
			url: result.url,
			title: result.title,
			content: result.snippet,
			metadata: {},
			source: "MedlinePlus",
		};
	} catch (error) {
		console.error("Error fetching MedlinePlus content:", error);
		throw error;
	}
}

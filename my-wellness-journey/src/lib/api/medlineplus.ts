// import { parseXML, cleanText, decodeHtmlEntities } from "@/utils/xmlParser";
import { xml2js } from "xml-js";

export interface MedlinePlusSearchResult {
	title: string;
	url: string;
	snippet: string;
	categories: string[];
}

export interface MedlinePlusSearchResponse {
	total: number;
	results: MedlinePlusSearchResult[];
}

/**
 * Search MedlinePlus for health information
 * @param query - The search term
 * @param language - Optional language filter (en, es)
 * @param maxResults - Maximum number of results to return
 * @returns Promise with search results
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

		// Parse XML using the compact format
		const parsed = xml2js(xmlText, {
			compact: true,
			trim: true,
			nativeType: true,
		}) as any;

		// Initialize results array
		const results: MedlinePlusSearchResult[] = [];

		// Check if we have valid parsed data
		if (!parsed || !parsed.nlmSearchResult || !parsed.nlmSearchResult.list) {
			console.warn("Invalid or empty API response structure");
			return { total: 0, results: [] };
		}

		// Get the document array, handling both single item and array cases
		let documents = parsed.nlmSearchResult.list.document;
		if (!documents) {
			console.warn("No documents found in response");
			return { total: 0, results: [] };
		}

		// Ensure documents is an array even if there's only one result
		if (!Array.isArray(documents)) {
			documents = [documents];
		}

		// Process each document
		for (const doc of documents) {
			// Skip if no document or URL
			if (!doc || !doc._attributes || !doc._attributes.url) continue;

			const url = doc._attributes.url;
			let title = "";
			let snippet = "";
			const categories: string[] = [];

			// The content is an array of items with different name attributes
			if (doc.content) {
				const contentItems = Array.isArray(doc.content) ? doc.content : [doc.content];

				for (const item of contentItems) {
					if (!item || !item._attributes || !item._attributes.name) continue;

					const name = item._attributes.name;
					const text = item._text || "";

					// Extract content based on attribute name
					if (name === "title") {
						title = stripHtmlTags(text);
					} else if (name === "snippet") {
						snippet = stripHtmlTags(text);
					} else if (name === "groupName") {
						categories.push(stripHtmlTags(text));
					}
				}
			}

			// Add this result
			results.push({
				title,
				url,
				snippet,
				categories: categories,
			});
		}

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
 * Helper function to strip HTML tags from text
 * @param html - Text that may contain HTML tags
 * @returns Clean text without HTML tags
 */
function stripHtmlTags(html: string): string {
	// Remove HTML tags including span elements used for highlighting
	return html.replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * Get detailed information about a specific health topic by URL
 * @param url - The URL of the health topic
 * @returns Promise with detailed health topic data
 */
export async function getHealthTopicDetails(url: string): Promise<any> {
	try {
		// Some MedlinePlus pages have an associated JSON-LD structure we can extract
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch resource: ${response.status}`);
		}

		const html = await response.text();

		// This is a simple extraction and might need adjustment based on actual page structure
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

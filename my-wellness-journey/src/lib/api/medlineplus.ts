import { parseXML, cleanText, decodeHtmlEntities } from "@/utils/xmlParser";

export interface MedlinePlusSearchResult {
	title: string;
	url: string;
	snippet: string;
	categories?: string[];
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

		// We'll manually extract the needed information
		const results: MedlinePlusSearchResult[] = [];

		// Simple XML parsing using string manipulation
		// Look for document nodes with URLs
		const docMatches = xmlText.match(/<document[^>]*url="([^"]+)"[^>]*>/g);
		const total = docMatches ? docMatches.length : 0;

		if (docMatches) {
			for (const docMatch of docMatches) {
				// Extract the URL
				const urlMatch = docMatch.match(/url="([^"]+)"/);
				const url = urlMatch ? urlMatch[1] : "";

				if (!url) continue;

				// Find the corresponding document section (from start to end)
				const docStartIndex = xmlText.indexOf(docMatch);
				const docEndIndex = xmlText.indexOf("</document>", docStartIndex);

				if (docStartIndex === -1 || docEndIndex === -1) continue;

				const docContent = xmlText.substring(docStartIndex, docEndIndex + 11); // 11 is the length of "</document>"

				// Extract title
				let title = extractContentByName(docContent, "title");

				// Extract snippet
				let snippet = extractContentByName(docContent, "snippet");

				// Extract categories
				const categories: string[] = [];
				let groupMatch;
				const groupNameRegex = /<content name="groupName">(.*?)<\/content>/g;

				while ((groupMatch = groupNameRegex.exec(docContent)) !== null) {
					if (groupMatch[1]) {
						const category = cleanText(groupMatch[1]);
						if (category) categories.push(category);
					}
				}

				results.push({
					title: cleanText(title),
					url,
					snippet: cleanText(snippet),
					categories: categories.length > 0 ? categories : undefined,
				});
			}
		}

		return {
			total,
			results,
		};
	} catch (error) {
		console.error("Error searching MedlinePlus:", error);
		throw error;
	}
}

/**
 * Helper function to extract content by name from XML string
 */
function extractContentByName(xml: string, name: string): string {
	const regex = new RegExp(`<content name="${name}">(.*?)<\\/content>`, "s");
	const match = xml.match(regex);
	return match ? match[1] : "";
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

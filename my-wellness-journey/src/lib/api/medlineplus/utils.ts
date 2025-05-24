import { xml2js } from "xml-js";
import { MedlinePlusSearchResult } from "./types";

/**
 * Helper function to strip HTML tags from text
 * @param html - Text that may contain HTML tags
 * @returns Clean text without HTML tags
 */
export function stripHtmlTags(html: string): string {
	// Remove HTML tags including span elements used for highlighting
	return html.replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * Parse XML response to JavaScript object
 */
export function parseXmlResponse(xmlText: string): any {
	return xml2js(xmlText, {
		compact: true,
		trim: true,
		nativeType: true,
	});
}

/**
 * Extract search results from parsed XML data
 */
export function extractSearchResults(parsedData: any): MedlinePlusSearchResult[] {
	const results: MedlinePlusSearchResult[] = [];

	if (!parsedData || !parsedData.nlmSearchResult || !parsedData.nlmSearchResult.list) {
		console.warn("Invalid or empty API response structure");
		return results;
	}

	// Get the document array, handling both single item and array cases
	let documents = parsedData.nlmSearchResult.list.document;
	if (!documents) {
		console.warn("No documents found in response");
		return results;
	}

	// Ensure documents is an array
	documents = Array.isArray(documents) ? documents : [documents];

	// Process each document
	for (const doc of documents) {
		if (!doc || !doc._attributes || !doc._attributes.url) continue;

		const url = doc._attributes.url;
		let title = "";
		let snippet = "";

		// Process content items
		if (doc.content) {
			const contentItems = Array.isArray(doc.content) ? doc.content : [doc.content];

			for (const item of contentItems) {
				if (!item || !item._attributes || !item._attributes.name) continue;

				const name = item._attributes.name;
				const text = item._text || "";

				// Extract content
				if (name === "title") {
					title = stripHtmlTags(text);
				} else if (name === "snippet") {
					snippet = stripHtmlTags(text);
				}
			}
		}

		// Add this result
		results.push({ title, url, snippet });
	}

	return results;
}

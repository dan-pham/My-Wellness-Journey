/**
 * Utility functions for XML text processing
 */

export function parseXML(xmlText: string): Document | XMLDocument {
	if (typeof window !== "undefined" && window.DOMParser) {
		const parser = new window.DOMParser();
		return parser.parseFromString(xmlText, "text/xml");
	} else {
		// For server-side, we'll use string manipulation instead
		// Return a minimal document-like object
		return {} as Document;
	}
}

/**
 * Decode HTML entities in a string
 */
export function decodeHtmlEntities(text: string): string {
	if (typeof window !== "undefined") {
		// In browser, use DOM to decode
		const textarea = document.createElement("textarea");
		textarea.innerHTML = text;
		return textarea.value;
	} else {
		// In server, use regex-based approach
		return text
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&amp;/g, "&");
	}
}

export function cleanText(text: string): string {
	// First decode any HTML entities in the text
	const decoded = decodeHtmlEntities(text);

	// Then remove any HTML tags
	const withoutTags = decoded.replace(/<\/?[^>]+(>|$)/g, "");

	// Finally normalize spaces
	return withoutTags.replace(/\s+/g, " ").trim();
}

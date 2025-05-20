import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = params.id;

		if (!id) {
			return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
		}

		// Extract the URL from the ID and fix the format issues
		let medlineUrl;

		try {
			// The ID format is likely malformed, let's try to fix common issues

			// First, remove the 'medline-' prefix if it exists
			let urlPart = id.startsWith("medline-") ? id.substring(8) : id;

			// Try to reconstruct the URL properly
			// If we have https/// pattern, fix it
			if (urlPart.includes("https///")) {
				urlPart = urlPart.replace("https///", "https://");
			}

			// Fix other common URL formatting issues
			if (urlPart.includes("/gov/")) {
				urlPart = urlPart.replace("/gov/", ".gov/");
			}

			// Replace hyphens with slashes where appropriate
			// But be careful not to replace hyphens that are part of words
			if (!urlPart.startsWith("http")) {
				// If it doesn't start with http, it's likely a path or domain with hyphens
				// Let's try to reconstruct it
				if (urlPart.includes("medlineplus")) {
					// This is likely supposed to be medlineplus.gov
					urlPart =
						"https://medlineplus.gov/" + urlPart.split("medlineplus-")[1].replace(/-/g, "/");
				} else {
					// Generic case, assume it's just a path
					urlPart = "https://" + urlPart.replace(/-/g, "/");
				}
			}

			// Finally, make sure the URL is valid
			medlineUrl = new URL(urlPart).toString();
		} catch (urlError) {
			console.error("Error reconstructing URL:", urlError);
			return NextResponse.json(
				{ error: `Invalid MedlinePlus URL format: ${urlError}` },
				{ status: 400 }
			);
		}

		// Fetch the page content
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

		// Extract relevant information from the HTML
		const title = extractTitle(html);
		const content = extractContent(html);
		const jsonLd = extractJsonLd(html);

		// Format the data for the client
		const data = {
			url: medlineUrl,
			title: title,
			content: content,
			metadata: jsonLd,
			source: "MedlinePlus",
		};

		// Return the data to the client
		return NextResponse.json(data);
	} catch (error) {
		console.error("MedlinePlus API proxy error:", error);
		return NextResponse.json({ error: "Failed to fetch health tip" }, { status: 500 });
	}
}

/**
 * Extract the page title from HTML
 */
function extractTitle(html: string): string {
	const titleMatch = html.match(/<title>(.*?)<\/title>/i);
	return titleMatch ? titleMatch[1].replace(" - MedlinePlus", "") : "Health Topic";
}

/**
 * Extract the main content from the HTML
 */
function extractContent(html: string): string {
	// Look for the main content area
	// Try to find the topic-summary div first
	let mainContentMatch = html.match(/<div\s+id="topic-summary"[^>]*>([\s\S]*?)<\/div>/i);

	if (!mainContentMatch) {
		// Try to find main content area with a different pattern
		mainContentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
	}

	if (mainContentMatch && mainContentMatch[1]) {
		// Sanitize HTML to keep important formatting but remove scripts and iframes
		return sanitizeHtml(mainContentMatch[1]);
	}

	// Fallback to looking for article content
	const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
	if (articleMatch && articleMatch[1]) {
		return sanitizeHtml(articleMatch[1]);
	}

	// Second fallback to looking for the first substantial paragraph
	const paragraphMatch = html.match(/<p>([\s\S]*?)<\/p>/i);
	if (paragraphMatch && paragraphMatch[1]) {
		return `<p>${sanitizeHtml(paragraphMatch[1])}</p>`;
	}

	return "<p>Visit the source page for more information.</p>";
}

/**
 * Extract JSON-LD structured data if available
 */
function extractJsonLd(html: string): any {
	const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);

	if (jsonLdMatch && jsonLdMatch[1]) {
		try {
			return JSON.parse(jsonLdMatch[1]);
		} catch (e) {
			console.error("Failed to parse JSON-LD:", e);
		}
	}

	return null;
}

/**
 * Clean HTML content by removing tags and normalizing whitespace
 * We'll keep this for generating plain text for previews
 */
function cleanHtml(html: string): string {
	return html
		.replace(/<\/?[^>]+(>|$)/g, " ") // Remove HTML tags
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim(); // Trim leading/trailing whitespace
}

/**
 * Sanitize HTML to keep formatting but remove potentially harmful elements
 */
function sanitizeHtml(html: string): string {
	// First, ensure lists are properly formatted
	let processedHtml = html
		// Fix common list structure issues
		.replace(/<ul\s*>\s*<li/g, "<ul>\n<li")
		.replace(/<\/li>\s*<li/g, "</li>\n<li")
		.replace(/<\/li>\s*<\/ul/g, "</li>\n</ul")
		// Same for ordered lists
		.replace(/<ol\s*>\s*<li/g, "<ol>\n<li")
		.replace(/<\/li>\s*<\/ol/g, "</li>\n</ol")
		// Ensure paragraphs have proper spacing
		.replace(/<\/p>\s*<p>/g, "</p>\n<p>");

	// Now clean the HTML of unwanted elements
	processedHtml = processedHtml
		// Remove scripts, iframes, and other potentially harmful tags
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
		.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
		// Remove on* attributes (e.g., onclick, onload)
		.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
		// Fix any malformed HTML
		.replace(/(<img[^>]+)(?!\/>|>)([^<]*)/gi, "$1 />$2")
		// Remove specific elements by class or ID
		.replace(/<div\s+class="mhp-social-wrapper"[^>]*>[\s\S]*?<\/div>/gi, "")
		.replace(/<div\s+class="[^"]*advertisement[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
		// Add explicit styles for lists and paragraphs for consistent rendering
		.replace(/<ul/g, '<ul style="list-style-type: disc; margin: 1em 0; padding-left: 2em;"')
		.replace(/<ol/g, '<ol style="list-style-type: decimal; margin: 1em 0; padding-left: 2em;"')
		.replace(/<li/g, '<li style="display: list-item; margin: 0.5em 0;"')
		.replace(/<p/g, '<p style="margin: 1em 0; line-height: 1.6;"')
		// Preserve whitespace in pre tags
		.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, function (match, content) {
			return '<pre style="white-space: pre-wrap; word-wrap: break-word;">' + content + "</pre>";
		})
		// Normalize whitespace in attributes (but be careful not to remove whitespace in content)
		.replace(/\s{2,}/g, " ")
		.trim();

	return processedHtml;
}

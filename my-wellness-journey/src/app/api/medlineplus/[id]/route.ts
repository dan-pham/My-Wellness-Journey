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
			console.log("Reconstructed URL:", medlineUrl);
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
	// This is a simple extraction that looks for the main content area
	// You may need to adjust this based on the actual MedlinePlus page structure

	// Try to find the main content area
	const mainContentMatch = html.match(/<div\s+id="topic-summary"[^>]*>([\s\S]*?)<\/div>/i);
	if (mainContentMatch && mainContentMatch[1]) {
		// Clean the HTML to get just the text
		return cleanHtml(mainContentMatch[1]);
	}

	// Fallback to looking for the first paragraph
	const paragraphMatch = html.match(/<p>([\s\S]*?)<\/p>/i);
	if (paragraphMatch && paragraphMatch[1]) {
		return cleanHtml(paragraphMatch[1]);
	}

	return "Visit the source page for more information.";
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
 */
function cleanHtml(html: string): string {
	return html
		.replace(/<\/?[^>]+(>|$)/g, " ") // Remove HTML tags
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim(); // Trim leading/trailing whitespace
}

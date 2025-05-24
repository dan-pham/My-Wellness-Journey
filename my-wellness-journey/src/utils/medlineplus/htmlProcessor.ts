export class HtmlProcessor {
	private html: string;

	constructor(html: string) {
		this.html = html;
	}

	public extractTitle(): string {
		const titleMatch = this.html.match(/<title>(.*?)<\/title>/i);
		return titleMatch ? titleMatch[1].replace(" - MedlinePlus", "") : "Health Topic";
	}

	public extractContent(): string {
		// Try topic-summary div first
		let content = this.extractBySelector("#topic-summary");

		// Try main content area
		if (!content) content = this.extractBySelector("main");

		// Try article content
		if (!content) content = this.extractBySelector("article");

		// Fallback to first paragraph
		if (!content) {
			const paragraphMatch = this.html.match(/<p>([\s\S]*?)<\/p>/i);
			if (paragraphMatch && paragraphMatch[1]) {
				content = `<p>${this.sanitizeHtml(paragraphMatch[1])}</p>`;
			}
		}

		return content || "<p>Visit the source page for more information.</p>";
	}

	public extractJsonLd(): any {
		const jsonLdMatch = this.html.match(
			/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i
		);

		if (jsonLdMatch && jsonLdMatch[1]) {
			try {
				return JSON.parse(jsonLdMatch[1]);
			} catch (e) {
				console.error("Failed to parse JSON-LD:", e);
			}
		}

		return null;
	}

	private extractBySelector(selector: string): string | null {
		const pattern = new RegExp(`<${selector}[^>]*>([\s\S]*?)<\/${selector}>`, "i");
		const match = this.html.match(pattern);
		return match ? this.sanitizeHtml(match[1]) : null;
	}

	private sanitizeHtml(html: string): string {
		return (
			html
				// Format lists
				.replace(/<ul\s*>\s*<li/g, "<ul>\n<li")
				.replace(/<\/li>\s*<li/g, "</li>\n<li")
				.replace(/<\/li>\s*<\/ul/g, "</li>\n</ul")
				.replace(/<ol\s*>\s*<li/g, "<ol>\n<li")
				.replace(/<\/li>\s*<\/ol/g, "</li>\n</ol")
				.replace(/<\/p>\s*<p>/g, "</p>\n<p>")
				// Remove harmful elements
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
				.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
				.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
				.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
				.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
				// Add styles
				.replace(/<ul/g, '<ul style="list-style-type: disc; margin: 1em 0; padding-left: 2em;"')
				.replace(/<ol/g, '<ol style="list-style-type: decimal; margin: 1em 0; padding-left: 2em;"')
				.replace(/<li/g, '<li style="display: list-item; margin: 0.5em 0;"')
				.replace(/<p/g, '<p style="margin: 1em 0; line-height: 1.6;"')
		);
	}
}

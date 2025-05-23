export class MedlinePlusUrlFormatter {
	private urlPart: string;

	constructor(id: string) {
		// Remove the 'medline-' prefix if it exists
		this.urlPart = id.startsWith("medline-") ? id.substring(8) : id;
		
		// URL decode the part if it's encoded
		try {
			// Double decode to handle double-encoded URLs
			this.urlPart = decodeURIComponent(decodeURIComponent(this.urlPart));
		} catch (e) {
			try {
				// Try single decode if double decode fails
				this.urlPart = decodeURIComponent(this.urlPart);
			} catch (e2) {
				// If both fail, use the original
				console.warn("Failed to decode URL part:", e2);
			}
		}
	}

	private fixHttpsPattern(): void {
		if (this.urlPart.includes("https///")) {
			this.urlPart = this.urlPart.replace("https///", "https://");
		}
	}

	private fixDomainFormat(): void {
		if (this.urlPart.includes("/gov/")) {
			this.urlPart = this.urlPart.replace("/gov/", ".gov/");
		}
	}

	private reconstructUrl(): void {
		// If it's already a valid URL, just return it
		try {
			const url = new URL(this.urlPart);
			if (url.hostname.includes("medlineplus.gov")) {
				return;
			}
		} catch (e) {
			// Not a valid URL, continue with reconstruction
		}

		// If it's not a valid URL, ensure it's a proper MedlinePlus URL
		if (!this.urlPart.startsWith("http")) {
			// Remove any invalid characters that might have come from task IDs
			const cleanPart = this.urlPart.replace(/[^a-zA-Z0-9-/]/g, "");
			
			if (cleanPart.includes("medlineplus")) {
				this.urlPart = "https://medlineplus.gov/" + cleanPart.split("medlineplus-")[1]?.replace(/-/g, "/");
			} else {
				this.urlPart = "https://medlineplus.gov/health/" + cleanPart.replace(/-/g, "/");
			}
		}
	}

	public format(): string {
		try {
			this.fixHttpsPattern();
			this.fixDomainFormat();
			this.reconstructUrl();
			
			// Validate the final URL
			const url = new URL(this.urlPart);
			if (!url.hostname.includes("medlineplus.gov")) {
				throw new Error("Invalid MedlinePlus URL");
			}
			return url.toString();
		} catch (e) {
			throw new Error(`Invalid MedlinePlus URL: ${this.urlPart}`);
		}
	}
}

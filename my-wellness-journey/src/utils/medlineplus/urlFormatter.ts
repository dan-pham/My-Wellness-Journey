export class MedlinePlusUrlFormatter {
	private urlPart: string;

	constructor(id: string) {
		// Remove the 'medline-' prefix if it exists
		this.urlPart = id.startsWith("medline-") ? id.substring(8) : id;
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
		if (!this.urlPart.startsWith("http")) {
			if (this.urlPart.includes("medlineplus")) {
				this.urlPart =
					"https://medlineplus.gov/" + this.urlPart.split("medlineplus-")[1].replace(/-/g, "/");
			} else {
				this.urlPart = "https://" + this.urlPart.replace(/-/g, "/");
			}
		}
	}

	public format(): string {
		this.fixHttpsPattern();
		this.fixDomainFormat();
		this.reconstructUrl();
		return new URL(this.urlPart).toString();
	}
}

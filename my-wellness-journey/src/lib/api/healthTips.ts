export interface HealthTip {
	id: string;
	title: string;
	content: string;
	category: string;
	conditions: string[];
	source?: string;
	sourceUrl?: string;
	imageUrl?: string;
}

export interface HealthTipsResponse {
	success: boolean;
	tips: HealthTip[];
}

/**
 * Fetch health tips based on user conditions
 * @param conditions - Array of chronic conditions the user has
 * @param count - Number of tips to retrieve (default: 1 for daily tip)
 * @returns Promise with health tips
 */
export async function fetchHealthTips(
	conditions: string[] = [],
	count: number = 1
): Promise<HealthTipsResponse> {
	try {
		const keywords = conditions.join(" ");

		const params = new URLSearchParams({
			keyword: keywords || "general",
			lang: "en",
			categoryId: "health-condition",
			limit: count.toString(),
		});

		const response = await fetch(`/api/healthtips?${params.toString()}`);

		if (!response.ok) {
			console.error("Health tips API error:", response.status);
			throw new Error(`Health tips API error: ${response.status}`);
		}

		const data = await response.json();

		console.log(data);

		// Check if the response has the expected structure
		if (!data.Result || !data.Result.Resources || !data.Result.Resources.Resource) {
			console.error("Unexpected API response structure:", data);
			throw new Error("Unexpected API response structure");
		}

		// Normalize the API response which can be a single object or an array
		const resources = Array.isArray(data.Result.Resources.Resource)
			? data.Result.Resources.Resource
			: [data.Result.Resources.Resource];

		const tips: HealthTip[] = resources.map((resource: any) => {
			// Extract the first section content, which contains the main information
			const sectionContent = resource.Sections?.section?.[0]?.Content || "";

			// Get a category from the resource if available
			let category = "Health Information";
			if (resource.Categories && resource.Categories.trim() !== "") {
				category = resource.Categories;
			} else if (conditions.length > 0) {
				category = conditions[0].charAt(0).toUpperCase() + conditions[0].slice(1);
			}

			return {
				id: resource.Id || Math.random().toString(36).substring(2, 9),
				title: resource.Title || "Health Tip",
				content: sectionContent || resource.MyHFDescription || "No content available",
				category: category,
				conditions: conditions.length ? conditions : ["general"],
				source: "health.gov",
				sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
				imageUrl: resource.ImageUrl || null,
			};
		});

		return {
			success: true,
			tips,
		};
	} catch (error) {
		console.error("Error fetching health tips:", error);
		return {
			success: false,
			tips: [],
		};
	}
}

export async function fetchHealthTipById(id: string): Promise<HealthTip | null> {
	try {
		const response = await fetch(`/api/myhealthfinder/${id}`);

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();

		// Check if we got a valid response
		if (!data.Result || !data.Result.Resources || !data.Result.Resources.Resource) {
			return null;
		}

		// Get resource
		const resource = Array.isArray(data.Result.Resources.Resource)
			? data.Result.Resources.Resource[0]
			: data.Result.Resources.Resource;

		if (!resource) {
			return null;
		}

		// Extract content
		const sectionContent = resource.Sections?.section?.[0]?.Content || "";

		// Get high-resolution image URL if available
		const imageUrl = resource.ImageUrl?.replace("Small", "Large") || resource.ImageUrl;

		return {
			id: resource.Id,
			title: resource.Title || "Health Resource",
			content: sectionContent || resource.MyHFDescription || "No content available",
			category: resource.Categories || "Health Information",
			conditions: ["general"],
			source: "health.gov",
			sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
			imageUrl: imageUrl,
		};
	} catch (error) {
		console.error("Error fetching health tip by ID:", error);
		return null;
	}
}

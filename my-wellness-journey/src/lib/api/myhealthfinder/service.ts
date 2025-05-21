import { MyHealthFinder, MyHealthFinderResponse } from "./types";
import { MYHEALTHFINDER_CONFIG } from "@/config/myhealthfinder";

/**
 * Fetch health data based on user conditions
 * @param conditions - Array of chronic conditions the user has
 * @param count - Number of data to retrieve (default: 1)
 * @returns Promise with health data
 */
export async function fetchHealthData(
	query: string,
	count: number = 1
): Promise<MyHealthFinderResponse> {
	try {
		const params = new URLSearchParams({
			keyword: query || "general",
			lang: "en",
			limit: count.toString(),
		});

		const response = await fetch(`/api/myhealthfinder?${params.toString()}`);

		if (!response.ok) {
			console.error("HealthFinder API error:", response.status);
			throw new Error(`HealthFinder API error: ${response.status}`);
		}

		const data = await response.json();

		// Check if the response has the expected structure
		if (!data.Result || !data.Result.Resources || !data.Result.Resources.Resource) {
			console.error("Unexpected API response structure:", data);
			throw new Error("Unexpected API response structure");
		}

		// Normalize the API response which can be a single object or an array
		const resources = Array.isArray(data.Result.Resources.Resource)
			? data.Result.Resources.Resource
			: [data.Result.Resources.Resource];

		const healthData: MyHealthFinder[] = resources.map((resource: any) => {
			// Extract the first section content, which contains the main information
			const sectionContent = resource.Sections?.section?.[0]?.Content || "";

			return {
				id: resource.Id || Math.random().toString(36).substring(2, 9),
				title: resource.Title || "Health Tip",
				content: sectionContent || resource.MyHFDescription || "No content available",
				conditions: query,
				source: "health.gov",
				sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
				imageUrl: resource.ImageUrl || null,
			};
		});

		return {
			success: true,
			healthData,
		};
	} catch (error) {
		console.error("Error fetching health data:", error);
		return {
			success: false,
			healthData: [],
		};
	}
}

export async function fetchHealthDataById(id: string): Promise<MyHealthFinder | null> {
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
			conditions: ["general"],
			source: "health.gov",
			sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
			imageUrl: imageUrl,
		};
	} catch (error) {
		console.error("Error fetching health data by ID:", error);
		return null;
	}
}

export class MyHealthFinderService {
	static async searchTopics(keyword?: string, limit?: string) {
		const params = new URLSearchParams({
			keyword: keyword || MYHEALTHFINDER_CONFIG.defaultKeyword,
			lang: MYHEALTHFINDER_CONFIG.defaultLanguage,
			limit: limit || MYHEALTHFINDER_CONFIG.defaultLimit,
		});

		return this.makeRequest(params);
	}

	static async getTopicById(id: string) {
		const params = new URLSearchParams({
			topicId: id,
			lang: MYHEALTHFINDER_CONFIG.defaultLanguage,
		});

		return this.makeRequest(params);
	}

	private static async makeRequest(params: URLSearchParams) {
		const response = await fetch(`${MYHEALTHFINDER_CONFIG.baseUrl}?${params.toString()}`, {
			headers: MYHEALTHFINDER_CONFIG.headers,
		});

		if (!response.ok) {
			throw new Error(`Health.gov API error: ${response.status}`);
		}

		return response.json();
	}
}

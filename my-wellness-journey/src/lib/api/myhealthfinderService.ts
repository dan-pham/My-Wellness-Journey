import { MYHEALTHFINDER_CONFIG } from "@/config/myhealthfinder";

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

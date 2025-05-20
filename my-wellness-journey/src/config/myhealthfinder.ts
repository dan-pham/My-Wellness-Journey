export const MYHEALTHFINDER_CONFIG = {
	baseUrl: "https://health.gov/myhealthfinder/api/v3/topicsearch.json",
	defaultLanguage: "en",
	defaultLimit: "10",
	defaultKeyword: "general",
	headers: {
		Accept: "application/json",
	},
} as const;

export interface MyHealthFinderError {
	message: string;
	status?: number;
}

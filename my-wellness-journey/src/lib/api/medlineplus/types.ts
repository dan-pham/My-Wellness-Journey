export interface MedlinePlusSearchResult {
	title: string;
	url: string;
	snippet: string;
}

export interface MedlinePlusSearchResponse {
	total: number;
	results: MedlinePlusSearchResult[];
}

export interface MedlinePlusResponse {
	url: string;
	title: string;
	content: string;
	metadata: any;
	source: string;
}

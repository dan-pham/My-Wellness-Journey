export interface MyHealthFinder {
	id: string;
	title: string;
	content: string;
	conditions: string[];
	sourceUrl: string;
	source?: string;
	imageUrl?: string;
}

export interface MyHealthFinderResponse {
	success: boolean;
	healthData: MyHealthFinder[];
}

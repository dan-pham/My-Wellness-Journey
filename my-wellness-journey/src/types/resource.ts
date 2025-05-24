export interface Resource {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	sourceUrl: string;
}

export interface ResourceDetail extends Resource {
	content: string;
}

export interface Tip {
	id: string;
	task: string;
	reason: string;
	sourceUrl: string;
	saved?: boolean;
	dateGenerated?: string;
	tag?: string[];
}

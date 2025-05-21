export interface Tip {
	id: string;
	task: string;
	reason: string;
	sourceUrl: string;
	done?: boolean;
	saved?: boolean;
	dateGenerated?: string;
	tag?: string[];
}

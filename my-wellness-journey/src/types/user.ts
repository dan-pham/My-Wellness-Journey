export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	profile?: {
		age?: number;
		gender?: string;
		conditions?: Array<{
			id: string;
			name: string;
		}>;
		savedResources?: Array<{
			id: string;
			savedAt: string;
		}>;
		savedTips?: Array<{
			id: string;
			savedAt: string;
		}>;
	};
	createdAt?: string;
	updatedAt?: string;
}

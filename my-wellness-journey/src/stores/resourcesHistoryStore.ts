import { create } from "zustand";

interface ResourceHistoryItem {
	id: string;
	title: string;
	description: string;
	category: string;
	imageUrl: string;
	sourceUrl: string;
}

interface ResourcesHistoryState {
	history: ResourceHistoryItem[];
	addResource: (resource: ResourceHistoryItem) => void;
	getRecentResources: (count: number) => ResourceHistoryItem[];
}

// Simple non-persistent store to avoid SSR issues
export const useResourcesHistoryStore = create<ResourcesHistoryState>()((set, get) => ({
	history: [],
	addResource: (resource) =>
		set((state) => ({
			// Deduplicate by removing any existing item with same ID and add to front
			history: [resource, ...state.history.filter((item) => item.id !== resource.id)].slice(0, 12),
		})),
	getRecentResources: (count) => {
		// Return the function result directly
		return get().history.slice(0, count);
	},
}));

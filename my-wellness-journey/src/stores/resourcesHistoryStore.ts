import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export const useResourcesHistoryStore = create<ResourcesHistoryState>()(
	persist(
		(set, get) => ({
			history: [],
			addResource: (resource) =>
				set((state) => ({
					// Deduplicate by removing any existing item with same ID and add to front
					history: [resource, ...state.history.filter((item) => item.id !== resource.id)].slice(
						0,
						12
					),
				})),
			getRecentResources: (count) => {
				// Return the function result directly
				return get().history.slice(0, count);
			},
		}),
		{
			name: "resources-history-storage",
		}
	)
);

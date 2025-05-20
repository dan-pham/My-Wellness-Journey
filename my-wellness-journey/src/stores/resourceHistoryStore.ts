import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interface for a resource in history
export interface ResourceHistoryItem {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	sourceUrl: string;
	viewedAt: string; // ISO date string
}

interface ResourceHistoryState {
	history: ResourceHistoryItem[];
	addToHistory: (resource: Omit<ResourceHistoryItem, "viewedAt">) => void;
	clearHistory: () => void;
}

// Create the store with persistence
export const useResourceHistoryStore = create<ResourceHistoryState>()(
	persist(
		(set, get) => ({
			history: [],

			addToHistory: (resource) => {
				const { history } = get();

				// Create new history item with timestamp
				const historyItem: ResourceHistoryItem = {
					...resource,
					viewedAt: new Date().toISOString(),
				};

				// Remove if this resource already exists in history
				const filteredHistory = history.filter((item) => item.id !== resource.id);

				// Add new item at the beginning and limit to 10 items
				set({
					history: [historyItem, ...filteredHistory].slice(0, 10),
				});
			},

			clearHistory: () => set({ history: [] }),
		}),
		{
			name: "resource-history-storage",
		}
	)
);

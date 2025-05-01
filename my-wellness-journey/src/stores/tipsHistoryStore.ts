import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TipHistoryItem {
	id: string;
	title: string;
	content: string;
	category: string;
	source: string;
	sourceUrl: string;
}

interface TipsHistoryState {
	history: TipHistoryItem[];
	addTip: (tip: TipHistoryItem) => void;
	getRecentTips: (count: number) => TipHistoryItem[];
}

export const useTipsHistoryStore = create<TipsHistoryState>()(
	persist(
		(set, get) => ({
			history: [],
			addTip: (tip) =>
				set((state) => ({
					// Deduplicate by removing any existing item with same ID and add to front
					history: [tip, ...state.history.filter((item) => item.id !== tip.id)].slice(0, 12),
				})),
			getRecentTips: (count) => {
				return get().history.slice(0, count);
			},
		}),
		{
			name: "tips-history-storage",
		}
	)
);

import { create } from "zustand";

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

// Simple non-persistent store to avoid SSR issues
export const useTipsHistoryStore = create<TipsHistoryState>()((set, get) => ({
	history: [],
	addTip: (tip) =>
		set((state) => ({
			// Deduplicate by removing any existing item with same ID and add to front
			history: [tip, ...state.history.filter((item) => item.id !== tip.id)].slice(0, 12),
		})),
	getRecentTips: (count) => {
		return get().history.slice(0, count);
	},
}));

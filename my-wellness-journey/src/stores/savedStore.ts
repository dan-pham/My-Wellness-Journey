import { create } from "zustand";

interface SavedState {
	savedTips: string[];
	savedResources: string[];
	loading: boolean;
	error: string | null;
	fetchSaved: () => Promise<void>;
	addTip: (tip: string) => void;
	removeTip: (id: string) => void;
	addResource: (id: string) => void;
	removeResource: (id: string) => void;
}

export const useSavedStore = create<SavedState>((set, get) => ({
	savedTips: [],
	savedResources: [],
	loading: false,
	error: null,
	fetchSaved: async () => {
		set({ loading: true, error: null });

		set({
			savedTips: [],
			savedResources: [],
			loading: false,
		});
		// try {
		// 	// Replace with API calls
		// 	const [tipsRes, resourcesRes] = await Promise.all([
		// 		fetch("/api/saved/tips").then((res) => res.json()),
		// 		fetch("/api/saved/resources").then((res) => res.json()),
		// 	]);
		// 	set({
		// 		savedTips: tipsRes.tips || [],
		// 		savedResources: resourcesRes.resources || [],
		// 		loading: false,
		// 	});
		// } catch (error) {
		// 	set({ error: "Failed to fetch saved items", loading: false });
		// }
	},
	addTip: (idToAdd) => set({ savedTips: [...get().savedTips, idToAdd] }),
	removeTip: (idToRemove) => set({ savedTips: get().savedTips.filter((id) => id !== idToRemove) }),
	addResource: (idToAdd) => set({ savedResources: [...get().savedResources, idToAdd] }),
	removeResource: (idToRemove) =>
		set({ savedResources: get().savedResources.filter((id) => id !== idToRemove) }),
}));

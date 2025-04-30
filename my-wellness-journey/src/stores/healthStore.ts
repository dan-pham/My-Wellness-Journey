import { create } from "zustand";
import { MyHealthFinder, fetchHealthData } from "../lib/api/myhealthfinder";
import { MedlinePlusSearchResult } from "../lib/api/medlineplus";

interface TipsSlice {
	tips: MedlinePlusSearchResult[];
	tipsLoading: boolean;
	tipsError: string | null;
	fetchTips: (query: string, count?: number) => Promise<void>;
}

interface ResourcesSlice {
	resources: MyHealthFinder[];
	resourcesLoading: boolean;
	resourcesError: string | null;
	fetchResources: (query: string, maxResults?: number) => Promise<void>;
}

type HealthStore = TipsSlice & ResourcesSlice;

export const useHealthStore = create<HealthStore>((set) => ({
	// Tips slice
	tips: [],
	tipsLoading: false,
	tipsError: null,
	fetchTips: async (query, maxResults = 10) => {
		set({ tipsLoading: true, tipsError: null });
		try {
			const response = await fetch(
				`/api/medlineplus?query=${encodeURIComponent(query)}&maxResults=${maxResults}`
			);
			if (!response.ok) throw new Error("API error");
			const data = await response.json();
			console.log("MedlinePlus data:", data);
			set({ tips: data.results, tipsLoading: false });
		} catch (error) {
			set({ tipsError: "Failed to fetch health tips", tipsLoading: false });
		}
	},

	// Resources slice
	resources: [],
	resourcesLoading: false,
	resourcesError: null,
	fetchResources: async (query, count = 10) => {
		set({ resourcesLoading: true, resourcesError: null });
		try {
			const response = await fetchHealthData(query, count);
			set({ resources: response.healthData, resourcesLoading: false });
		} catch (error) {
			set({ resourcesError: "Failed to fetch resources", resourcesLoading: false });
		}
	},
}));

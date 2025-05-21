import { create } from "zustand";
import { MyHealthFinder, fetchHealthData, fetchHealthDataById } from "../lib/api/myhealthfinder";
import { MedlinePlusSearchResult } from "../lib/api/medlineplus";
import { Resource, ResourceDetail } from "@/types/resource";

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
	fetchResourceById: (id: string) => Promise<ResourceDetail>;
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
	fetchResourceById: async (id: string) => {
		try {
			const resource = await fetchHealthDataById(id);
			if (!resource) {
				throw new Error("Resource not found");
			}
			return {
				id: resource.id,
				title: resource.title,
				description: resource.content.substring(0, 200) + "...", // Use first 200 chars of content as description
				content: resource.content,
				imageUrl:
					resource.imageUrl || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
				sourceUrl: resource.sourceUrl || "",
			};
		} catch (error) {
			throw new Error("Failed to fetch resource");
		}
	},
}));

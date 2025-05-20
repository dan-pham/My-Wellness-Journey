import { create } from "zustand";
import { Resource } from "@/types/resource";

interface RecommendedResourcesState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  setResources: (resources: Resource[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Check if resources need refresh (older than 24 hours)
  needsRefresh: () => boolean;
  
  // Reset store
  resetStore: () => void;
}

// Create the store
export const useRecommendedResourcesStore = create<RecommendedResourcesState>((set, get) => ({
  resources: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  
  // Set resources and update lastFetched timestamp
  setResources: (resources) => set({ 
    resources, 
    lastFetched: Date.now(),
    error: null
  }),
  
  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
  
  // Set error state
  setError: (error) => set({ error, isLoading: false }),
  
  // Check if resources need refresh
  needsRefresh: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    
    // Check if last fetch was more than 24 hours ago
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    return Date.now() - lastFetched > twentyFourHoursMs;
  },
  
  // Reset store to initial state
  resetStore: () => set({
    resources: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  }),
})); 
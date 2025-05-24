import { create } from "zustand";
import { Resource } from "@/types/resource";

interface RecommendedResourcesState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  forceRefreshFlag: boolean;
  
  // Actions
  setResources: (resources: Resource[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  forceRefresh: () => void;
  
  // Check if resources need refresh
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
  forceRefreshFlag: false,
  
  // Set resources and update lastFetched timestamp
  setResources: (resources) => {
    const currentState = get();
    // Only update if resources have changed
    if (JSON.stringify(currentState.resources) !== JSON.stringify(resources)) {
      set({ 
        resources, 
        lastFetched: Date.now(),
        error: null,
        forceRefreshFlag: false,
        isLoading: false
      });
    }
  },
  
  // Set loading state
  setLoading: (isLoading) => {
    const currentState = get();
    // Only update if loading state has changed
    if (currentState.isLoading !== isLoading) {
      set({ isLoading });
    }
  },
  
  // Set error state
  setError: (error) => {
    const currentState = get();
    // Only update if error has changed
    if (currentState.error !== error) {
      set({ error, isLoading: false });
    }
  },
  
  // Force a refresh
  forceRefresh: () => {
    const currentState = get();
    // Clear resources and set force refresh flag
    if (!currentState.forceRefreshFlag || currentState.resources.length > 0) {
      set({ 
        forceRefreshFlag: true,
        resources: [], // Clear current resources
        lastFetched: null, // Reset last fetched
        error: null // Clear any errors
      });
    }
  },
  
  // Check if resources need refresh
  needsRefresh: () => {
    const { lastFetched, forceRefreshFlag, resources } = get();
    if (forceRefreshFlag) return true;
    if (!lastFetched) return true;
    if (resources.length === 0) return true;
    
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
    forceRefreshFlag: false,
  }),
})); 
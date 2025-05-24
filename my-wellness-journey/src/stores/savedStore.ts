import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchWithAuth } from "@/lib/auth/authFetch";
import { useAuthStore } from "./authStore";
import toast from "react-hot-toast";
import { Resource } from "@/types/resource";
import { Tip } from "@/types/tip";

interface SavedState {
	savedTips: string[];
	savedTipsData: Tip[];
	savedResources: string[];
	savedResourcesData: Resource[];
	loading: boolean;
	error: string | null;
	fetchSavedTips: () => Promise<void>;
	fetchSavedResources: () => Promise<void>;
	addTip: (tip: string, tipData: Tip) => void;
	removeTip: (id: string) => void;
	addResource: (id: string, resourceData: Resource) => void;
	removeResource: (id: string) => void;
}

export const useSavedStore = create<SavedState>()(
	persist(
		(set, get) => ({
			savedTips: [],
			savedTipsData: [],
			savedResources: [],
			savedResourcesData: [],
			loading: false,
			error: null,

			fetchSavedTips: async () => {
				// Check if user is authenticated
				const isAuthenticated = useAuthStore.getState().isAuthenticated;
				if (!isAuthenticated) {
					return;
				}

				set({ loading: true, error: null });

				try {
					// Fetch saved tips
					const tipsRes = await fetchWithAuth("/api/user/saved-tips");

					// If the request fails, gracefully handle it for new users
					if (!tipsRes.ok) {
						// For 404 errors (profile not found) or 500 errors,
						// just return an empty array for new users
						if (tipsRes.status === 404 || tipsRes.status === 500) {
							set({
								savedTips: [],
								savedTipsData: [],
								loading: false,
							});
							return [];
						}
						throw new Error("Failed to fetch saved tips");
					}

					const tipsData = await tipsRes.json();

					// Extract tip IDs from the response
					const tipIds = tipsData.savedTips?.map((item: any) => item.id) || [];

					// Create placeholder tip data objects if full data isn't available
					const tipDataItems = tipIds.map((id: string) => {
						// Check if we already have this tip in our store
						const existingTip = get().savedTipsData.find((tip) => tip.id === id);
						if (existingTip) return existingTip;

						// Otherwise create a placeholder (we'll fetch full data later if needed)
						return {
							id,
							task: "Loading...",
							reason: "Loading content...",
							sourceUrl: "#",
							dateGenerated: new Date().toISOString(),
							tag: [],
						} as Tip;
					});

					// Update state with saved tips
					set({
						savedTips: tipIds,
						savedTipsData: tipDataItems,
						loading: false,
					});

					return tipIds;
				} catch (error) {
					console.error("Error fetching saved tips:", error);

					// Handle MongoDB connection pool errors gracefully
					if (
						error instanceof Error &&
						(error.message.includes("MongoPoolClosedError") ||
							error.message.includes("connection pool") ||
							error.name === "PoolClosedError")
					) {
						console.info("Database connection issue detected. Using empty saved tips array.");
					}

					// Don't set error for new users or connection issues, just return empty arrays
					set({
						savedTips: [],
						savedTipsData: [],
						error: null,
						loading: false,
					});
					return [];
				}
			},

			fetchSavedResources: async () => {
				// Check if user is authenticated
				const isAuthenticated = useAuthStore.getState().isAuthenticated;
				if (!isAuthenticated) {
					return;
				}

				set({ loading: true, error: null });

				try {
					// Fetch saved resources
					const resourcesRes = await fetchWithAuth("/api/user/saved-resources");

					// If the request fails, gracefully handle it for new users
					if (!resourcesRes.ok) {
						// For 404 errors (profile not found) or 500 errors,
						// just return an empty array for new users
						if (resourcesRes.status === 404 || resourcesRes.status === 500) {
							set({
								savedResources: [],
								savedResourcesData: [],
								loading: false,
							});
							return [];
						}
						throw new Error("Failed to fetch saved resources");
					}

					const resourcesData = await resourcesRes.json();

					// Extract resource IDs from the response
					const resourceIds = resourcesData.savedResources?.map((item: any) => item.id) || [];

					// Create placeholder resource data objects if full data isn't available
					const resourceDataItems = resourceIds.map((id: string) => {
						// Check if we already have this resource in our store
						const existingResource = get().savedResourcesData.find(
							(resource) => resource.id === id
						);
						if (existingResource) return existingResource;

						// Otherwise create a placeholder (we'll fetch full data later if needed)
						return {
							id,
							title: "Loading...",
							description: "Loading content...",
							imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
							sourceUrl: "#",
						} as Resource;
					});

					// Update state with saved resources
					set({
						savedResources: resourceIds,
						savedResourcesData: resourceDataItems,
						loading: false,
					});

					return resourceIds;
				} catch (error) {
					console.error("Error fetching saved resources:", error);

					// Handle MongoDB connection pool errors gracefully
					if (
						error instanceof Error &&
						(error.message.includes("MongoPoolClosedError") ||
							error.message.includes("connection pool") ||
							error.name === "PoolClosedError")
					) {
						console.info("Database connection issue detected. Using empty saved resources array.");
					}

					// Don't set error for new users or connection issues, just return empty arrays
					set({
						savedResources: [],
						savedResourcesData: [],
						error: null,
						loading: false,
					});
					return [];
				}
			},

			addTip: async (tipId, tipData) => {
				if (get().savedTips.includes(tipId)) {
					return;
				}

				// Make sure tipData is complete
				const completeData = {
					...tipData,
					id: tipId, // Ensure ID is set correctly
				};

				// Update UI first (optimistic update)
				set((state) => {
					// Remove any existing entry first (just to be safe)
					const filteredTips = state.savedTips.filter((id) => id !== tipId);
					const filteredTipsData = state.savedTipsData.filter((tip) => tip.id !== tipId);

					// Then add the new entry
					return {
						savedTips: [...filteredTips, tipId],
						savedTipsData: [...filteredTipsData, completeData],
					};
				});

				try {
					// Call API to save tip
					const response = await fetchWithAuth("/api/user/saved-tips", {
						method: "POST",
						body: JSON.stringify({ tipId }),
					});

					if (!response.ok) {
						// If API call fails, revert the update
						set((state) => ({
							savedTips: state.savedTips.filter((id) => id !== tipId),
							savedTipsData: state.savedTipsData.filter((t) => t.id !== tipId),
						}));

						const errorData = await response.json();
						// Only show the error if it's not "Tip already saved"
						if (errorData.error !== "Tip already saved") {
							toast.error(errorData.error || "Failed to save tip");
						}
						return;
					}

					toast.success("Tip saved successfully");
				} catch (error) {
					// If an error occurs, revert the update
					set((state) => ({
						savedTips: state.savedTips.filter((id) => id !== tipId),
						savedTipsData: state.savedTipsData.filter((t) => t.id !== tipId),
					}));

					// Handle MongoDB connection pool errors gracefully
					if (
						error instanceof Error &&
						(error.message.includes("MongoPoolClosedError") ||
							error.message.includes("connection pool") ||
							error.name === "PoolClosedError")
					) {
						toast.error("Database connection error. Please try again later.");
					} else {
						console.error("Error saving tip:", error);
						toast.error("Failed to save tip");
					}
				}
			},

			removeTip: async (tipId) => {
				// Check if tip exists before trying to remove
				if (!get().savedTips.includes(tipId)) {
					toast.error("Tip not found in your saved tips");
					return;
				}

				const previousTips = [...get().savedTips];
				const previousTipsData = [...get().savedTipsData];

				// Optimistic update - remove from state immediately
				set((state) => ({
					savedTips: state.savedTips.filter((id) => id !== tipId),
					savedTipsData: state.savedTipsData.filter((t) => t.id !== tipId),
				}));

				try {
					// Call API to remove tip - use the ID as is, since it's already encoded
					const response = await fetchWithAuth(`/api/user/saved-tips?tipId=${tipId}`, {
						method: "DELETE",
					});

					if (!response.ok) {
						// If API call fails, revert the update
						set({
							savedTips: previousTips,
							savedTipsData: previousTipsData,
						});

						const errorData = await response.json();
						toast.error(errorData.error || "Failed to remove tip");
						return;
					}

					toast.success("Tip removed successfully");
				} catch (error) {
					// If an error occurs, revert the update
					set({
						savedTips: previousTips,
						savedTipsData: previousTipsData,
					});

					// Handle MongoDB connection pool errors gracefully
					if (
						error instanceof Error &&
						(error.message.includes("MongoPoolClosedError") ||
							error.message.includes("connection pool") ||
							error.name === "PoolClosedError")
					) {
						toast.error("Database connection error. Please try again later.");
					} else {
						console.error("Error removing tip:", error);
						toast.error("Failed to remove tip");
					}
				}
			},

			addResource: async (resourceId, resourceData) => {
				if (get().savedResources.includes(resourceId)) {
					return;
				}

				// Make sure resourceData is complete
				const completeData = {
					...resourceData,
					id: resourceId, // Ensure ID is set correctly
				};

				// Update UI first (optimistic update)
				set((state) => {
					// Remove any existing entry first (just to be safe)
					const filteredResources = state.savedResources.filter((id) => id !== resourceId);
					const filteredResourcesData = state.savedResourcesData.filter((r) => r.id !== resourceId);

					// Then add the new entry
					return {
						savedResources: [...filteredResources, resourceId],
						savedResourcesData: [...filteredResourcesData, completeData],
					};
				});

				try {
					// Call API to save resource
					const response = await fetchWithAuth("/api/user/saved-resources", {
						method: "POST",
						body: JSON.stringify({ resourceId }),
					});

					if (!response.ok) {
						set((state) => ({
							savedResources: state.savedResources.filter((id) => id !== resourceId),
							savedResourcesData: state.savedResourcesData.filter((r) => r.id !== resourceId),
						}));

						const errorData = await response.json();
						// Only show the error if it's not "Resource already saved"
						if (errorData.error !== "Resource already saved") {
							toast.error(errorData.error || "Failed to save resource");
						}
						return;
					}

					toast.success("Resource saved successfully");
				} catch (error) {
					// If an error occurs, revert the update
					set((state) => ({
						savedResources: state.savedResources.filter((id) => id !== resourceId),
						savedResourcesData: state.savedResourcesData.filter((r) => r.id !== resourceId),
					}));

					// Handle MongoDB connection pool errors gracefully
					if (
						error instanceof Error &&
						(error.message.includes("MongoPoolClosedError") ||
							error.message.includes("connection pool") ||
							error.name === "PoolClosedError")
					) {
						toast.error("Database connection error. Please try again later.");
					} else {
						console.error("Error saving resource:", error);
						toast.error("Failed to save resource");
					}
				}
			},
			removeResource: async (resourceId) => {
				// Check if resource exists before trying to remove
				if (!get().savedResources.includes(resourceId)) {
					toast.error("Resource not found in your saved resources");
					return;
				}

				const previousResources = [...get().savedResources];
				const previousResourcesData = [...get().savedResourcesData];

				// Optimistic update - remove from state immediately
				set((state) => ({
					savedResources: state.savedResources.filter((id) => id !== resourceId),
					savedResourcesData: state.savedResourcesData.filter((r) => r.id !== resourceId),
				}));

				try {
					// Call API to remove resource
					const response = await fetchWithAuth(
						`/api/user/saved-resources?resourceId=${resourceId}`,
						{
							method: "DELETE",
						}
					);

					if (!response.ok) {
						// If API call fails, revert the update
						set({
							savedResources: previousResources,
							savedResourcesData: previousResourcesData,
						});

						const errorData = await response.json();
						toast.error(errorData.error || "Failed to remove resource");
						return;
					}

					toast.success("Resource removed successfully");
				} catch (error) {
					// If an error occurs, revert the update
					set({
						savedResources: previousResources,
						savedResourcesData: previousResourcesData,
					});

					// Handle MongoDB connection pool errors gracefully
					if (
						error instanceof Error &&
						(error.message.includes("MongoPoolClosedError") ||
							error.message.includes("connection pool") ||
							error.name === "PoolClosedError")
					) {
						toast.error("Database connection error. Please try again later.");
					} else {
						console.error("Error removing resource:", error);
						toast.error("Failed to remove resource");
					}
				}
			},
		}),
		{
			name: "saved-items-storage",
			partialize: (state) => ({
				savedTips: state.savedTips,
				savedTipsData: state.savedTipsData,
				savedResources: state.savedResources,
				savedResourcesData: state.savedResourcesData,
			}),
		}
	)
);

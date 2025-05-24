import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useHealthStore } from "@/stores/healthStore";
import { useSavedStore } from "@/stores/savedStore";
import { Resource } from "@/types/resource";
import toast from "react-hot-toast";

export const useResources = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	const [localSavedResources, setLocalSavedResources] = useState<string[]>([]);

	const { isAuthenticated } = useAuthStore();
	const { resources, resourcesLoading, resourcesError, fetchResources } = useHealthStore();
	const {
		savedResources,
		savedResourcesData,
		addResource,
		removeResource,
		fetchSavedResources,
		loading: savedLoading,
		error: savedError,
	} = useSavedStore();

	// Initialize saved resources
	useEffect(() => {
		if (isAuthenticated) {
			fetchSavedResources().catch((err) => {
				console.error("Error fetching saved resources:", err);
				toast.error("Failed to fetch your saved resources");
			});
		}
	}, [fetchSavedResources, isAuthenticated]);

	// Update local saved resources when savedResources changes
	useEffect(() => {
		if (savedResources) {
			setLocalSavedResources(savedResources);
		}
	}, [savedResources]);

	const handleSearch = async (e: React.FormEvent | string) => {
		if (typeof e !== "string") {
			e.preventDefault();
		}

		const query = typeof e === "string" ? e : searchQuery;
		if (!query.trim()) return;

		setHasSearched(true);
		try {
			await fetchResources(query);
		} catch (error) {
			console.error("Search error:", error);
			toast.error("Error searching for resources");
		}
	};

	const handleSaveToggle = async (resource: Resource) => {
		if (!isAuthenticated) {
			toast.error("Please log in to save resources", {
				duration: 2000,
				position: "top-center",
			});
			toast.custom("Redirecting to login...");
			setTimeout(() => {
				window.location.href = "/login";
			}, 2000);
			return;
		}

		const isCurrentlySaved = localSavedResources.includes(resource.id);

		try {
			if (isCurrentlySaved) {
				setLocalSavedResources((current) => current.filter((id) => id !== resource.id));
				await removeResource(resource.id);
			} else {
				setLocalSavedResources((current) => [...current, resource.id]);
				await addResource(resource.id, resource);
			}
		} catch (error) {
			setLocalSavedResources(savedResources);
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	// Memoized resources with processed data
	const processedResources = useMemo(() => {
		if (!resources.length) return [];

		return resources.map((resource) => {
			const fallbackImageUrl = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528";
			return {
				id: resource.id,
				title: resource.title,
				description: resource.content.replace(/<\/?[^>]+(>|$)/g, ""),
				imageUrl: resource.imageUrl ? resource.imageUrl : fallbackImageUrl,
				sourceUrl: resource.sourceUrl,
			};
		});
	}, [resources]);

	// Memoized saved resources
	const savedResourcesToShow = useMemo(() => {
		const savedFromCurrentSearch = processedResources.filter((resource) =>
			savedResources.includes(resource.id)
		);

		const currentSearchIds = savedFromCurrentSearch.map((r) => r.id);

		const savedResourcesNotInSearch = savedResourcesData.filter(
			(resource) => !currentSearchIds.includes(resource.id)
		);

		return [...savedFromCurrentSearch, ...savedResourcesNotInSearch];
	}, [processedResources, savedResources, savedResourcesData]);

	return {
		searchQuery,
		setSearchQuery,
		hasSearched,
		resources: processedResources,
		savedResources: savedResourcesToShow,
		savedResourceIds: localSavedResources,
		isLoading: resourcesLoading,
		isSavedLoading: savedLoading,
		error: resourcesError,
		savedError,
		handleSearch,
		handleSaveToggle,
		isAuthenticated,
	};
};

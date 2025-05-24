import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import toast from "react-hot-toast";
import { Resource } from "@/types/resource";

export const useSavedResourcesPage = () => {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const {
		savedResourcesData: savedResources,
		removeResource,
		fetchSavedResources,
		loading,
		error,
	} = useSavedStore();

	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"date" | "title">("date");
	const [hasSearched, setHasSearched] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		fetchSavedResources().catch((err) => {
			console.error("Error fetching saved resources:", err);
			toast.error("Failed to fetch your saved resources");
		});
	}, [isAuthenticated, router, fetchSavedResources]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setHasSearched(true);
	};

	const handleRemove = async (resourceId: string) => {
		try {
			await removeResource(resourceId);
			toast.success("Resource removed from saved items");
		} catch (error) {
			console.error("Error removing resource:", error);
			toast.error("Failed to remove resource");
		}
	};

	const clearFilters = () => {
		setSearchQuery("");
		setHasSearched(false);
		setSortOrder("date");
	};

	const filteredResources = useMemo(() => {
		let resources = savedResources || [];

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			resources = resources.filter(
				(resource) =>
					resource.title.toLowerCase().includes(query) ||
					resource.description.toLowerCase().includes(query)
			);
		}

		// Apply sorting
		return [...resources].sort((a, b) => {
			if (sortOrder === "title") {
				return a.title.localeCompare(b.title);
			}
			// For date sorting, we'll keep the original order since we don't have actual dates
			return 0;
		});
	}, [savedResources, searchQuery, sortOrder]);

	return {
		isAuthenticated,
		savedResources,
		isLoading: loading,
		error,
		searchQuery,
		setSearchQuery,
		handleSearch,
		handleRemove,
		sortOrder,
		setSortOrder,
		clearFilters,
		filteredResources,
		hasSearched,
	};
};

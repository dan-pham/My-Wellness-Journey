"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ResourceCard from "../components/ResourceCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowRight, FaSearch } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import { useHealthStore } from "../../stores/healthStore";
import { useSavedStore } from "../../stores/savedStore";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";
import { EmptyState } from "../components/EmptyState";
import toast from "react-hot-toast";
import { Resource } from "../../types/resource";
import RecommendedResources from "../components/RecommendedResources";

export default function ResourcesPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	const [savedResourcesVisible, setSavedResourcesVisible] = useState(true);
	const [localSavedResources, setLocalSavedResources] = useState<string[]>([]);

	// Zustand stores
	const { isAuthenticated } = useAuthStore();
	const { resources, resourcesLoading, resourcesError, fetchResources } = useHealthStore();
	const {
		savedResources,
		savedResourcesData,
		addResource,
		removeResource,
		fetchSavedResources: fetchSavedResources,
		loading: savedLoading,
		error: savedError,
	} = useSavedStore();

	// Initialize local saved resources
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

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		setHasSearched(true);
		try {
			await fetchResources(searchQuery);
		} catch (error) {
			console.error("Search error:", error);
			toast.error("Error searching for resources");
		}
	};

	// Handle topic selection - pulled out of inline handler for better control
	const handleTopicClick = (topic: string) => {
		setSearchQuery(topic);
		setHasSearched(true);
		fetchResources(topic);
	};

	const handleSaveToggle = async (resource: Resource) => {
		const resourceId = resource.id;

		if (!isAuthenticated) {
			// Show error toast
			toast.error("Please log in to save resources", {
				id: "login-required",
				duration: 3000,
				icon: "🔒",
			});

			// Show a second toast with the login action
			toast.custom(
				<div className="bg-primary-accent text-white px-4 py-2 rounded-md">
					<button onClick={() => (window.location.href = "/login")} className="font-medium">
						Click to login
					</button>
				</div>,
				{
					id: "login-button",
					duration: 5000,
				}
			);
			return;
		}

		// Track current state to know if we're saving or unsaving
		const isCurrentlySaved = localSavedResources.includes(resourceId);

		try {
			if (isCurrentlySaved) {
				// Update local state immediately
				setLocalSavedResources((current) => current.filter((id) => id !== resourceId));
				// Call the store function
				await removeResource(resourceId);
			} else {
				// Update local state immediately
				setLocalSavedResources((current) => [...current, resourceId]);
				// Call the store function
				await addResource(resourceId, resource);
			}
		} catch (error) {
			// Revert local state on error
			setLocalSavedResources(savedResources);
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	// Memoize the resource data to prevent re-renders
	const resourcesToShow = useMemo(() => {
		if (!resources.length) return [];

		return resources.map((resource) => {
			const fallbackImageUrl = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528";
			return {
				id: resource.id,
				title: resource.title,
				description: resource.content.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML tags
				imageUrl: resource.imageUrl ? resource.imageUrl : fallbackImageUrl,
				sourceUrl: resource.sourceUrl,
			};
		});
	}, [resources, savedResources]);

	// Create a combined list of saved resources (both from API and current search)
	const savedResourcesToShow = useMemo(() => {
		// First, get resources from the current search that are saved
		const savedFromCurrentSearch = resourcesToShow.filter((resource) =>
			savedResources.includes(resource.id)
		);

		// Get IDs that are already included from the current search
		const currentSearchIds = savedFromCurrentSearch.map((r) => r.id);

		// Add resources from savedResourcesData that aren't in the current search
		const savedResourcesNotInSearch = savedResourcesData.filter(
			(resource) => !currentSearchIds.includes(resource.id)
		);

		// Combine both lists
		return [...savedFromCurrentSearch, ...savedResourcesNotInSearch];
	}, [resourcesToShow, savedResources, savedResourcesData]);

	// Handle loading state for initial load
	if (savedLoading && !isAuthenticated) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					<Loading />
				</div>
				<Footer />
			</main>
		);
	}

	return (
		<main className="min-h-screen w-full">
			<Header />

			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* My Saved Resources Section */}
				{isAuthenticated && savedResourcesToShow.length > 0 && savedResourcesVisible && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Resources</h2>
							{savedResourcesToShow.length > 3 && (
								<Link
									href="/resources/saved"
									className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2"
								>
									View All <FaArrowRight className="w-4 h-4" color="#3A8C96" />
								</Link>
							)}
						</div>

						{savedError && <Error message={savedError} />}

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{savedResourcesToShow
								.slice(0, 3) // Show only first 3 saved resources
								.map((resource) => (
									<ResourceCard
										key={resource.id}
										{...resource}
										isSaved={true}
										onSaveToggle={() => handleSaveToggle(resource)}
									/>
								))}
						</div>
					</section>
				)}

				{/* Recommended Resources Section */}
				<RecommendedResources />

				{/* All Resources Section */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Resources</h2>
					</div>

					{/* Search Bar */}
					<form onSubmit={handleSearch} className="relative mb-8">
						<div className="flex gap-2">
							<div className="relative flex-1">
								<input
									type="text"
									placeholder="Search health resources..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200 pl-10"
								/>
								<FaSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-subheading" />
							</div>
							<button
								type="submit"
								disabled={resourcesLoading}
								className="px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
							>
								{resourcesLoading ? "Searching..." : "Search"}
							</button>
						</div>
					</form>

					{/* Search Results Section */}
					{resourcesLoading && <Loading />}
					{resourcesError && <Error message={resourcesError} />}
					{hasSearched && !resourcesLoading && !resourcesError && resources.length === 0 && (
						<EmptyState title="No resources found." message="Try a different search." />
					)}
					{resourcesToShow.length > 0 && !resourcesLoading && !resourcesError && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{resourcesToShow.map((resource) => (
								<ResourceCard
									key={resource.id}
									{...resource}
									isSaved={localSavedResources.includes(resource.id)}
									onSaveToggle={() => handleSaveToggle(resource)}
								/>
							))}
						</div>
					)}

					{/* Empty state with CTA when no search has been made yet */}
					{!hasSearched && !resourcesLoading && resourcesToShow.length === 0 && (
						<div className="text-center py-16 border border-gray-100 rounded-lg bg-white shadow-sm">
							<div className="max-w-md mx-auto">
								<h3 className="text-xl font-semibold text-primary-heading mb-3">
									Discover Health Resources
								</h3>
								<p className="text-primary-subheading mb-6">
									Search for health topics above to find trusted resources that can help you on your
									wellness journey.
								</p>
								<div className="space-y-4">
									<p className="text-sm text-primary-subheading">Try searching for:</p>
									<div className="flex flex-wrap justify-center gap-2">
										{[
											"diabetes",
											"heart health",
											"nutrition",
											"exercise",
											"sleep",
											"stress management",
										].map((topic) => (
											<button
												key={topic}
												onClick={() => handleTopicClick(topic)}
												className="px-4 py-2 bg-primary-accent/10 text-primary-accent rounded-full text-sm hover:bg-primary-accent/20 transition-colors duration-200"
											>
												{topic}
											</button>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</section>
			</div>

			<Footer />
		</main>
	);
}

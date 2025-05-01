"use client";

import { useState, useEffect } from "react";
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

export default function ResourcesPage() {
	const [searchQuery, setSearchQuery] = useState("");

	// Zustand stores
	const { isAuthenticated } = useAuthStore();
	const { resources, resourcesLoading, resourcesError, fetchResources } = useHealthStore();
	const {
		savedResources,
		addResource,
		removeResource,
		fetchSaved: fetchSavedResources,
		loading: savedLoading,
	} = useSavedStore();

	useEffect(() => {
		fetchSavedResources();
	}, [fetchSavedResources]);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		await fetchResources(searchQuery);
	};

	const handleSaveToggle = (resourceId: string) => {
		const isSaved = savedResources.some((id) => id === resourceId);
		if (isSaved) {
			removeResource(resourceId);
		} else {
			addResource(resourceId);
		}
	};

	if (resourcesLoading || savedLoading) return <Loading />;
	if (resourcesError) return <Error message={resourcesError} />;
	if (resources.length === 0)
		return <EmptyState message="No resources found. Try a different search." />;

	const resourcesToShow = resources.map((resource) => {
		const fallbackImageUrl = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528";

		return {
			id: resource.id,
			title: resource.title,
			description: resource.content,
			category: resource.category,
			imageUrl: resource.imageUrl ? resource.imageUrl : fallbackImageUrl,
			sourceUrl: resource.sourceUrl,
			isSaved: savedResources.some((id) => id === resource.id),
		};
	});

	return (
		<main className="min-h-screen w-full">
			<Header />

			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* My Saved Resources Section */}
				{isAuthenticated && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Resources</h2>
							<button className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2">
								View All <FaArrowRight className="w-4 h-4" color="#3A8C96" />
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{resourcesToShow
								.filter((resource) => savedResources.some((id) => id === resource.id))
								.map((resource) => (
									<ResourceCard
										key={resource.id}
										{...resource}
										isSaved={true}
										onSaveToggle={() => handleSaveToggle(resource.id)}
									/>
								))}
						</div>
					</section>
				)}

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

					{/* Resources Grid */}
					{!resourcesLoading && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{resourcesToShow.map((resource) => (
								<ResourceCard
									key={resource.id}
									{...resource}
									isSaved={savedResources.some((id) => id === resource.id)}
									onSaveToggle={() => handleSaveToggle(resource.sourceUrl)}
								/>
							))}
						</div>
					)}
				</section>
			</div>

			<Footer />
		</main>
	);
}

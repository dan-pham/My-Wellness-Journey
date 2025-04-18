"use client";

import { useState } from "react";
import ResourceCard from "../components/ResourceCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowRight, FaSearch } from "react-icons/fa";
import { fetchHealthTips, HealthTip } from "../../lib/api/healthTips";

export default function ResourcesPage() {
	const [savedResources, setSavedResources] = useState<Set<string>>(new Set());
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const [healthFinderResources, setHealthFinderResources] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchHealthResources = async (query: string = "") => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetchHealthTips(query ? [query] : [], 10);

			if (response.success && response.tips.length > 0) {
				setHealthFinderResources(response.tips);
			} else {
				throw new Error("No resources found");
			}
		} catch (err) {
			console.error("Error fetching health resources:", err);
			setError("Unable to load health resources.");

			if (healthFinderResources.length === 0) {
				setHealthFinderResources([]);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		fetchHealthResources(searchQuery);
	};

	const handleSaveToggle = (resourceId: string) => {
		setSavedResources((prev) => {
			const newSaved = new Set(prev);
			if (newSaved.has(resourceId)) {
				newSaved.delete(resourceId);
			} else {
				newSaved.add(resourceId);
			}
			return newSaved;
		});
	};

	const healthFinderResourcesToShow = healthFinderResources.map((tip: HealthTip) => {
		const fallbackImageUrl = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528";

		return {
			id: tip.id,
			title: tip.title,
			description: tip.content.replace(/<[^>]*>?/gm, "").substring(0, 150) + "...",
			category: tip.category || "Health",
			imageUrl: tip.imageUrl || fallbackImageUrl,
			url: tip.sourceUrl,
			isSaved: savedResources.has(tip.id),
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
							{healthFinderResourcesToShow
								.filter((resource) => savedResources.has(resource.id))
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
								disabled={isLoading}
								className="px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
							>
								{isLoading ? "Searching..." : "Search"}
							</button>
						</div>
					</form>

					{/* Error message */}
					{error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6">{error}</div>}

					{/* Loading state */}
					{isLoading && (
						<div className="flex justify-center items-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-accent"></div>
						</div>
					)}

					{/* Resources Grid */}
					{!isLoading && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{healthFinderResourcesToShow.map((resource) => (
								<ResourceCard
									key={resource.id}
									{...resource}
									isSaved={savedResources.has(resource.id)}
									onSaveToggle={() => handleSaveToggle(resource.id)}
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

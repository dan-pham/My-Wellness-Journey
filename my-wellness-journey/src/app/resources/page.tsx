"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loading } from "../components/Loading";
import { useResources } from "./hooks/useResources";
import { SearchBar } from "./components/SearchBar";
import { SavedResourcesSection } from "./components/SavedResourcesSection";
import { ResourcesSection } from "./components/ResourcesSection";
import RecommendedResources from "../components/RecommendedResources";

export default function ResourcesPage() {
	const {
		searchQuery,
		setSearchQuery,
		hasSearched,
		resources,
		savedResources,
		savedResourceIds,
		isLoading,
		isSavedLoading,
		error,
		savedError,
		handleSearch,
		handleSaveToggle,
		isAuthenticated,
	} = useResources();

	// Handle loading state for initial load
	if (isSavedLoading && !isAuthenticated) {
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
				{isAuthenticated && savedResources.length > 0 && (
					<SavedResourcesSection
						savedResources={savedResources}
						savedError={savedError}
						onSaveToggle={handleSaveToggle}
					/>
				)}

				{/* Recommended Resources Section */}
				<RecommendedResources />

				{/* All Resources Section */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Resources</h2>
					</div>

					<SearchBar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						onSearch={handleSearch}
						isLoading={isLoading}
					/>

					<ResourcesSection
						resources={resources}
						isLoading={isLoading}
						error={error}
						hasSearched={hasSearched}
						savedResourceIds={savedResourceIds}
						onSaveToggle={handleSaveToggle}
						onSearch={(query) => {
							setSearchQuery(query);
							handleSearch(query);
						}}
					/>
				</section>
			</div>

			<Footer />
		</main>
	);
}

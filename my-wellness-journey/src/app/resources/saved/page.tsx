"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaChevronLeft } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Loading } from "../../components/Loading";
import { Error } from "../../components/Error";
import { EmptyState } from "../../components/EmptyState";
import ResourceCard from "../../components/ResourceCard";
import { SearchBar } from "../components/SearchBar";
import { useSavedResourcesPage } from "../hooks/useSavedResourcesPage";
import { Resource } from "@/types/resource";

export default function SavedResourcesPage() {
	const router = useRouter();
	const {
		isAuthenticated,
		savedResources,
		isLoading,
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
	} = useSavedResourcesPage();

	if (!isAuthenticated) {
		return null; // The hook will handle redirection
	}

	if (isLoading) {
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

	const resources = filteredResources || [];
	const showEmptyState = !error && resources.length === 0;
	const showNoResults = hasSearched && showEmptyState;

	const handleEmptyStateAction = () => {
		if (showNoResults) {
			clearFilters();
		} else {
			router.push("/resources");
		}
	};

	return (
		<main className="min-h-screen w-full">
			<Header />

			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				<Link
					href="/resources"
					className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 mb-6"
				>
					<FaChevronLeft className="w-3.5 h-3.5" />
					<span>Back to Resources</span>
				</Link>

				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-primary-heading">My Saved Resources</h1>
				</div>

				<div className="flex items-center gap-4 mb-8">
					<div className="flex-1">
						<SearchBar
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							onSearch={handleSearch}
							isLoading={false}
							placeholder="Search in your saved resources..."
						/>
					</div>
					<select
						value={sortOrder}
						onChange={(e) => setSortOrder(e.target.value as "date" | "title")}
						className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-primary-heading focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
					>
						<option value="date">Date Saved</option>
						<option value="title">Title (A-Z)</option>
					</select>
				</div>

				{error && <Error message={error} />}

				{showEmptyState && (
					<EmptyState
						title="No Results"
						message={
							showNoResults
								? "No resources match your search or filter"
								: "You haven't saved any resources yet."
						}
						actionText={showNoResults ? "Clear Filters" : "Explore Resources"}
						actionFn={handleEmptyStateAction}
					/>
				)}

				{resources.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{resources.map((resource: Resource) => (
							<ResourceCard
								key={resource.id}
								{...resource}
								isSaved={true}
								onSaveToggle={() => handleRemove(resource.id)}
							/>
						))}
					</div>
				)}
			</div>

			<Footer />
		</main>
	);
}

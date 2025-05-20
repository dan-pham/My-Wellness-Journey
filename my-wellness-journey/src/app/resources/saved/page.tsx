"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ResourceCard from "../../components/ResourceCard";
import { Loading } from "../../components/Loading";
import { Error } from "../../components/Error";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../../stores/authStore";
import { useSavedStore } from "../../../stores/savedStore";
import AuthProvider from "../../components/AuthProvider";
import toast from "react-hot-toast";
import { FaSearch, FaChevronLeft, FaSort, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { Resource } from "../../../types/resource";

export default function SavedResourcesPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("recent"); // recent, oldest, title

	// States
	const { isAuthenticated } = useAuthStore();
	const {
		savedResources,
		savedResourcesData,
		fetchSavedResources,
		removeResource,
		loading,
		error,
	} = useSavedStore();

	// Load saved resources on component mount
	useEffect(() => {
		fetchSavedResources().catch((err) => {
			console.error("Error fetching saved resources:", err);
			toast.error("Failed to fetch your saved resources");
		});
	}, [fetchSavedResources]);

	// Filter and sort the resources
	const filteredAndSortedResources = useMemo(() => {
		if (!savedResourcesData) return [];

		return savedResourcesData
			.filter((resource: Resource) => {
				// Apply search query filter
				const matchesSearch =
					!searchQuery ||
					resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					resource.description?.toLowerCase().includes(searchQuery.toLowerCase());

				return matchesSearch;
			})
			.sort((a: Resource, b: Resource) => {
				// Apply sorting
				switch (sortOption) {
					case "title":
						return a.title.localeCompare(b.title);
					case "oldest":
						// Assuming savedAt is stored or we can use the array in reverse
						return 1;
					case "recent":
					default:
						// Assuming recent is default using the array order
						return -1;
				}
			});
	}, [savedResourcesData, searchQuery, sortOption]);

	// Handle resource unsave
	const handleUnsave = async (resource: Resource) => {
		try {
			await removeResource(resource.id);
			// The store will handle updating savedResourcesData
		} catch (error) {
			console.error("Error unsaving resource:", error);
			toast.error("Failed to unsave resource");
		}
	};

	// Handle search
	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Search is already applied via the filter
	};

	return (
		<AuthProvider requireAuth={true} redirectTo="/login">
			<main className="min-h-screen w-full">
				<Header />

				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					{/* Back button above header */}
					<Link
						href="/resources"
						className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 mb-6"
					>
						<FaChevronLeft className="w-3.5 h-3.5" />
						<span className="font-medium">Back to Resources</span>
					</Link>

					{/* Page Header */}
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-primary-heading">
							My Saved Resources
						</h1>
						<p className="text-primary-subheading mt-1">
							Access and manage all your saved health resources
						</p>
					</div>

					{/* Search and Filters */}
					<form onSubmit={handleSearch} className="relative mb-8">
						<div className="flex flex-col md:flex-row gap-4">
							{/* Search Input */}
							<div className="relative flex-1">
								<input
									type="text"
									placeholder="Search in your saved resources..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200 pl-10"
								/>
								<FaSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-subheading" />
							</div>

							{/* Sort Options */}
							<div className="relative">
								<select
									value={sortOption}
									onChange={(e) => setSortOption(e.target.value)}
									className="appearance-none w-full md:w-48 px-4 py-2 text-primary-heading bg-white border border-primary-accent/30 rounded-full focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200 pl-10 cursor-pointer hover:bg-primary-accent/5"
								>
									<option value="recent">Most Recent</option>
									<option value="oldest">Oldest First</option>
									<option value="title">Title (A-Z)</option>
								</select>
								<FaSort className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-accent" />
								<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary-accent">
									{sortOption === "recent" && <FaArrowDown className="w-3 h-3" />}
									{sortOption === "oldest" && <FaArrowUp className="w-3 h-3" />}
									{sortOption === "title" && <FaSort className="w-3 h-3" />}
								</div>
							</div>
						</div>
					</form>

					{/* Resources Grid */}
					<div className="min-h-[300px] mt-8">
						{loading && <Loading />}

						{error && <Error message={error} />}

						{!loading && !error && filteredAndSortedResources.length === 0 && (
							<EmptyState
								title="No Results"
								message={
									searchQuery
										? "No resources match your search or filter."
										: "You haven't saved any resources yet."
								}
								actionText={searchQuery ? "Clear Filters" : "Explore Resources"}
								actionFn={() => {
									if (searchQuery) {
										setSearchQuery("");
									} else {
										router.push("/resources");
									}
								}}
							/>
						)}

						{!loading && !error && filteredAndSortedResources.length > 0 && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredAndSortedResources.map((resource: Resource) => (
									<ResourceCard
										key={resource.id}
										{...resource}
										isSaved={true}
										onSaveToggle={() => handleUnsave(resource)}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				<Footer />
			</main>
		</AuthProvider>
	);
}

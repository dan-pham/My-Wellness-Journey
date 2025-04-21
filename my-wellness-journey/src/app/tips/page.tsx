"use client";

import { useState } from "react";
import TipCard from "../components/TipCard";
import { FaSearch, FaArrowRight } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MedlinePlusSearchResult } from "../../lib/api/medlineplus";

export default function TipsPage() {
	const [isAuthenticated] = useState(false);
	const [savedTips, setSavedTips] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const [medlineTips, setMedlineTips] = useState<MedlinePlusSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchMedlineTips = async (query: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/medlineplus?query=${encodeURIComponent(query)}&maxResults=10`
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			const searchResults = data.results || [];
			setMedlineTips(searchResults);

			if (searchResults.length === 0) {
				setError("No results found. Try different search terms.");
			}
		} catch (err) {
			setError("Failed to search MedlinePlus. Please try again later.");
			console.error("MedlinePlus search error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!searchQuery.trim()) return;

		await fetchMedlineTips(searchQuery);
	};

	const handleSaveToggle = (tipId: string) => {
		setSavedTips((prev) => {
			const newSaved = new Set(prev);
			if (newSaved.has(tipId)) {
				newSaved.delete(tipId);
			} else {
				newSaved.add(tipId);
			}
			return newSaved;
		});
	};

	const medlineTipsToShow = medlineTips.map((result) => {
		// Better way to create a unique, valid ID that can be easily decoded later
		// First, encode the URL to make it safe for use in a URL
		const encodedUrl = encodeURIComponent(result.url);
		// Create a unique ID that starts with 'medline-'
		const id = `medline-${encodedUrl}`;

		// Get a category from the result's categories or use "Health"
		const category =
			result.categories && result.categories.length > 0 ? result.categories[0] : "Health Tip";

		return {
			id,
			title: result.title,
			content: result.snippet,
			category,
			source: "MedlinePlus",
			isSaved: savedTips.has(id),
			onSaveToggle: () => handleSaveToggle(id),
			showFullContent: false,
			sourceUrl: result.url,
		};
	});

	// Filter tips by category if selected
	const filteredTips = selectedCategory
		? medlineTipsToShow.filter((tip) =>
				tip.category.toLowerCase().includes(selectedCategory.toLowerCase())
		  )
		: medlineTipsToShow;

	return (
		<main className="min-h-screen w-full">
			<Header />
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* My Saved Tips Section */}
				{isAuthenticated && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Tips</h2>
							<button className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2">
								View All <FaArrowRight className="w-4 h-4" />
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredTips
								.filter((tip) => savedTips.has(tip.id))
								.map((tip) => (
									<TipCard
										key={tip.id}
										id={tip.id}
										title={tip.title}
										content={tip.content.replace(/<\/?[^>]+(>|$)/g, "")} // Strip HTML tags
										category={tip.category}
										source={tip.source || "health.gov"}
										isSaved={true}
										onSaveToggle={() => handleSaveToggle(tip.id)}
										sourceUrl={tip.sourceUrl}
									/>
								))}
						</div>
					</section>
				)}

				{/* All Tips Section */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Wellness Tips</h2>
					</div>

					{/* Search and Filter Section */}
					<div className="space-y-6 mb-8">
						{/* Search Bar */}
						<form onSubmit={handleSearch} className="relative">
							<div className="flex gap-2">
								<div className="relative flex-1">
									<input
										type="text"
										placeholder="Search tips by topic or keyword"
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
									Search
								</button>
							</div>
						</form>

						{/* Error message */}
						{error && <div className="bg-red-50 text-red-700 p-3 rounded-md">{error}</div>}
					</div>

					{/* Loading state */}
					{isLoading && (
						<div className="flex justify-center items-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-accent"></div>
						</div>
					)}

					{/* Tips Grid */}
					{!isLoading && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredTips.map((tip) => (
								<TipCard
									key={tip.id}
									{...tip}
									isSaved={savedTips.has(tip.id)}
									onSaveToggle={() => handleSaveToggle(tip.id)}
								/>
							))}
						</div>
					)}

					{/* No results message */}
					{!isLoading && filteredTips.length === 0 && (
						<div className="text-center py-12">
							<p className="text-primary-subheading">
								No tips found. Try a different search or category.
							</p>
						</div>
					)}
				</section>
			</div>
			<Footer />
		</main>
	);
}

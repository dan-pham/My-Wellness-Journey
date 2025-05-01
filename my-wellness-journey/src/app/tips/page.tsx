"use client";

import { useState, useEffect, useMemo } from "react";
import TipCard from "../components/TipCard";
import { FaSearch, FaArrowRight } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthStore } from "../../stores/authStore";
import { useHealthStore } from "../../stores/healthStore";
import { useSavedStore } from "../../stores/savedStore";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";
import { EmptyState } from "../components/EmptyState";

export default function TipsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);

	// Zustand stores
	const { isAuthenticated } = useAuthStore();
	const { tips, tipsLoading, tipsError, fetchTips } = useHealthStore();
	const {
		savedTips,
		addTip,
		removeTip,
		fetchSaved: fetchSavedTips,
		loading: savedLoading,
	} = useSavedStore();

	useEffect(() => {
		// Fetch saved tips only once on component mount
		fetchSavedTips();
	}, [fetchSavedTips]);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!searchQuery.trim()) return;

		setHasSearched(true);
		await fetchTips(searchQuery, 10);
	};

	const handleSaveToggle = (tipId: string) => {
		if (savedTips.includes(tipId)) {
			removeTip(tipId);
		} else {
			addTip(tipId);
		}
	};

	// Memoize the tips data to prevent re-renders
	const tipsToShow = useMemo(() => {
		if (!tips.length) return [];
		
		return tips.map((tip) => ({
			id: `medline-${encodeURIComponent(tip.url)}`,
			title: tip.title,
			content: tip.snippet,
			category: "general",
			source: "MedlinePlus.gov",
			sourceUrl: tip.url,
		}));
	}, [tips]);

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
				{/* My Saved Tips Section */}
				{isAuthenticated && savedTips.length > 0 && tipsToShow.length > 0 && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Tips</h2>
							<button className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2">
								View All <FaArrowRight className="w-4 h-4" />
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{tipsToShow
								.filter((tip) => savedTips.includes(tip.id))
								.map((tip) => (
									<TipCard
										key={tip.id}
										{...tip}
										content={tip.content.replace(/<\/?[^>]+(>|$)/g, "")} // Strip HTML tags
										isSaved={true}
										onSaveToggle={() => handleSaveToggle(tip.id)}
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
									disabled={tipsLoading}
									className="px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
								>
									Search
								</button>
							</div>
						</form>
					</div>

					{/* Search Results Section */}
					{tipsLoading && <Loading />}
					{tipsError && <Error message={tipsError} />}
					{hasSearched && !tipsLoading && !tipsError && tips.length === 0 && (
						<EmptyState message="No tips found. Try a different search." />
					)}
					{tipsToShow.length > 0 && !tipsLoading && !tipsError && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{tipsToShow.map((tip) => (
								<TipCard
									key={tip.id}
									{...tip}
									content={tip.content.replace(/<\/?[^>]+(>|$)/g, "")} // Strip HTML tags
									isSaved={savedTips.includes(tip.id)}
									onSaveToggle={() => handleSaveToggle(tip.id)}
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

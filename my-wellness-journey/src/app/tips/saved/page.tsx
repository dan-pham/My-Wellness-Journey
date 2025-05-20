"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TipCard from "../../components/TipCard";
import { Loading } from "../../components/Loading";
import { Error } from "../../components/Error";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../../stores/authStore";
import { useSavedStore } from "../../../stores/savedStore";
import AuthProvider from "../../components/AuthProvider";
import toast from "react-hot-toast";
import { FaSearch, FaChevronLeft, FaSort, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { Tip } from "@/types/tip";

export default function SavedTipsPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("recent"); // recent, oldest, title
	const [localTips, setLocalTips] = useState<Tip[]>([]);
	const [doneTips, setDoneTips] = useState<string[]>([]);

	// States
	const { isAuthenticated } = useAuthStore();
	const { savedTips, savedTipsData, fetchSavedTips, removeTip, loading, error } = useSavedStore();

	// Load saved tips on component mount
	useEffect(() => {
		fetchSavedTips().catch((err) => {
			console.error("Error fetching saved tips:", err);
			toast.error("Failed to fetch your saved tips");
		});
	}, [fetchSavedTips]);

	// Load done tips from localStorage on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedDoneTips = localStorage.getItem("doneTips");
			if (storedDoneTips) {
				setDoneTips(JSON.parse(storedDoneTips));
			}
		}
	}, []);

	// Update local tips when savedTipsData changes and add done status
	useEffect(() => {
		setLocalTips(savedTipsData.map((tip: Tip) => ({
			...tip,
			done: doneTips.includes(tip.id),
			saved: true
		})));
	}, [savedTipsData, doneTips]);

	// Filter and sort the tips
	const filteredAndSortedTips = localTips
		.filter((tip: Tip) => {
			// Apply search query filter
			const matchesSearch =
				!searchQuery ||
				tip.task?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				tip.reason?.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesSearch;
		})
		.sort((a: Tip, b: Tip) => {
			// Apply sorting
			switch (sortOption) {
				case "title":
					return a.task.localeCompare(b.task);
				case "oldest":
					return 1; // Reverse of recent
				case "recent":
				default:
					return -1;
			}
		});

	// Handle tip unsave
	const handleSaveToggle = (tipId: string) => {
		try {
			removeTip(tipId);
			// Use local state to immediately update UI without page refresh
			setLocalTips((currentTips) => 
				currentTips.filter((t: Tip) => t.id !== tipId)
			);
		} catch (error) {
			console.error("Error unsaving tip:", error);
			toast.error("Failed to unsave tip");
		}
	};

	// Handle marking a tip as done
	const handleMarkDone = (tipId: string) => {
		const isDone = doneTips.includes(tipId);
		
		// Toggle the done status
		let updatedDoneTips;
		if (isDone) {
			updatedDoneTips = doneTips.filter((id) => id !== tipId);
		} else {
			updatedDoneTips = [...doneTips, tipId];
		}
		
		// Update state
		setDoneTips(updatedDoneTips);
		
		// Update the local tips list with the new done status
		setLocalTips((currentTips) =>
			currentTips.map((tip) => 
				tip.id === tipId ? { ...tip, done: !isDone } : tip
			)
		);
		
		// Save to localStorage
		if (typeof window !== "undefined") {
			localStorage.setItem("doneTips", JSON.stringify(updatedDoneTips));
		}
		
		// Show confirmation toast
		toast.success(isDone ? "Tip unmarked as done" : "Tip marked as done", {
			duration: 2000,
			position: "bottom-center",
		});
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
						href="/tips"
						className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 mb-6"
					>
						<FaChevronLeft className="w-3.5 h-3.5" />
						<span className="font-medium">Back to Tips</span>
					</Link>

					{/* Page Header */}
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-primary-heading">My Saved Tips</h1>
						<p className="text-primary-subheading mt-1">
							Access and manage all your saved wellness tips
						</p>
					</div>

					{/* Search and Filters */}
					<form onSubmit={handleSearch} className="relative mb-8">
						<div className="flex flex-col md:flex-row gap-4">
							{/* Search Input */}
							<div className="relative flex-1">
								<input
									type="text"
									placeholder="Search in your saved tips..."
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
									<option value="recent">Most recent</option>
									<option value="oldest">Oldest first</option>
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

					{/* Tips Grid */}
					<div className="min-h-[300px]">
						{loading && <Loading />}

						{error && <Error message={error} />}

						{!loading && !error && filteredAndSortedTips.length === 0 && (
							<EmptyState
								title="No Results"
								message={
									searchQuery
										? "No tips match your search or filter."
										: "You haven't saved any tips yet."
								}
								actionText={searchQuery ? "Clear Filters" : "Explore Tips"}
								actionFn={() => {
									if (searchQuery) {
										setSearchQuery("");
									} else {
										router.push("/tips");
									}
								}}
							/>
						)}

						{!loading && !error && filteredAndSortedTips.length > 0 && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredAndSortedTips.map((tip: Tip) => (
									<TipCard
										key={tip.id}
										tip={tip}
										onSaveToggle={handleSaveToggle}
										onMarkDone={handleMarkDone}
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

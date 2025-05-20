"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TipCard from "../components/TipCard";
import { FaSearch, FaArrowRight, FaLightbulb } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthStore } from "../../stores/authStore";
import { useSavedStore } from "../../stores/savedStore";
import { useTipOfDayStore } from "../../stores/tipOfTheDayStore";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";
import { EmptyState } from "../components/EmptyState";
import toast from "react-hot-toast";
import { Tip } from "@/types/tip";
import TipOfTheDay from "../components/TipOfTheDay";

export default function TipsPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	const [savedTipsVisible, setSavedTipsVisible] = useState(true);
	const [localSavedTips, setLocalSavedTips] = useState<string[]>([]);
	const [doneTips, setDoneTips] = useState<string[]>([]);
	// Flag to prevent auto-loading search results
	const [hasInitialized, setHasInitialized] = useState(false);
	// State for tips from GPT
	const [actionableTasks, setActionableTasks] = useState<Tip[] | null>(null);
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);
	// Store recent searches in local storage
	const [recentSearches, setRecentSearches] = useState<string[]>([]);

	// Zustand stores
	const { isAuthenticated, user } = useAuthStore();
	const {
		savedTips,
		savedTipsData,
		addTip,
		removeTip,
		fetchSavedTips: fetchSavedTips,
		loading: savedLoading,
	} = useSavedStore();
	const { tip: tipOfTheDay, dismissed, fetchTipOfDay, dismissForToday } = useTipOfDayStore();

	// State to force re-render when savedTips changes
	const [savedTipsKey, setSavedTipsKey] = useState(0);

	useEffect(() => {
		// Fetch saved tips if user is authenticated
		if (isAuthenticated) {
			fetchSavedTips().catch((err) => {
				console.error("Error fetching saved items:", err);
				toast.error("Failed to fetch your saved tips");
			});
		}

		// Fetch tip of the day
		fetchTipOfDay().catch((err) => {
			console.error("Error fetching tip of the day:", err);
		});
	}, [fetchSavedTips, isAuthenticated, fetchTipOfDay]);

	// Load done tips from localStorage on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedDoneTips = localStorage.getItem("doneTips");
			if (storedDoneTips) {
				setDoneTips(JSON.parse(storedDoneTips));
			}

			// Load recent searches
			const storedSearches = localStorage.getItem("recentSearches");
			if (storedSearches) {
				setRecentSearches(JSON.parse(storedSearches));
			}
		}
	}, []);

	// Update local saved tips when savedTips changes
	useEffect(() => {
		// Only update if the new savedTips are different from the current localSavedTips
		if (JSON.stringify(savedTips) !== JSON.stringify(localSavedTips)) {
			setLocalSavedTips(savedTips);
		}
	}, [savedTips, localSavedTips]);

	// Update savedTipsKey when savedTips changes to force re-render
	useEffect(() => {
		setSavedTipsKey((prev) => prev + 1);
	}, [savedTips]);

	// Function to fetch actionable tasks from OpenAI API
	const fetchActionableTasks = async (query: string) => {
		setIsLoadingTasks(true);
		try {
			// Get the MedlinePlus search result
			const medlineResponse = await fetch(
				`/api/medlineplus?query=${encodeURIComponent(query)}&maxResults=3`
			);
			const medlineData = await medlineResponse.json();

			// Extract content from the results
			let medlineContent = "";
			if (medlineData.results && medlineData.results.length > 0) {
				// Use the first result for the detailed content
				medlineContent = medlineData.results[0].snippet;
			}

			// Extract user profile data for personalization
			const userProfile = isAuthenticated ? user?.profile : null;

			// Call the GPT API to generate actionable tasks
			const response = await fetch("/api/gpt", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query,
					userProfile,
					medlineContent,
				}),
			});

			if (!response.ok) {
				console.error("API returned error status:", response.status);
				return; // Exit without throwing an error
			}

			const data = await response.json();

			// Transform actionable tasks to Tip model
			let taskTips: Tip[] = [];
			if (data.actionableTasks) {
				taskTips = data.actionableTasks.map((task: any, index: number) => ({
					id: task.id || `${query}-task-${index + 1}`,
					task: task.task || task.title || "Health Tip",
					reason: task.reason || task.content || "Improves your overall health and wellness",
					sourceUrl: task.sourceUrl || "",
					saved: localSavedTips.includes(task.id || `${query}-task-${index + 1}`),
					done: doneTips.includes(task.id || `${query}-task-${index + 1}`),
					dateGenerated: new Date().toISOString(),
					tag: [query],
				}));
			}

			setActionableTasks(taskTips);
		} catch (error) {
			console.error("Error fetching actionable tasks:", error);
			toast.error("Failed to generate personalized tips");
		} finally {
			setIsLoadingTasks(false);
		}
	};

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!searchQuery.trim()) return;

		setHasSearched(true);

		// Update recent searches
		const updatedSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(
			0,
			5
		); // Keep only the last 5 searches

		setRecentSearches(updatedSearches);

		// Save to localStorage
		if (typeof window !== "undefined") {
			localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
		}

		try {
			// We'll now only use GPT to generate tips
			await fetchActionableTasks(searchQuery);
		} catch (error) {
			console.error("Search error:", error);
			toast.error("Error searching for tips");
		}
	};

	// Update handleTopicClick to match
	const handleTopicClick = (topic: string) => {
		setSearchQuery(topic);
		setHasSearched(true);

		// Only use GPT for generating tips
		fetchActionableTasks(topic);
	};

	// Handle saving/unsaving a tip of the day
	const handleSaveTipOfDay = (tipId: string) => {
		// Just use the main handleSaveToggle function
		handleSaveToggle(tipId);
	};

	// Handle saving/unsaving a tip
	const handleSaveToggle = (tipId: string) => {
		if (!isAuthenticated) {
			// Show error toast for unauthenticated users
			toast.error("Please log in to save tips", {
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
		const isCurrentlySaved = localSavedTips.includes(tipId);

		// Find the tip to save or unsave from our combined sources
		const tipToToggle =
			actionableTasks?.find((tip) => tip.id === tipId) ||
			savedTipsData.find((tip) => tip.id === tipId) ||
			(tipOfTheDay && tipOfTheDay.id === tipId ? tipOfTheDay : null);

		if (!tipToToggle) {
			console.error("Tip not found:", tipId);
			toast.error("Failed to update saved status");
			return;
		}

		try {
			if (isCurrentlySaved) {
				// Update local state immediately for better UX
				setLocalSavedTips((current) => current.filter((id) => id !== tipId));
				// Then call the store function
				removeTip(tipId);
				toast.success("Tip removed from saved", {
					duration: 2000,
					position: "bottom-center",
				});
			} else {
				// Update local state immediately for better UX
				setLocalSavedTips((current) => [...current, tipId]);
				// Then call the store function
				addTip(tipId, tipToToggle);
				toast.success("Tip saved", {
					duration: 2000,
					position: "bottom-center",
				});
			}

			// Force a re-render
			setSavedTipsKey((prev) => prev + 1);
		} catch (error) {
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

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

	// Memoize the tips data to prevent re-renders
	const tipsToShow = useMemo(() => {
		// We now only use actionable tasks from GPT as our tips source
		if (actionableTasks && actionableTasks.length > 0) {
			return actionableTasks;
		}

		// Return empty array if no actionable tasks
		return [];
	}, [actionableTasks]);

	// Create a combined list of saved tips (both from API and current search)
	const savedTipsToShow = useMemo(() => {
		if (!isAuthenticated || localSavedTips.length === 0) {
			return [];
		}

		// First, get tips from the current search that are saved
		const savedFromCurrentSearch = tipsToShow.filter((tip) => localSavedTips.includes(tip.id));

		// Get IDs that are already included from the current search
		const currentSearchIds = savedFromCurrentSearch.map((t) => t.id);

		// Add tips from savedTipsData that aren't in the current search
		const savedTipsNotInSearch = savedTipsData
			.filter(
				(tip) =>
					!currentSearchIds.includes(tip.id) &&
					tip.task !== "Loading..." &&
					typeof tip.task === "string"
			)
			.map((tip) => ({
				...tip,
				done: doneTips.includes(tip.id),
				saved: true,
			}));

		// Combine both lists, prioritizing tips from current search
		const combinedSavedTips = [...savedFromCurrentSearch, ...savedTipsNotInSearch];

		// If no tips are found from current search, show all saved tips
		return combinedSavedTips.length > 0
			? combinedSavedTips
			: savedTipsData.map((tip) => ({
					...tip,
					done: doneTips.includes(tip.id),
					saved: true,
			  }));
	}, [tipsToShow, localSavedTips, savedTipsData, isAuthenticated, doneTips]);

	// Prepare the tip of the day with saved and done states
	const preparedTipOfTheDay = tipOfTheDay
		? {
				...tipOfTheDay,
				saved: savedTips.includes(tipOfTheDay.id),
				done: doneTips.includes(tipOfTheDay.id),
		  }
		: null;

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
				{/* Page Title */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-bold text-primary-heading">
						Health & Wellness Tips
					</h1>
					<p className="text-primary-subheading mt-2">
						Discover personalized tips to improve your health and wellness
					</p>
				</div>

				{/* Tip of the Day Section */}
				<TipOfTheDay
					key={`tip-of-day-${savedTipsKey}`}
					tip={preparedTipOfTheDay}
					isLoading={false}
					dismissed={false}
					onSaveToggle={handleSaveTipOfDay}
					onMarkDone={handleMarkDone}
					savedTips={savedTips}
					allowDismiss={false}
				/>

				{/* Search Bar */}
				<div className="mb-12">
					<form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<input
								type="text"
								placeholder="Search tips by topic or keyword"
								className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
								<FaSearch />
							</div>
						</div>
						<button
							type="submit"
							className="px-6 py-3 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors flex items-center justify-center gap-2"
						>
							Search <FaSearch className="w-4 h-4" />
						</button>
					</form>

					{/* Recent Searches */}
					{recentSearches.length > 0 && (
						<div className="mt-4">
							<p className="text-sm text-primary-subheading mb-2">Recent searches:</p>
							<div className="flex flex-wrap gap-2">
								{recentSearches.map((search, index) => (
									<button
										key={index}
										onClick={() => {
											setSearchQuery(search);
											fetchActionableTasks(search);
											setHasSearched(true);
										}}
										className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
									>
										{search}
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* My Saved Tips Section */}
				{isAuthenticated && savedTipsToShow.length > 0 && savedTipsVisible && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Tips</h2>
							{savedTipsToShow.length > 3 && (
								<Link
									href="/tips/saved"
									className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2"
								>
									View All <FaArrowRight className="w-4 h-4" color="#3A8C96" />
								</Link>
							)}
						</div>
						<div className="flex justify-center">
							<div className="w-full max-w-2xl space-y-4">
								{savedTipsToShow
									.slice(0, 3) // Show only first 3 saved tips
									.map((tip) => (
										<TipCard
											key={tip.id}
											tip={tip}
											onSaveToggle={handleSaveToggle}
											onMarkDone={handleMarkDone}
										/>
									))}
							</div>
						</div>
					</section>
				)}

				{/* All Tips Section */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Wellness Tips</h2>
					</div>

					{/* Empty state with CTA when no search has been made yet */}
					{!hasSearched && !isLoadingTasks && tipsToShow.length === 0 && (
						<div
							className="text-center py-16 border border-gray-100 rounded-lg bg-white shadow-sm"
							data-testid="empty-state"
						>
							<div className="max-w-md mx-auto">
								<h3 className="text-xl font-semibold text-primary-heading mb-3">
									Discover Health Tips
								</h3>
								<p className="text-primary-subheading mb-6">
									Search for health topics above to find trusted wellness tips that can help you on
									your journey.
								</p>
								<div className="space-y-4" data-testid="quick-search-section">
									<p className="text-sm text-primary-subheading">Try searching for:</p>
									<div className="flex flex-wrap justify-center gap-2">
										{["diabetes", "nutrition", "exercise", "sleep", "stress", "meditation"].map(
											(topic) => (
												<button
													key={topic}
													onClick={() => {
														handleTopicClick(topic);
													}}
													className="px-4 py-2 bg-primary-accent/10 text-primary-accent rounded-full text-sm hover:bg-primary-accent/20 transition-colors duration-200"
												>
													{topic}
												</button>
											)
										)}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Search Results Section */}
					{isLoadingTasks && <Loading />}
					{hasSearched && !isLoadingTasks && tipsToShow.length === 0 && (
						<EmptyState title="No tips found." message="Try a different search." />
					)}
					{hasSearched && !isLoadingTasks && tipsToShow.length > 0 && (
						<section className="mb-8">
							<h2 className="text-xl font-semibold mb-4 text-primary-heading">Personalized Tips</h2>
							<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
								{tipsToShow.map((tip) => (
									<TipCard
										key={tip.id}
										tip={tip}
										onSaveToggle={handleSaveToggle}
										onMarkDone={handleMarkDone}
									/>
								))}
							</div>
						</section>
					)}
				</section>
			</div>
			<Footer />
		</main>
	);
}

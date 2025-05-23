"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TipCard from "../components/TipCard";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";
import { EmptyState } from "../components/EmptyState";
import { useAuthStore } from "../../stores/authStore";
import { useSavedStore } from "../../stores/savedStore";
import { useTipOfDayStore } from "../../stores/tipOfTheDayStore";
import toast from "react-hot-toast";
import { Tip } from "@/types/tip";
import TipOfTheDay from "../components/TipOfTheDay";
import { useTipManagement } from "@/app/tips/hooks/useTipManagement";
import { TipSearch } from "@/app/tips/components/TipSearch";

// Types
interface PageTitleProps {
	title: string;
	subtitle: string;
}

interface SavedTipsSectionProps {
	savedTipsData: Tip[];
	onSaveToggle: (tipId: string) => void;
}

interface QuickSearchProps {
	onTopicClick: (topic: string) => void;
}

interface SearchResultsProps {
	isLoading: boolean;
	hasSearched: boolean;
	tips: Tip[];
	onSaveToggle: (tipId: string) => void;
}

// Components
const PageTitle = ({ title, subtitle }: PageTitleProps) => (
	<div className="mb-8">
		<h1 className="text-3xl md:text-4xl font-bold text-primary-heading">{title}</h1>
		<p className="text-primary-subheading mt-2">{subtitle}</p>
	</div>
);

const SavedTipsSection = ({ savedTipsData, onSaveToggle }: SavedTipsSectionProps) => (
	<section className="mb-16">
		<div className="flex items-center justify-between mb-8">
			<h2 className="text-2xl font-semibold text-primary-heading">My Saved Tips</h2>
			{savedTipsData.length > 3 && (
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
				{savedTipsData.slice(0, 3).map((tip) => (
					<TipCard key={tip.id} tip={tip} onSaveToggle={onSaveToggle} />
				))}
			</div>
		</div>
	</section>
);

const QuickSearch = ({ onTopicClick }: QuickSearchProps) => (
	<div
		className="text-center py-16 border border-gray-100 rounded-lg bg-white shadow-sm"
		data-testid="empty-state"
	>
		<div className="max-w-md mx-auto">
			<h3 className="text-xl font-semibold text-primary-heading mb-3">Discover Health Tips</h3>
			<p className="text-primary-subheading mb-6">
				Search for health topics above to find trusted wellness tips that can help you on your
				journey.
			</p>
			<div className="space-y-4">
				<p className="text-sm text-primary-subheading">Try searching for:</p>
				<div className="flex flex-wrap justify-center gap-2">
					{["diabetes", "nutrition", "exercise", "sleep", "stress", "meditation"].map((topic) => (
						<button
							key={topic}
							onClick={() => onTopicClick(topic)}
							className="px-4 py-2 bg-primary-accent/10 text-primary-accent rounded-full text-sm hover:bg-primary-accent/20 transition-colors duration-200"
							aria-label={`Quick search for ${topic}`}
							data-testid={`quick-search-${topic}`}
						>
							{topic}
						</button>
					))}
				</div>
			</div>
		</div>
	</div>
);

const SearchResults = ({ isLoading, hasSearched, tips, onSaveToggle }: SearchResultsProps) => {
	if (isLoading) return <Loading />;

	// Show empty state when there are no tips after a search
	if (hasSearched && (!tips || tips.length === 0)) {
		return (
			<EmptyState
				title="No tips found."
				message="Try a different search."
				data-testid="empty-state"
			/>
		);
	}

	if (hasSearched && tips.length > 0) {
		return (
			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4 text-primary-heading">Personalized Tips</h2>
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
					{tips.map((tip) => (
						<TipCard key={tip.id} tip={tip} onSaveToggle={onSaveToggle} />
					))}
				</div>
			</section>
		);
	}

	return null;
};

const PageLayout = ({ children }: { children: React.ReactNode }) => (
	<main className="min-h-screen w-full">
		<Header />
		<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">{children}</div>
		<Footer />
	</main>
);

export default function TipsPage() {
	const router = useRouter();
	const [hasSearched, setHasSearched] = useState(false);
	const [savedTipsVisible, setSavedTipsVisible] = useState(true);
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);
	const [actionableTasks, setActionableTasks] = useState<Tip[] | null>(null);

	const { isAuthenticated, user } = useAuthStore();
	const {
		savedTips,
		savedTipsData,
		fetchSavedTips,
		loading: savedLoading,
		addTip,
		removeTip,
	} = useSavedStore();
	const { tip: tipOfTheDay, fetchTipOfDay } = useTipOfDayStore();

	const {
		tips: filteredAndSortedTips,
		searchQuery,
		setSearchQuery,
		handleSaveToggle,
	} = useTipManagement({
		initialTips: [...(actionableTasks || []), ...savedTipsData],
		onSaveToggle: async (tipId: string) => {
			// Handle both actionable tasks and saved tips
			const tip =
				actionableTasks?.find((t) => t.id === tipId) || savedTipsData.find((t) => t.id === tipId);
			if (!tip) return;

			if (savedTips.includes(tipId)) {
				await removeTip(tipId);
			} else {
				await addTip(tipId, tip);
			}
		},
	});

	useEffect(() => {
		if (isAuthenticated) {
			fetchSavedTips().catch((err) => {
				console.error("Error fetching saved items:", err);
				toast.error("Failed to fetch your saved tips");
			});
		}

		fetchTipOfDay().catch((err) => {
			console.error("Error fetching tip of the day:", err);
		});
	}, [fetchSavedTips, isAuthenticated, fetchTipOfDay]);

	const fetchActionableTasks = async (query: string) => {
		setIsLoadingTasks(true);
		try {
			// First try to get MedlinePlus content
			const medlineResponse = await fetch(
				`/api/medlineplus?query=${encodeURIComponent(query)}&maxResults=3`
			);

			if (!medlineResponse.ok) {
				toast.error(`Failed to fetch health tips (${medlineResponse.status})`);
				setActionableTasks([]);
				return;
			}

			const medlineData = await medlineResponse.json();

			if (!medlineData.results || medlineData.results.length === 0) {
				console.log("No results found from MedlinePlus for query:", query);
				setActionableTasks([]);
				return;
			}

			// Get the first article's complete data
			const firstArticle = medlineData.results[0];
			const medlineContent = JSON.stringify({
				title: firstArticle.title,
				url: firstArticle.url,
				snippet: firstArticle.snippet,
			});

			const userProfile = isAuthenticated ? user?.profile : null;

			// Then try to get GPT-processed content
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
				console.error("GPT API error:", response.status);
				// If GPT fails but we have MedlinePlus results, use those directly
				const taskTips = medlineData.results.map((result: any) => ({
					id: `medline-${encodeURIComponent(result.url)}`,
					task: result.title || "Health Tip",
					reason: result.snippet || "Improves your overall health and wellness",
					sourceUrl: result.url || `https://medlineplus.gov/health/${query}`,
					dateGenerated: new Date().toISOString(),
					tag: [query],
					saved: false,
				}));
				setActionableTasks(taskTips);
				return;
			}

			const data = await response.json();

			let taskTips: Tip[] = [];
			if (data.actionableTasks) {
				taskTips = data.actionableTasks.map((task: any) => ({
					id: task.id,
					task: task.task || task.title || "Health Tip",
					reason: task.reason || task.content || "Improves your overall health and wellness",
					sourceUrl: task.sourceUrl || `https://medlineplus.gov/health/${query}`,
					dateGenerated: new Date().toISOString(),
					tag: [query],
					saved: false,
				}));
			} else if (medlineData.results) {
				// Fallback to MedlinePlus results if GPT didn't return actionable tasks
				taskTips = medlineData.results.map((result: any) => ({
					id: `medline-${encodeURIComponent(result.url)}`,
					task: result.title || "Health Tip",
					reason: result.snippet || "Improves your overall health and wellness",
					sourceUrl: result.url || `https://medlineplus.gov/health/${query}`,
					dateGenerated: new Date().toISOString(),
					tag: [query],
					saved: false,
				}));
			}

			setActionableTasks(taskTips);
		} catch (error) {
			console.error("Error fetching actionable tasks:", error);
			toast.error("Failed to generate personalized tips");
			setActionableTasks([]);
		} finally {
			setIsLoadingTasks(false);
		}
	};

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		setHasSearched(true);

		try {
			await fetchActionableTasks(searchQuery);
		} catch (error) {
			console.error("Search error:", error);
			toast.error("Error searching for tips");
		}
	};

	const handleTopicClick = (topic: string) => {
		setSearchQuery(topic);
		setHasSearched(true);
		fetchActionableTasks(topic);
	};

	const preparedTipOfTheDay = useMemo(() => {
		if (!tipOfTheDay) return null;
		return {
			...tipOfTheDay,
			saved: false,
		};
	}, [tipOfTheDay]);

	if (savedLoading && !isAuthenticated) {
		return (
			<PageLayout>
				<Loading />
			</PageLayout>
		);
	}

	return (
		<PageLayout>
			<PageTitle
				title="Health & Wellness Tips"
				subtitle="Discover personalized tips to improve your health and wellness"
			/>

			<TipOfTheDay
				key={`tip-of-day`}
				tip={preparedTipOfTheDay}
				isLoading={false}
				dismissed={false}
				onSaveToggle={handleSaveToggle}
				allowDismiss={false}
				savedTips={savedTips}
			/>

			<TipSearch
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				onSearch={handleSearch}
			/>

			{isAuthenticated && savedTipsData.length > 0 && savedTipsVisible && (
				<SavedTipsSection
					key={`saved-tips`}
					savedTipsData={savedTipsData}
					onSaveToggle={handleSaveToggle}
				/>
			)}

			<section>
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-2xl font-semibold text-primary-heading">Wellness Tips</h2>
				</div>

				{/* Show QuickSearch when no search has been made */}
				{!hasSearched && <QuickSearch onTopicClick={handleTopicClick} />}

				{/* Show SearchResults when searching or after search */}
				{hasSearched && (
					<SearchResults
						key={`search-results`}
						isLoading={isLoadingTasks}
						hasSearched={hasSearched}
						tips={actionableTasks || []}
						onSaveToggle={handleSaveToggle}
					/>
				)}
			</section>
		</PageLayout>
	);
}

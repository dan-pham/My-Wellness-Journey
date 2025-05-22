import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Tip } from "@/types/tip";

// Define the old tip format interface for migration
interface OldTipFormat {
	id: string;
	title: string;
	content: string;
	source?: string;
	sourceUrl: string;
}

interface TipOfDayState {
	tip: Tip | null;
	lastFetchDate: string | null; // ISO date string
	dismissed: boolean;
	isLoading: boolean;
	error: string | null;

	fetchTipOfDay: () => Promise<void>;
	dismissForToday: () => void;
	showTip: () => void;
	resetDismissState: () => void;
	migrateTipIfNeeded: () => void;
}

export const useTipOfDayStore = create<TipOfDayState>()(
	persist(
		(set, get) => ({
			tip: null,
			lastFetchDate: null,
			dismissed: false,
			isLoading: false,
			error: null,

			fetchTipOfDay: async () => {
				const { lastFetchDate } = get();

				// Check if we already fetched a tip today
				const today = new Date().toISOString().split("T")[0];
				const lastFetch = lastFetchDate ? lastFetchDate.split("T")[0] : null;

				// If we already have a tip for today, use it
				if (lastFetch === today && get().tip) {
					return;
				}

				// Clear state if it's a new day
				if (lastFetch !== today) {
					set({ lastFetchDate: null, tip: null });
				}

				set({ isLoading: true, error: null });
				try {
					// Get a random health topic
					const topics = [
						"nutrition",
						"exercise",
						"sleep",
						"stress",
						"meditation",
						"mindfulness",
						"hydration",
						"wellness",
					];
					const randomTopic = topics[Math.floor(Math.random() * topics.length)];

					// Fetch tips using the existing API
					const response = await fetch(`/api/medlineplus?query=${randomTopic}&maxResults=6`);

					if (!response.ok) {
						throw new Error("Failed to fetch tip of the day");
					}

					const data = await response.json();

					if (data.results && data.results.length > 0) {
						// Pick a random tip from the results
						const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 5));
						const tipData = data.results[randomIndex];

						const tip: Tip = {
							id: `medline-${encodeURIComponent(tipData.url)}`,
							task: tipData.title || `${randomTopic} tip`,
							reason: tipData.snippet
								? tipData.snippet.replace(/<\/?[^>]+(>|$)/g, "")
								: "Improves your overall health and wellness",
							sourceUrl: tipData.url,
							dateGenerated: new Date().toISOString(),
							tag: [randomTopic],
						};

						set({
							tip,
							lastFetchDate: new Date().toISOString(),
							dismissed: false,
							isLoading: false,
						});
					} else {
						throw new Error("No tips found");
					}
				} catch (error) {
					console.error("Error fetching tip of the day:", error);
					set({
						error: error instanceof Error ? error.message : "Failed to fetch tip of the day",
						isLoading: false,
					});
				}
			},

			dismissForToday: () => set({ dismissed: true }),

			showTip: () => {
				const { lastFetchDate } = get();
				const today = new Date().toISOString().split("T")[0];
				const lastFetch = lastFetchDate ? lastFetchDate.split("T")[0] : null;

				// Always set dismissed to false
				set({ dismissed: false });

				// If we don't have a tip for today, fetch a new one
				if (lastFetch !== today || !get().tip) {
					get().fetchTipOfDay();
				}
			},

			resetDismissState: () => {
				const { lastFetchDate } = get();
				const today = new Date().toISOString().split("T")[0];
				const lastFetch = lastFetchDate ? lastFetchDate.split("T")[0] : null;

				// Only reset if it's a new day
				if (lastFetch !== today) {
					set({ dismissed: false, tip: null, lastFetchDate: null });
				}
			},

			migrateTipIfNeeded: () => {
				const currentTip = get().tip;

				if (!currentTip) return;

				// Check if the tip has the old format (title and content instead of task and reason)
				if ("title" in currentTip && "content" in currentTip) {
					const oldTip = currentTip as unknown as OldTipFormat;

					// Convert to new format
					const migratedTip: Tip = {
						id: oldTip.id,
						task: oldTip.title,
						reason: oldTip.content,
						sourceUrl: oldTip.sourceUrl,
						dateGenerated: new Date().toISOString(),
						tag: ["migrated"],
					};

					// Update the store with the migrated tip
					set({ tip: migratedTip });
				}
			},
		}),
		{
			name: "tip-of-day-storage",
		}
	)
);

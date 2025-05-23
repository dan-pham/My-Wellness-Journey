"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { Tip } from "@/types/tip";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";

interface UseTipManagementProps {
	initialTips: Tip[];
	onSaveToggle?: (tipId: string) => void;
}

export const useTipManagement = ({ initialTips = [], onSaveToggle }: UseTipManagementProps) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState<"recent" | "oldest" | "title">("recent");
	const [localSavedTips, setLocalSavedTips] = useState<string[]>([]);
	const { isAuthenticated } = useAuthStore();

	// Process tips with saved status
	const initialProcessedTipsRef = useRef(
		initialTips.map((tip) => ({
			...tip,
			saved: tip.saved || localSavedTips.includes(tip.id) || false,
		}))
	);

	// Memoize processed tips
	const processedTips = useMemo(() => {
		return initialTips.map((tip) => ({
			...tip,
			saved: tip.saved || localSavedTips.includes(tip.id) || false,
		}));
	}, [initialTips, localSavedTips]);

	// Handle saving/unsaving tips
	const handleSaveToggle = useCallback(
		async (tipId: string) => {
			if (!isAuthenticated) {
				toast.error("Please log in to save tips", { duration: 3000 });
				return;
			}

			const tip = processedTips.find((t) => t.id === tipId);
			if (!tip) return;

			try {
				// Call onSaveToggle first and wait for it to complete
				if (onSaveToggle) {
					await onSaveToggle(tipId);
				}

				// Update local state after onSaveToggle succeeds
				if (tip.saved) {
					setLocalSavedTips((prev) => prev.filter((id) => id !== tipId));
					toast.success("Tip unsaved");
				} else {
					setLocalSavedTips((prev) => [...prev, tipId]);
					toast.success("Tip saved");
				}
			} catch (err) {
				// Revert local state on error
				if (tip.saved) {
					setLocalSavedTips((prev) => [...prev, tipId]);
				} else {
					setLocalSavedTips((prev) => prev.filter((id) => id !== tipId));
				}
				toast.error("Failed to save tip");
				console.error("Error toggling tip save:", err);
			}
		},
		[isAuthenticated, onSaveToggle, processedTips]
	);

	// Handle search
	const handleSearch = useCallback((e: React.FormEvent) => {
		e.preventDefault();
		// The actual search functionality is handled by the parent component
	}, []);

	// Memoize filtered and sorted tips
	const filteredAndSortedTips = useMemo(() => {
		return processedTips
			.filter((tip) => {
				if (!searchQuery) return true;

				const searchLower = searchQuery.toLowerCase();
				const taskMatch = tip.task?.toLowerCase().includes(searchLower);
				const reasonMatch = tip.reason?.toLowerCase().includes(searchLower);
				const tagMatch = tip.tag?.some((tag) => tag.toLowerCase().includes(searchLower));

				return taskMatch || reasonMatch || tagMatch;
			})
			.sort((a, b) => {
				switch (sortOption) {
					case "title":
						return (a.task || "").localeCompare(b.task || "");
					case "oldest":
						return (
							new Date(a.dateGenerated || Date.now()).getTime() -
							new Date(b.dateGenerated || Date.now()).getTime()
						);
					case "recent":
					default:
						return (
							new Date(b.dateGenerated || Date.now()).getTime() -
							new Date(a.dateGenerated || Date.now()).getTime()
						);
				}
			});
	}, [processedTips, searchQuery, sortOption]);

	return {
		tips: filteredAndSortedTips,
		searchQuery,
		setSearchQuery,
		sortOption,
		setSortOption,
		handleSearch,
		handleSaveToggle,
	};
};

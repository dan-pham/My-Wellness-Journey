"use client";

import React, { useState, useCallback, useMemo } from "react";
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
	const [localDoneTips, setLocalDoneTips] = useState<string[]>([]);
	const { isAuthenticated } = useAuthStore();

	// Initialize done tips from localStorage
	React.useEffect(() => {
		const doneTips = JSON.parse(localStorage.getItem("doneTips") || "[]");
		setLocalDoneTips(doneTips);
	}, []);

	// Process tips with done and saved status
	const processedTips = useMemo(() => {
		return initialTips.map((tip) => ({
			...tip,
			saved: tip.saved || localSavedTips.includes(tip.id) || false,
			done: localDoneTips.includes(tip.id) || false,
		}));
	}, [initialTips, localSavedTips, localDoneTips]);

	// Handle saving/unsaving tips
	const handleSaveToggle = useCallback(
		async (tipId: string) => {
			if (!isAuthenticated) {
				toast.error("Please log in to save tips", { duration: 3000 });
				return;
			}

			const tip = processedTips.find(t => t.id === tipId);
			if (!tip) return;

			try {
				// Call onSaveToggle first and wait for it to complete
				if (onSaveToggle) {
					await onSaveToggle(tipId);
				}

				// Update local state after onSaveToggle succeeds
				if (tip.saved) {
					setLocalSavedTips(prev => prev.filter(id => id !== tipId));
					toast.success("Tip unsaved");
				} else {
					setLocalSavedTips(prev => [...prev, tipId]);
					toast.success("Tip saved");
				}
			} catch (err) {
				// Revert local state on error
				if (tip.saved) {
					setLocalSavedTips(prev => [...prev, tipId]);
				} else {
					setLocalSavedTips(prev => prev.filter(id => id !== tipId));
				}
				toast.error("Failed to save tip");
				console.error("Error toggling tip save:", err);
			}
		},
		[isAuthenticated, onSaveToggle, processedTips]
	);

	// Handle marking tips as done
	const handleMarkDone = useCallback((tipId: string) => {
		try {
			const currentDoneTips = JSON.parse(localStorage.getItem("doneTips") || "[]");
			const isDone = currentDoneTips.includes(tipId);

			let updatedDoneTips: string[];
			if (isDone) {
				updatedDoneTips = currentDoneTips.filter((id: string) => id !== tipId);
				toast.success("Tip unmarked", { duration: 2000 });
			} else {
				updatedDoneTips = [...currentDoneTips, tipId];
				toast.success("Tip marked as done", { duration: 2000 });
			}

			localStorage.setItem("doneTips", JSON.stringify(updatedDoneTips));
			setLocalDoneTips(updatedDoneTips);
		} catch (err) {
			toast.error("Failed to update tip status");
			console.error("Error marking tip as done:", err);
		}
	}, []);

	// Handle search
	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			// The actual search functionality is handled by the parent component
		},
		[]
	);

	// Memoize filtered and sorted tips
	const filteredAndSortedTips = useMemo(() => {
		return processedTips
			.filter((tip) => {
				if (!searchQuery) return true;
				
				const searchLower = searchQuery.toLowerCase();
				const taskMatch = tip.task?.toLowerCase().includes(searchLower);
				const reasonMatch = tip.reason?.toLowerCase().includes(searchLower);
				const tagMatch = tip.tag?.some(tag => tag.toLowerCase().includes(searchLower));
				
				return taskMatch || reasonMatch || tagMatch;
			})
			.sort((a, b) => {
				switch (sortOption) {
					case "title":
						return (a.task || "").localeCompare(b.task || "");
					case "oldest":
						return new Date(a.dateGenerated || Date.now()).getTime() - new Date(b.dateGenerated || Date.now()).getTime();
					case "recent":
					default:
						return new Date(b.dateGenerated || Date.now()).getTime() - new Date(a.dateGenerated || Date.now()).getTime();
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
		handleMarkDone,
	};
};

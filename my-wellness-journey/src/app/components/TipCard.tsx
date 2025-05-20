import { FaBookmark, FaRegBookmark, FaCheckCircle, FaRegCircle, FaLightbulb } from "react-icons/fa";
import Link from "next/link";
import { Tip } from "@/types/tip";
import { useState, useEffect } from "react";
import { useSavedStore } from "@/stores/savedStore";

interface TipCardProps {
	tip: Tip;
	onSaveToggle: (tipId: string) => void;
	onMarkDone?: (tipId: string) => void;
}

const TipCard = ({ tip, onSaveToggle, onMarkDone }: TipCardProps) => {
	// Get the saved tips from the global store for validation
	const { savedTips } = useSavedStore();

	// Handle both old and new format tips
	const id = tip.id;
	const task =
		"task" in tip ? tip.task : (("title" in tip) as any) ? (tip as any).title : "Wellness tip";
	const reason =
		"reason" in tip
			? tip.reason
			: (("content" in tip) as any)
			? (tip as any).content
			: "No description available";

	// Local state to handle UI updates immediately
	const [isSaved, setIsSaved] = useState(tip.saved || savedTips.includes(id) || false);
	const [isDone, setIsDone] = useState(tip.done || false);

	// Update local state when props or global state changes
	useEffect(() => {
		const isCurrentlySaved = tip.saved || savedTips.includes(id);
		if (isSaved !== isCurrentlySaved) {
			setIsSaved(isCurrentlySaved);
		}
	}, [tip.saved, savedTips, id, isSaved]);

	useEffect(() => {
		if (isDone !== (tip.done || false)) {
			setIsDone(tip.done || false);
		}
	}, [tip.done, isDone]);

	// Check localStorage for done status on mount
	useEffect(() => {
		const storedDoneTips = localStorage.getItem("doneTips");
		if (storedDoneTips) {
			const doneTips = JSON.parse(storedDoneTips);
			if (doneTips.includes(id) && !isDone) {
				setIsDone(true);
			}
		}
	}, [id, isDone]);

	const handleSaveToggle = (e: React.MouseEvent) => {
		e.stopPropagation();

		// Call the parent handler
		onSaveToggle(id);

		// Toggle local state for immediate UI feedback
		setIsSaved(!isSaved);
	};

	const handleMarkDone = () => {
		if (onMarkDone) {
			setIsDone(!isDone);
			onMarkDone(id);
		}
	};

	return (
		<div
			className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 ${
				isDone ? "opacity-75" : ""
			}`}
		>
			{/* Task with checkbox and save button */}
			<div className="flex items-center justify-between gap-2 mb-4">
				<div
					className="flex items-center gap-2 flex-1 cursor-pointer rounded-md transition-colors duration-150 group hover:bg-gray-50 active:bg-gray-100 px-2 py-1"
					onClick={handleMarkDone}
				>
					<div className="flex-shrink-0 text-primary-accent group-hover:scale-105 transition-transform duration-150">
						{isDone ? <FaCheckCircle className="w-5 h-5" /> : <FaRegCircle className="w-5 h-5" />}
					</div>
					<p className="text-base text-primary-body">{task}</p>
				</div>

				{/* Save Button */}
				<button
					onClick={handleSaveToggle}
					className="text-primary-accent hover:scale-110 transition-transform duration-200 flex-shrink-0"
					aria-label={isSaved ? "Remove from saved" : "Save tip"}
					data-testid={`save-button-${id}`}
				>
					{isSaved ? <FaBookmark className="w-4 h-4" /> : <FaRegBookmark className="w-4 h-4" />}
				</button>
			</div>

			{/* Reason with icon */}
			<div className="flex items-start gap-2 mb-4 px-2">
				<div className="flex-shrink-0 mt-[0.3rem]">
					<FaLightbulb className="w-5 h-5 text-yellow-400" />
				</div>
				<p className="text-sm text-primary-subheading">{reason}</p>
			</div>

			{/* Source link aligned to the right */}
			<div className="flex justify-end">
				<Link
					href={`/tips/${id}`}
					className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
				>
					Read Source
				</Link>
			</div>
		</div>
	);
};

export default TipCard;

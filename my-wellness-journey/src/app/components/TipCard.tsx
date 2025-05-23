import { FaBookmark, FaRegBookmark, FaCheckCircle, FaRegCircle, FaLightbulb } from "react-icons/fa";
import Link from "next/link";
import { Tip } from "@/types/tip";
import { useState, useEffect } from "react";
import { useSavedStore } from "@/stores/savedStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-hot-toast";

// Types and Interfaces
interface TipCardProps {
	tip: Tip;
	onSaveToggle: (tipId: string) => void;
}

interface TaskSectionProps {
	id: string;
	task: string;
	isSaved: boolean;
	onSaveToggle: (e: React.MouseEvent) => void;
}

interface ReasonSectionProps {
	reason: string;
}

interface SourceLinkProps {
	id: string;
	sourceUrl?: string;
}

// Utility Functions
const getTipContent = (tip: Tip): { task: string; reason: string } => ({
	task: "task" in tip ? tip.task : (("title" in tip) as any) ? (tip as any).title : "Wellness tip",
	reason:
		"reason" in tip
			? tip.reason
			: (("content" in tip) as any)
			? (tip as any).content
			: "No description available",
});

// Components
const TaskSection: React.FC<TaskSectionProps> = ({ id, task, isSaved, onSaveToggle }) => {
	return (
		<div className="flex items-start justify-between gap-2 mb-4 px-2">
			<p className="font-medium text-primary-heading">{task}</p>

			<button
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onSaveToggle(e);
				}}
				type="button"
				className="text-primary-accent hover:scale-110 transition-transform duration-200 flex-shrink-0"
				aria-label={isSaved ? "Remove from saved" : "Save tip"}
				data-testid={`save-button-${id}`}
			>
				{isSaved ? <FaBookmark className="w-4 h-4" /> : <FaRegBookmark className="w-4 h-4" />}
			</button>
		</div>
	);
};

const ReasonSection: React.FC<ReasonSectionProps> = ({ reason }) => (
	<div className="flex items-start gap-2 mb-4 px-2">
		<p className="text-sm text-primary-subheading whitespace-normal break-words">{reason}</p>
	</div>
);

const SourceLink: React.FC<SourceLinkProps> = ({ id, sourceUrl }) => (
	<div className="flex justify-end gap-4">
		{sourceUrl && (
			<a
				href={sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
			>
				Read Source
			</a>
		)}
	</div>
);

// Main Component
const TipCard: React.FC<TipCardProps> = ({ tip, onSaveToggle }) => {
	const { savedTips } = useSavedStore();
	const { isAuthenticated } = useAuthStore();
	const { task, reason } = getTipContent(tip);

	const [isSaved, setIsSaved] = useState(savedTips.includes(tip.id));

	useEffect(() => {
		const isCurrentlySaved = savedTips.includes(tip.id);
		setIsSaved(isCurrentlySaved);
	}, [savedTips, tip.id]);

	const handleSaveToggle = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isAuthenticated) {
			toast.error("Please log in to save tips");
			return;
		}

		try {
			await onSaveToggle(tip.id);
		} catch (error) {
			console.error("Error in handleSaveToggle:", error);
			toast.error("Failed to update tip");
		}
	};

	return (
		<div
			className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100`}
			onClick={(e) => e.stopPropagation()}
		>
			<TaskSection id={tip.id} task={task} isSaved={isSaved} onSaveToggle={handleSaveToggle} />
			<ReasonSection reason={reason} />
			<SourceLink id={tip.id} sourceUrl={tip.sourceUrl} />
		</div>
	);
};

export default TipCard;

import { FaBookmark, FaRegBookmark, FaCheckCircle, FaRegCircle, FaLightbulb } from "react-icons/fa";
import Link from "next/link";
import { Tip } from "@/types/tip";
import { useState, useEffect } from "react";
import { useSavedStore } from "@/stores/savedStore";

// Types and Interfaces
interface TipCardProps {
	tip: Tip;
	onSaveToggle: (tipId: string) => void;
	onMarkDone?: (tipId: string) => void;
}

interface TaskSectionProps {
	id: string;
	task: string;
	isDone: boolean;
	isSaved: boolean;
	onMarkDone: () => void;
	onSaveToggle: (e: React.MouseEvent) => void;
}

interface ReasonSectionProps {
	reason: string;
}

interface SourceLinkProps {
	id: string;
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

const getStoredDoneStatus = (id: string): boolean => {
	const storedDoneTips = localStorage.getItem("doneTips");
	if (storedDoneTips) {
		const doneTips = JSON.parse(storedDoneTips);
		return doneTips.includes(id);
	}
	return false;
};

// Components
const TaskSection: React.FC<TaskSectionProps> = ({
	id,
	task,
	isDone,
	isSaved,
	onMarkDone,
	onSaveToggle,
}) => (
	<div className="flex items-center justify-between gap-2 mb-4">
		<div
			className="flex items-center gap-2 flex-1 cursor-pointer rounded-md transition-colors duration-150 group hover:bg-gray-50 active:bg-gray-100 px-2 py-1"
			onClick={onMarkDone}
		>
			<div className="flex-shrink-0 text-primary-accent group-hover:scale-105 transition-transform duration-150">
				{isDone ? <FaCheckCircle className="w-5 h-5" /> : <FaRegCircle className="w-5 h-5" />}
			</div>
			<p className="text-base text-primary-body">{task}</p>
		</div>

		<button
			onClick={onSaveToggle}
			className="text-primary-accent hover:scale-110 transition-transform duration-200 flex-shrink-0"
			aria-label={isSaved ? "Remove from saved" : "Save tip"}
			data-testid={`save-button-${id}`}
		>
			{isSaved ? <FaBookmark className="w-4 h-4" /> : <FaRegBookmark className="w-4 h-4" />}
		</button>
	</div>
);

const ReasonSection: React.FC<ReasonSectionProps> = ({ reason }) => (
	<div className="flex items-start gap-2 mb-4 px-2">
		<div className="flex-shrink-0 mt-[0.3rem]">
			<FaLightbulb className="w-5 h-5 text-yellow-400" />
		</div>
		<p className="text-sm text-primary-subheading">{reason}</p>
	</div>
);

const SourceLink: React.FC<SourceLinkProps> = ({ id }) => (
	<div className="flex justify-end">
		<Link
			href={`/tips/${id}`}
			className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
		>
			Read Source
		</Link>
	</div>
);

// Main Component
const TipCard: React.FC<TipCardProps> = ({ tip, onSaveToggle, onMarkDone }) => {
	const { savedTips } = useSavedStore();
	const { task, reason } = getTipContent(tip);

	const [isSaved, setIsSaved] = useState(tip.saved || savedTips.includes(tip.id) || false);
	const [isDone, setIsDone] = useState(tip.done || false);

	useEffect(() => {
		const isCurrentlySaved = tip.saved || savedTips.includes(tip.id);
		if (isSaved !== isCurrentlySaved) {
			setIsSaved(isCurrentlySaved);
		}
	}, [tip.saved, savedTips, tip.id, isSaved]);

	useEffect(() => {
		if (isDone !== (tip.done || false)) {
			setIsDone(tip.done || false);
		}
	}, [tip.done, isDone]);

	useEffect(() => {
		const storedDone = getStoredDoneStatus(tip.id);
		if (storedDone && !isDone) {
			setIsDone(true);
		}
	}, [tip.id, isDone]);

	const handleSaveToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSaveToggle(tip.id);
		setIsSaved(!isSaved);
	};

	const handleMarkDone = () => {
		if (onMarkDone) {
			setIsDone(!isDone);
			onMarkDone(tip.id);
		}
	};

	return (
		<div
			className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 ${
				isDone ? "opacity-75" : ""
			}`}
		>
			<TaskSection
				id={tip.id}
				task={task}
				isDone={isDone}
				isSaved={isSaved}
				onMarkDone={handleMarkDone}
				onSaveToggle={handleSaveToggle}
			/>
			<ReasonSection reason={reason} />
			<SourceLink id={tip.id} />
		</div>
	);
};

export default TipCard;

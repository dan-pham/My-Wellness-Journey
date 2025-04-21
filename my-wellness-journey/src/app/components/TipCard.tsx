import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import Link from "next/link";

interface TipCardProps {
	id: string;
	title: string;
	content: string;
	category: string;
	source: string;
	isSaved: boolean;
	onSaveToggle: () => void;
	showFullContent?: boolean;
	isDaily?: boolean;
	onDismiss?: () => void;
	sourceUrl: string;
}

const TipCard = ({
	id,
	title,
	content,
	category,
	source,
	isSaved,
	onSaveToggle,
	showFullContent = false,
	isDaily = false,
	onDismiss,
	sourceUrl,
}: TipCardProps) => {
	return (
		<div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
			<div className="flex items-start justify-between gap-4 mb-4">
				<span className="px-3 py-1 text-sm font-semibold text-white bg-primary-heading/90 rounded-full">
					{category}
				</span>

				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					{/* Save Button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							onSaveToggle();
						}}
						className="text-primary-accent hover:scale-110 transition-transform duration-200"
						aria-label={isSaved ? "Remove from saved" : "Save tip"}
					>
						{isSaved ? <FaBookmark className="w-4 h-4" /> : <FaRegBookmark className="w-4 h-4" />}
					</button>

					{/* Dismiss Button (Only for Daily Tips) */}
					{isDaily && onDismiss && (
						<button
							onClick={onDismiss}
							className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
						>
							Dismiss for today
						</button>
					)}
				</div>
			</div>

			{/* Content */}
			<h3
				className={`text-lg font-semibold text-primary-heading mb-3 ${
					!showFullContent && "line-clamp-2"
				}`}
			>
				{title}
			</h3>

			<p className={`text-primary-subheading mb-4 ${!showFullContent && "line-clamp-3"}`}>
				{content}
			</p>

			<div className="flex items-center justify-between text-sm text-primary-subheading mt-auto">
				<span className="italic">Source: {source}</span>

				{/* Read more */}
				<Link
					href={`/tips/${id}`}
					className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
				>
					Read More
				</Link>
			</div>
		</div>
	);
};

export default TipCard;

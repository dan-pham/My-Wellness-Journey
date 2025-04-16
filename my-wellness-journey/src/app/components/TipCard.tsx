import { FaBookmark, FaRegBookmark, FaClock } from "react-icons/fa";

interface TipCardProps {
	id: string;
	title: string;
	content: string;
	category: string;
	source: string;
	isSaved: boolean;
	onSaveToggle: () => void;
}

const TipCard = ({ title, content, category, source, isSaved, onSaveToggle }: TipCardProps) => {
	return (
		<div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
			<div className="flex items-start justify-between gap-4 mb-4">
				<span className="px-3 py-1 text-sm font-semibold text-white bg-primary-heading/90 rounded-full">
					{category}
				</span>
				<button
					onClick={onSaveToggle}
					className="text-primary-accent hover:scale-110 transition-transform duration-200"
					aria-label={isSaved ? "Remove from saved" : "Save tip"}
				>
					{isSaved ? <FaBookmark className="w-4 h-4" /> : <FaRegBookmark className="w-4 h-4" />}
				</button>
			</div>

			<h3 className="text-lg font-semibold text-primary-heading mb-3 line-clamp-2">{title}</h3>

			<p className="text-primary-subheading mb-4 line-clamp-3">{content}</p>

			<div className="flex items-center justify-between text-sm text-primary-subheading mt-auto">
				<span>{source}</span>
			</div>
		</div>
	);
};

export default TipCard;

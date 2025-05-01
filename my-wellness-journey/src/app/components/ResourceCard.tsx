import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useResourcesHistoryStore } from "../../stores/resourcesHistoryStore";

interface ResourceCardProps {
	id: string;
	category: string;
	imageUrl: string;
	title: string;
	description: string;
	sourceUrl: string;
	isSaved?: boolean;
	onSaveToggle?: () => void;
}

const ResourceCard = ({
	id,
	category,
	imageUrl,
	title,
	description,
	sourceUrl,
	isSaved = false,
	onSaveToggle,
}: ResourceCardProps) => {
	const addResource = useResourcesHistoryStore((state) => state.addResource);

	const handleResourceClick = () => {
		addResource({
			id,
			title,
			description,
			category,
			imageUrl,
			sourceUrl,
		});
	};

	return (
		<div className="overflow-hidden rounded-xl h-full flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
			<div className="relative w-full aspect-[4/3]">
				<Image
					src={imageUrl}
					alt={title}
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				/>
				<div className="absolute top-4 left-4">
					<span className="px-4 py-2 text-sm font-semibold text-white bg-primary-heading/90 rounded-full backdrop-blur-sm">
						{category}
					</span>
				</div>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onSaveToggle;
					}}
					className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200"
					aria-label={isSaved ? "Remove from saved" : "Save resource"}
				>
					{isSaved ? (
						<FaBookmark className="w-4 h-4 text-primary-accent" />
					) : (
						<FaRegBookmark className="w-4 h-4 text-primary-accent" />
					)}
				</button>
			</div>

			<div className="p-6 flex flex-col flex-grow">
				<h3 className="text-xl font-semibold text-primary-heading mb-3 line-clamp-2">{title}</h3>
				<p className="text-primary-subheading mb-4 flex-grow line-clamp-3">{description}</p>

				<div className="mt-auto flex justify-end">
					<Link
						href={`/resources/${id}`}
						onClick={handleResourceClick}
						className="text-primary-accent px-4 py-2 rounded-full hover:bg-primary-accent/10 font-semibold transition-colors duration-200 flex items-center gap-2"
					>
						Read More <FaArrowRight className="w-4 h-4" color="#3A8C96" />
					</Link>
				</div>
			</div>
		</div>
	);
};

export default ResourceCard;

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useResourceHistoryStore } from "../../stores/resourceHistoryStore";
import { stripHtmlForPreview } from "@/utils/contentUtils";

interface ResourceCardProps {
	id: string;
	imageUrl: string;
	title: string;
	description: string;
	sourceUrl: string;
	isSaved?: boolean;
	onSaveToggle?: () => void;
}

const ResourceCard = ({
	id,
	imageUrl,
	title,
	description,
	sourceUrl = "#",
	isSaved = false,
	onSaveToggle,
}: ResourceCardProps) => {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();

	const { addToHistory } = useResourceHistoryStore();

	// Strip HTML for preview display
	const displayDescription = stripHtmlForPreview(description);

	const handleResourceClick = () => {
		// Add to history when clicking on the card or "Read More"
		addToHistory({
			id,
			title,
			description,
			imageUrl,
			sourceUrl,
		});
	};

	const handleSaveToggle = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (!isAuthenticated) {
			toast(
				(t) => (
					<div className="flex items-center gap-4">
						<span>Please log in or register to save resources</span>
						<button
							onClick={() => {
								toast.dismiss(t.id);
								router.push("/login");
							}}
							className="px-3 py-1 bg-primary-accent text-white rounded-md text-sm hover:bg-primary-accent/90 transition-colors"
						>
							Login
						</button>
					</div>
				),
				{
					duration: 5000,
					style: {
						padding: "16px",
						borderRadius: "10px",
						background: "#fff",
						color: "#333",
					},
				}
			);
			return;
		}

		// If authenticated, proceed with the original onSaveToggle function
		onSaveToggle && onSaveToggle();
	};

	return (
		<div
			className="overflow-hidden rounded-xl h-full flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
			onClick={handleResourceClick}
		>
			<div className="relative w-full aspect-[4/3]">
				<Image
					src={imageUrl}
					alt={title}
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				/>
				<button
					onClick={handleSaveToggle}
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
				<p className="text-primary-subheading mb-4 flex-grow line-clamp-3">{displayDescription}</p>

				<div className="mt-auto flex justify-end">
					<Link
						href={`/resources/${id}`}
						className="text-primary-accent px-4 py-2 rounded-full hover:bg-primary-accent/10 font-semibold transition-colors duration-200 flex items-center gap-2"
						onClick={handleResourceClick}
					>
						Read More <FaArrowRight className="w-4 h-4" color="#3A8C96" />
					</Link>
				</div>
			</div>
		</div>
	);
};

export default ResourceCard;

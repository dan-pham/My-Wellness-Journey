import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useResourceHistoryStore } from "../../stores/resourceHistoryStore";
import { stripHtmlForPreview } from "@/utils/contentUtils";

// Types and Interfaces
interface ResourceCardProps {
	id: string;
	imageUrl: string;
	title: string;
	description: string;
	sourceUrl: string;
	isSaved?: boolean;
	onSaveToggle?: () => void;
}

interface ResourceImageProps {
	imageUrl: string;
	title: string;
	isSaved: boolean;
	onSaveToggle: (e: React.MouseEvent) => void;
}

interface ResourceContentProps {
	id: string;
	title: string;
	description: string;
	onClick: () => void;
}

interface SaveButtonProps {
	isSaved: boolean;
	onClick: (e: React.MouseEvent) => void;
}

interface LoginToastProps {
	onLoginClick: () => void;
}

// Components
const SaveButton: React.FC<SaveButtonProps> = ({ isSaved, onClick }) => (
	<button
		onClick={onClick}
		className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200"
		aria-label={isSaved ? "Remove from saved" : "Save resource"}
	>
		{isSaved ? (
			<FaBookmark className="w-4 h-4 text-primary-accent" />
		) : (
			<FaRegBookmark className="w-4 h-4 text-primary-accent" />
		)}
	</button>
);

const ResourceImage: React.FC<ResourceImageProps> = ({
	imageUrl,
	title,
	isSaved,
	onSaveToggle,
}) => (
	<div className="relative w-full aspect-[4/3]">
		<Image
			src={imageUrl}
			alt={title}
			fill
			className="object-cover"
			sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
		/>
		<SaveButton isSaved={isSaved} onClick={onSaveToggle} />
	</div>
);

const ResourceContent: React.FC<ResourceContentProps> = ({ id, title, description, onClick }) => (
	<div className="p-6 flex flex-col flex-grow">
		<h3 className="text-xl font-semibold text-primary-heading mb-3 line-clamp-2">{title}</h3>
		<p className="text-primary-subheading mb-4 flex-grow line-clamp-3">{description}</p>

		<div className="mt-auto flex justify-end">
			<Link
				href={`/resources/${id}`}
				className="text-primary-accent px-4 py-2 rounded-full hover:bg-primary-accent/10 font-semibold transition-colors duration-200 flex items-center gap-2"
				onClick={onClick}
			>
				Read More <FaArrowRight className="w-4 h-4" color="#3A8C96" />
			</Link>
		</div>
	</div>
);

const LoginToast: React.FC<LoginToastProps> = ({ onLoginClick }) => (
	<div className="flex items-center gap-4">
		<span>Please log in or register to save resources</span>
		<button
			onClick={onLoginClick}
			className="px-3 py-1 bg-primary-accent text-white rounded-md text-sm hover:bg-primary-accent/90 transition-colors"
		>
			Login
		</button>
	</div>
);

// Main Component
const ResourceCard: React.FC<ResourceCardProps> = ({
	id,
	imageUrl,
	title,
	description,
	sourceUrl = "#",
	isSaved = false,
	onSaveToggle,
}) => {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const { addToHistory } = useResourceHistoryStore();

	const displayDescription = stripHtmlForPreview(description);

	const handleResourceClick = () => {
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
					<LoginToast
						onLoginClick={() => {
							toast.dismiss(t.id);
							router.push("/login");
						}}
					/>
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

		onSaveToggle?.();
	};

	return (
		<div
			className="overflow-hidden rounded-xl h-full flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
			onClick={handleResourceClick}
		>
			<ResourceImage
				imageUrl={imageUrl}
				title={title}
				isSaved={isSaved}
				onSaveToggle={handleSaveToggle}
			/>
			<ResourceContent
				id={id}
				title={title}
				description={displayDescription}
				onClick={handleResourceClick}
			/>
		</div>
	);
};

export default ResourceCard;

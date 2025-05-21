"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Loading } from "../../components/Loading";
import { Error } from "../../components/Error";
import { useHealthStore } from "@/stores/healthStore";
import { useSavedStore } from "@/stores/savedStore";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { ResourceDetail } from "@/types/resource";
import { useResourceHistoryStore } from "@/stores/resourceHistoryStore";

// Back button component
const BackButton = ({ onBack }: { onBack: () => void }) => (
	<button
		onClick={onBack}
		className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 mb-6"
	>
		<FaChevronLeft className="w-3.5 h-3.5" />
		<span className="font-medium">Back to Resources</span>
	</button>
);

// Resource header component with image and save button
interface ResourceHeaderProps {
	resource: ResourceDetail;
	isSaved: boolean;
	onSaveToggle: () => void;
}

const ResourceHeader = ({ resource, isSaved, onSaveToggle }: ResourceHeaderProps) => (
	<>
		{resource.imageUrl && (
			<div className="w-full h-64 md:h-96 relative">
				<img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover" />
			</div>
		)}
		<div className="p-6 md:p-8">
			<div className="flex items-start justify-between gap-4 mb-6">
				<h1 className="text-2xl md:text-3xl font-bold text-primary-heading">{resource.title}</h1>
				<button
					onClick={onSaveToggle}
					className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
						isSaved
							? "bg-primary-accent/10 text-primary-accent hover:bg-primary-accent/20"
							: "bg-primary-accent text-white hover:bg-primary-accent/90"
					}`}
				>
					{isSaved ? "Saved" : "Save"}
				</button>
			</div>
		</div>
	</>
);

// Resource content component
interface ResourceContentProps {
	content: string;
	sourceUrl?: string;
}

const ResourceContent = ({ content, sourceUrl }: ResourceContentProps) => (
	<div className="p-6 md:p-8 pt-0">
		<div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
		{sourceUrl && (
			<div className="mt-8 pt-8 border-t border-gray-100">
				<a
					href={sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
				>
					View Original Source
				</a>
			</div>
		)}
	</div>
);

export default function ResourcePage() {
	const params = useParams();
	const router = useRouter();
	const resourceId = params.id as string;
	const [resource, setResource] = useState<ResourceDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaved, setIsSaved] = useState(false);

	const { isAuthenticated } = useAuthStore();
	const { fetchResourceById } = useHealthStore();
	const { savedResources, addResource, removeResource, fetchSavedResources } = useSavedStore();
	const { addToHistory } = useResourceHistoryStore();

	useEffect(() => {
		const loadResource = async () => {
			try {
				const data = await fetchResourceById(resourceId);
				if (!data) {
					setError("Resource not found");
					setResource(null);
					return;
				}
				setResource(data);
				setError(null);
				// Add to history when resource is loaded successfully
				addToHistory({
					id: data.id,
					title: data.title,
					sourceUrl: data.sourceUrl || "",
					description: data.content || "",
					imageUrl: data.imageUrl || "",
				});
			} catch (err) {
				console.error("Error fetching resource:", err);
				setError("Failed to load resource");
				setResource(null);
			} finally {
				setIsLoading(false);
			}
		};

		if (isAuthenticated) {
			fetchSavedResources();
		}
		loadResource();
	}, [resourceId, isAuthenticated, fetchResourceById, fetchSavedResources, addToHistory]);

	useEffect(() => {
		if (resource && savedResources) {
			setIsSaved(savedResources.includes(resource.id));
		}
	}, [resource, savedResources]);

	const handleSaveToggle = async () => {
		if (!resource) return;

		if (!isAuthenticated) {
			toast.error("Please log in to save resources");
			setTimeout(() => {
				window.location.href = "/login";
			}, 2000);
			return;
		}

		try {
			if (isSaved) {
				await removeResource(resource.id);
				setIsSaved(false);
				toast.success("Resource removed from saved items");
			} else {
				await addResource(resource.id, resource);
				setIsSaved(true);
				toast.success("Resource saved successfully");
			}
		} catch (error) {
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	if (isLoading) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					<Loading />
				</div>
				<Footer />
			</main>
		);
	}

	if (error || !resource) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					<Error message={error || "Resource not found"} />
				</div>
				<Footer />
			</main>
		);
	}

	return (
		<main className="min-h-screen w-full">
			<Header />
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				<BackButton onBack={() => router.back()} />
				<article className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
					<ResourceHeader resource={resource} isSaved={isSaved} onSaveToggle={handleSaveToggle} />
					<ResourceContent content={resource.content} sourceUrl={resource.sourceUrl} />
				</article>
			</div>
			<Footer />
		</main>
	);
}

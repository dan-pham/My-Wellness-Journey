"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaArrowLeft, FaBookmark, FaRegBookmark } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchHealthDataById } from "../../../lib/api/myhealthfinder";
import { useResourceHistoryStore } from "../../../stores/resourceHistoryStore";
import { useSavedStore } from "../../../stores/savedStore";
import toast from "react-hot-toast";
import { Resource } from "@/types/resource";
import { processHtmlForDetail, stripHtmlForPreview } from "@/utils/contentUtils";
import { useAuthStore } from "@/stores/authStore";

export default function ResourceDetailPage() {
	const router = useRouter();
	const params = useParams();
	const id = params?.id as string;

	const [resource, setResource] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Use the saved resources store
	const { savedResources, addResource, removeResource } = useSavedStore();
	const isSaved = savedResources.includes(id);

	// Use auth store
	const { isAuthenticated } = useAuthStore();

	// Use the resource history store
	const { addToHistory } = useResourceHistoryStore();

	useEffect(() => {
		const loadResourceDetail = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Fetch by ID directly
				const resource = await fetchHealthDataById(id);

				if (resource) {
					const resourceData = {
						id: resource.id,
						title: resource.title,
						content: resource.content,
						imageUrl:
							resource.imageUrl || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
						source: resource.source || "health.gov",
						url: resource.sourceUrl,
						fullContent: resource.content,
						relatedTopics: [],
					};

					setResource(resourceData);

					// Add to view history when resource is loaded
					addToHistory({
						id: resourceData.id,
						title: resourceData.title,
						description: resourceData.content,
						imageUrl: resourceData.imageUrl,
						sourceUrl: resourceData.url,
					});
				} else {
					throw new Error("Resource not found");
				}
			} catch (err) {
				console.error("Error loading resource details:", err);
				setError("Unable to load resource details. Please try again later.");
			} finally {
				setIsLoading(false);
			}
		};

		if (id) {
			loadResourceDetail();
		}
	}, [id, addToHistory]);

	const handleSaveToggle = () => {
		if (!isAuthenticated) {
			// Show error toast
			toast.error("Please log in to save resources", {
				id: "login-required",
				duration: 3000,
				icon: "🔒",
			});

			// Show a second toast with the login action
			toast.custom(
				<div className="bg-primary-accent text-white px-4 py-2 rounded-md">
					<button onClick={() => router.push("/login")} className="font-medium">
						Click to login
					</button>
				</div>,
				{
					id: "login-button",
					duration: 5000,
				}
			);
			return;
		}

		if (isSaved) {
			removeResource(id);
		} else if (resource) {
			addResource(id, {
				id: resource.id,
				title: resource.title,
				description: resource.content,
				imageUrl: resource.imageUrl,
				sourceUrl: resource.sourceUrl,
			});
		}
	};

	// Process HTML content for safe display
	const processedContent = resource ? processHtmlForDetail(resource.fullContent) : "";

	if (isLoading) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					<div className="animate-pulse">
						<div className="h-10 w-3/4 bg-gray-200 rounded mb-6"></div>
						<div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
						<div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
						<div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>
						<div className="h-60 w-full bg-gray-200 rounded"></div>
					</div>
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
					<div className="bg-red-50 p-6 rounded-lg border border-red-100">
						<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
						<p className="text-red-700">{error || "Resource not found"}</p>
						<button
							onClick={() => router.back()}
							className="mt-4 flex items-center gap-2 text-primary-accent"
						>
							<FaArrowLeft className="w-4 h-4" /> Go Back
						</button>
					</div>
				</div>
				<Footer />
			</main>
		);
	}

	return (
		<main className="min-h-screen w-full">
			<Header />
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* Back button */}
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 mb-6"
				>
					<FaArrowLeft className="w-4 h-4" /> Back
				</button>

				{/* Resource Detail */}
				<article className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
					{/* Header Section with Title and Image side-by-side */}
					<div className="flex flex-col md:flex-row">
						{/* Title and Actions Column */}
						<div className="p-6 md:w-1/2 flex flex-col">
							<div>
								<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-heading mb-4">
									{resource.title}
								</h1>
							</div>

							{/* Action buttons */}
							<div className="flex items-center gap-4 mt-4">
								<button
									onClick={handleSaveToggle}
									className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
									title={isSaved ? "Remove from saved" : "Save resource"}
								>
									{isSaved ? (
										<>
											<FaBookmark className="w-4 h-4 text-primary-accent" />
											<span className="text-primary-heading font-medium">Saved</span>
										</>
									) : (
										<>
											<FaRegBookmark className="w-4 h-4 text-primary-accent" />
											<span className="text-primary-heading font-medium">Save</span>
										</>
									)}
								</button>
							</div>
						</div>

						{/* Image Column */}
						<div className="relative md:w-1/2 h-auto">
							<div className="aspect-[4/3] w-full h-full">
								<Image
									src={resource.imageUrl}
									alt={resource.title}
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 50vw"
									priority
								/>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 md:p-8 border-t border-gray-200">
						<div
							className="content-html prose prose-lg max-w-none"
							dangerouslySetInnerHTML={{ __html: processedContent }}
						/>

						{resource.url && (
							<div className="mt-8 pt-6 border-t">
								<a
									href={resource.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary-accent hover:underline text-sm"
								>
									Source: {resource.source}
								</a>
							</div>
						)}
					</div>
				</article>
			</div>

			<Footer />
		</main>
	);
}

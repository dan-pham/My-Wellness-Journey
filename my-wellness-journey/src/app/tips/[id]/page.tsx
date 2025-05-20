"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaBookmark, FaRegBookmark } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { processHtmlForDetail } from "@/utils/contentUtils";
import { useSavedStore } from "@/stores/savedStore";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

export default function TipDetailPage() {
	const router = useRouter();
	const params = useParams();
	const id = params?.id as string;

	const [tip, setTip] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Connect to the saved store
	const { savedTips, addTip, removeTip } = useSavedStore();
	const { isAuthenticated } = useAuthStore();
	const isSaved = savedTips.includes(id);

	useEffect(() => {
		const loadTipDetail = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Proper way to handle the ID
				if (id.startsWith("medline-")) {
					// Extract the URL by removing the 'medline-' prefix
					const encodedUrl = id.substring(8); // "medline-" is 8 characters

					// Use our API route
					const response = await fetch(`/api/medlineplus/${id}`);

					if (!response.ok) {
						throw new Error(`API error: ${response.status}`);
					}

					const data = await response.json();

					if (data.error) {
						throw new Error(data.error);
					}

					setTip({
						id,
						task: data.title || "Health Topic",
						reason: data.content || "Visit the source page for full details.",
						sourceUrl: data.url,
						dateGenerated: new Date().toISOString(),
					});
				} else {
					throw new Error("Invalid tip ID format");
				}
			} catch (err) {
				console.error("Error loading tip details:", err);
				setError("Unable to load tip details. Please try again later.");
			} finally {
				setIsLoading(false);
			}
		};

		if (id) {
			loadTipDetail();
		}
	}, [id]);

	const handleSaveToggle = () => {
		if (!isAuthenticated) {
			// Show error toast
			toast.error("Please log in to save tips", {
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

		try {
			if (isSaved) {
				removeTip(id);
			} else if (tip) {
				// Ensure we have the complete tip information for saving
				const tipData = {
					id,
					task: tip.task,
					reason: tip.reason,
					sourceUrl: tip.sourceUrl || tip.url,
					dateGenerated: new Date().toISOString(),
				};
				addTip(id, tipData);
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
					<div className="animate-pulse" data-testid="loading-skeleton">
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

	if (error) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
					<div className="bg-red-50 p-6 rounded-lg border border-red-100">
						<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
						<p className="text-red-700">{error}</p>
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
					className="mb-6 flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
				>
					<FaArrowLeft className="w-4 h-4" /> Back
				</button>

				{/* Article */}
				<article className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
					{/* Header */}
					<div className="p-6 border-b border-gray-200 flex justify-between items-start">
						<div>
							<h1 className="text-3xl font-bold text-primary-heading">{tip.task}</h1>
						</div>

						{/* Save button */}
						<button
							onClick={handleSaveToggle}
							className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
							aria-label={isSaved ? "Remove from saved" : "Save tip"}
						>
							{isSaved ? (
								<FaBookmark className="w-6 h-6 text-primary-accent" />
							) : (
								<FaRegBookmark className="w-6 h-6 text-primary-accent" />
							)}
						</button>
					</div>

					{/* Content */}
					<div className="p-6 md:p-8">
						<div
							className="content-html prose prose-lg max-w-none"
							dangerouslySetInnerHTML={{ __html: processHtmlForDetail(tip.reason) }}
						/>

						{/* Source */}
						{tip.sourceUrl && (
							<div className="mt-8 pt-6 border-t">
								<a
									href={tip.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary-accent hover:underline text-sm"
								>
									Source: MedlinePlus
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

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

// Types
interface TipDetailData {
	id: string;
	task: string;
	reason: string;
	sourceUrl: string;
	dateGenerated: string;
}

// Components
const LoadingSkeleton = () => (
	<div className="animate-pulse" data-testid="loading-skeleton">
		<div className="h-10 w-3/4 bg-gray-200 rounded mb-6"></div>
		<div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
		<div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
		<div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>
		<div className="h-60 w-full bg-gray-200 rounded"></div>
	</div>
);

const ErrorDisplay = ({ error, onBack }: { error: string; onBack: () => void }) => (
	<div className="bg-red-50 p-6 rounded-lg border border-red-100">
		<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
		<p className="text-red-700">{error}</p>
		<button onClick={onBack} className="mt-4 flex items-center gap-2 text-primary-accent">
			<FaArrowLeft className="w-4 h-4" /> Go Back
		</button>
	</div>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
	<button
		onClick={onClick}
		className="mb-6 flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors duration-200"
	>
		<FaArrowLeft className="w-4 h-4" /> Back
	</button>
);

const SaveButton = ({ isSaved, onClick }: { isSaved: boolean; onClick: () => void }) => (
	<button
		onClick={onClick}
		className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
		aria-label={isSaved ? "Remove from saved" : "Save tip"}
	>
		{isSaved ? (
			<FaBookmark className="w-6 h-6 text-primary-accent" />
		) : (
			<FaRegBookmark className="w-6 h-6 text-primary-accent" />
		)}
	</button>
);

const ArticleHeader = ({
	title,
	isSaved,
	onSaveClick,
}: {
	title: string;
	isSaved: boolean;
	onSaveClick: () => void;
}) => (
	<div className="p-6 border-b border-gray-200 flex justify-between items-start">
		<div>
			<h1 className="text-3xl font-bold text-primary-heading">{title}</h1>
		</div>
		<SaveButton isSaved={isSaved} onClick={onSaveClick} />
	</div>
);

const ArticleContent = ({ content, sourceUrl }: { content: string; sourceUrl?: string }) => (
	<div className="p-6 md:p-8">
		<div
			className="content-html prose prose-lg max-w-none"
			dangerouslySetInnerHTML={{ __html: processHtmlForDetail(content) }}
		/>
		{sourceUrl && (
			<div className="mt-8 pt-6 border-t">
				<a
					href={sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary-accent hover:underline text-sm"
				>
					Source: MedlinePlus
				</a>
			</div>
		)}
	</div>
);

const PageLayout = ({ children }: { children: React.ReactNode }) => (
	<main className="min-h-screen w-full">
		<Header />
		<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">{children}</div>
		<Footer />
	</main>
);

export default function TipDetailPage() {
	const router = useRouter();
	const params = useParams();
	const id = params?.id as string;

	const [tip, setTip] = useState<TipDetailData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { savedTips, addTip, removeTip } = useSavedStore();
	const { isAuthenticated } = useAuthStore();
	const isSaved = savedTips.includes(id);

	useEffect(() => {
		const loadTipDetail = async () => {
			setIsLoading(true);
			setError(null);

			try {
				if (id.startsWith("medline-")) {
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
			toast.error("Please log in to save tips", {
				id: "login-required",
				duration: 3000,
				icon: "🔒",
			});

			router.push("/login");
			return;
		}

		try {
			if (isSaved) {
				removeTip(id);
			} else if (tip) {
				addTip(id, tip);
			}
		} catch (error) {
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	if (isLoading) {
		return (
			<PageLayout>
				<LoadingSkeleton />
			</PageLayout>
		);
	}

	if (error) {
		return (
			<PageLayout>
				<ErrorDisplay error={error} onBack={() => router.back()} />
			</PageLayout>
		);
	}

	if (!tip) {
		return null;
	}

	return (
		<PageLayout>
			<BackButton onClick={() => router.back()} />
			<article className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
				<ArticleHeader title={tip.task} isSaved={isSaved} onSaveClick={handleSaveToggle} />
				<ArticleContent content={tip.reason} sourceUrl={tip.sourceUrl} />
			</article>
		</PageLayout>
	);
}

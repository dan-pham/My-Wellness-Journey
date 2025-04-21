"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaBookmark, FaRegBookmark } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function TipDetailPage() {
	const router = useRouter();
	const params = useParams();
	const id = params?.id as string;

	const [tip, setTip] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaved, setIsSaved] = useState(false);

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

					// Extract category from URL path
					const urlObj = new URL(data.url);
					const pathParts = urlObj.pathname.split("/").filter(Boolean);
					const category =
						pathParts.length > 0
							? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
							: "Health Tip";

					setTip({
						id,
						title: data.title || "Health Topic",
						content: data.content || "Visit the source page for full details.",
						category,
						source: "MedlinePlus",
						url: data.url,
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
		setIsSaved(!isSaved);
	};

	if (isLoading) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1000px] mx-auto px-6 md:px-8 py-12">
					<div className="flex items-center justify-center py-16">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-accent"></div>
					</div>
				</div>
				<Footer />
			</main>
		);
	}

	if (error || !tip) {
		return (
			<main className="min-h-screen w-full">
				<Header />
				<div className="max-w-[1000px] mx-auto px-6 md:px-8 py-12">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 text-primary-accent hover:underline mb-6"
					>
						<FaArrowLeft className="w-3 h-3" /> Back
					</button>

					<div className="bg-red-50 text-red-700 p-6 rounded-lg text-center">
						<h2 className="text-xl font-semibold mb-2">Tip Not Found</h2>
						<p>{error || "We couldn't find the tip you're looking for."}</p>
						<button
							onClick={() => router.push("/tips")}
							className="mt-4 px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90"
						>
							Return to Tips
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

			<div className="max-w-[1000px] mx-auto px-6 md:px-8 py-12">
				{/* Back button */}
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-primary-accent hover:underline mb-6"
				>
					<FaArrowLeft className="w-3 h-3" /> Back
				</button>

				{/* Tip detail */}
				<article className="bg-white rounded-xl overflow-hidden shadow-sm">
					{/* Header */}
					<div className="p-6 md:p-8 border-b">
						<div className="flex justify-between items-start">
							<div>
								<span className="px-3 py-1 text-sm font-semibold text-white bg-primary-accent rounded-full">
									{tip.category}
								</span>
								<h1 className="text-2xl md:text-3xl font-bold text-primary-heading mt-3">
									{tip.title}
								</h1>
								<p className="text-primary-subheading mt-2">Source: {tip.source}</p>
							</div>

							{/* Save button */}
							<button
								onClick={handleSaveToggle}
								className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
							>
								{isSaved ? (
									<>
										<FaBookmark className="w-4 h-4 text-primary-accent" />
										<span>Saved</span>
									</>
								) : (
									<>
										<FaRegBookmark className="w-4 h-4 text-primary-accent" />
										<span>Save</span>
									</>
								)}
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 md:p-8">
						<p className="text-lg text-primary-subheading leading-relaxed">{tip.content}</p>

						{tip.url && (
							<div className="mt-8 pt-6 border-t">
								<a
									href={tip.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary-accent hover:underline text-sm"
								>
									View full article on MedlinePlus
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

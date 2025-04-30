"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaArrowLeft, FaBookmark, FaRegBookmark, FaShare } from "react-icons/fa";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchHealthDataById } from "../../../lib/api/myhealthfinder";

export default function ResourceDetailPage() {
	const router = useRouter();
	const params = useParams();
	const id = params?.id as string;

	const [resource, setResource] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaved, setIsSaved] = useState(false);

	useEffect(() => {
		const loadResourceDetail = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Fetch by ID directly
				const resource = await fetchHealthDataById(id);

				if (resource) {
					setResource({
						id: resource.id,
						title: resource.title,
						content: resource.content,
						imageUrl:
							resource.imageUrl || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
						category: resource.category,
						source: resource.source || "health.gov",
						url: resource.sourceUrl,
						fullContent: resource.content,
						relatedTopics: [],
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
	}, [id]);

	const handleSaveToggle = () => {
		setIsSaved(!isSaved);
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator
				.share({
					title: resource?.title,
					text: `Check out this health resource: ${resource?.title}`,
					url: window.location.href,
				})
				.catch((error) => console.log("Error sharing:", error));
		} else {
			// Fallback - copy URL to clipboard
			navigator.clipboard.writeText(window.location.href);
			alert("Link copied to clipboard!");
		}
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

	if (error || !resource) {
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
						<h2 className="text-xl font-semibold mb-2">Resource Not Found</h2>
						<p>{error || "We couldn't find the resource you're looking for."}</p>
						<button
							onClick={() => router.push("/resources")}
							className="mt-4 px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90"
						>
							Return to Resources
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

				{/* Resource detail */}
				<article className="bg-white rounded-xl overflow-hidden shadow-sm">
					{/* Hero image */}
					<div className="w-full">
						<div className="container mx-auto grid md:grid-cols-2 gap-6 items-center px-4 py-8">
							{/* Content Column */}
							<div className="order-2 md:order-1">
								<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mt-3">
									{resource.title}
								</h1>
								<span className="px-3 py-1 text-sm font-semibold text-white bg-primary-accent rounded-full">
									{resource.category}
								</span>
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

							{/* Image Column */}
							<div className="order-1 md:order-2 relative">
								<div className="aspect-[4/3] w-full overflow-hidden rounded-lg shadow-md">
									<Image
										src={resource.imageUrl}
										alt={resource.title}
										width={400}
										height={400}
										className="object-cover w-full h-full"
										sizes="(max-width: 768px) 100vw, 600px"
										priority
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 md:p-8">
						<div
							className="prose max-w-none prose-headings:text-primary-heading prose-a:text-primary-accent"
							dangerouslySetInnerHTML={{ __html: resource.fullContent }}
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

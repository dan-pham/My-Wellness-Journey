"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import { useRecommendedResourcesStore } from "@/stores/recommendedResourcesStore";
import ResourceCard from "./ResourceCard";
import { Loading } from "./Loading";
import { EmptyState } from "./EmptyState";
import { Resource } from "@/types/resource";
import toast from "react-hot-toast";

export default function RecommendedResources() {
	// Get user data from auth store
	const { isAuthenticated, user } = useAuthStore();

	// Get saved resources data
	const { savedResources, addResource, removeResource } = useSavedStore();

	// Get recommended resources from store
	const {
		resources: recommendedResources,
		isLoading,
		error,
		needsRefresh,
		setResources,
		setLoading,
		setError,
	} = useRecommendedResourcesStore();

	// Function to fetch recommended resources based on user conditions
	const fetchRecommendedResources = async () => {
		setLoading(true);
		setError(null);

		try {
			// Get user conditions from profile or use general health topics as fallback
			const conditions = user?.profile?.chronicConditions?.map((c) => c.name);

			// Default general health topics to use if no conditions are found
			const defaultTopics = ["exercise", "diet", "heart"];

			// If no conditions or empty conditions array, use default topics
			const topicsToUse = conditions && conditions.length > 0 ? conditions : defaultTopics;

			// Create prompt for GPT to recommend resources
			const prompt = `Based on a patient with these health conditions or interests: ${topicsToUse.join(
				", "
			)}, 
                      recommend 3 specific resources from the MyHealthFinder API that would be 
                      most beneficial. Focus on practical, evidence-based resources that address 
                      their specific needs. Format the response as a JSON array of keywords to search for.`;

			// Call the GPT API to get resource recommendations
			const gptResponse = await fetch("/api/gpt", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt,
				}),
			});

			if (!gptResponse.ok) {
				throw new Error("Failed to get recommendations");
			}

			const gptData = await gptResponse.json();
			let keywords: string[] = [];

			// Parse the GPT response to get keywords
			if (gptData.reply) {
				try {
					// Try to parse the response as JSON
					const parsedReply = JSON.parse(gptData.reply);
					if (Array.isArray(parsedReply)) {
						keywords = parsedReply.slice(0, 3);
					} else if (parsedReply.keywords && Array.isArray(parsedReply.keywords)) {
						keywords = parsedReply.keywords.slice(0, 3);
					}
				} catch (e) {
					// If parsing fails, try to extract keywords from the text response
					const keywordMatch = gptData.reply.match(/\[(.*)\]/);
					if (keywordMatch && keywordMatch[1]) {
						keywords = keywordMatch[1]
							.split(",")
							.map((k: string) => k.trim().replace(/"/g, ""))
							.slice(0, 3);
					} else {
						// Fallback to using the topicsToUse directly
						keywords = topicsToUse.slice(0, 3);
					}
				}
			}

			// If we couldn't get keywords, use the topicsToUse directly
			if (keywords.length === 0) {
				keywords = topicsToUse.slice(0, 3);
			}

			// Direct fallback if GPT fails - guaranteed to have at least these topics
			if (keywords.length === 0) {
				keywords = defaultTopics;
			}

			// Fetch resources for each keyword
			const resourcePromises = keywords.map(async (keyword) => {
				try {
					const response = await fetch(
						`/api/myhealthfinder?keyword=${encodeURIComponent(keyword)}&limit=3`
					);

					if (!response.ok) {
						console.error(`Failed to fetch resource for keyword: ${keyword}`);
						return null;
					}

					const data = await response.json();

					// Check if we have valid resources
					if (!data.Result || !data.Result.Resources || !data.Result.Resources.Resource) {
						console.warn(`No resources found for keyword: ${keyword}`);
						return null;
					}

					// Get the resource
					const resource = Array.isArray(data.Result.Resources.Resource)
						? data.Result.Resources.Resource[0]
						: data.Result.Resources.Resource;

					if (!resource) {
						return null;
					}

					// Extract content
					const sectionContent = resource.Sections?.section?.[0]?.Content || "";

					// Format as a Resource object
					return {
						id: resource.Id,
						title: resource.Title || "Health Resource",
						description:
							(sectionContent || resource.MyHFDescription || "No content available")
								.replace(/<\/?[^>]+(>|$)/g, "")
								.substring(0, 150) + "...",
						sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
						imageUrl:
							resource.ImageUrl?.replace("Small", "Large") ||
							"https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
					};
				} catch (error) {
					console.error(`Error fetching resource for keyword ${keyword}:`, error);
					return null;
				}
			});

			// Wait for all resource fetches to complete
			const resources = await Promise.all(resourcePromises);

			// Filter out null resources
			const validResources = resources.filter(Boolean);

			// If no resources were found using the keywords, try a general search
			if (validResources.length === 0) {
				try {
					console.log("No specific resources found, trying general health search");
					const generalResponse = await fetch(`/api/myhealthfinder?keyword=general&limit=3`);

					if (generalResponse.ok) {
						const generalData = await generalResponse.json();

						if (generalData.Result?.Resources?.Resource) {
							const generalResources = Array.isArray(generalData.Result.Resources.Resource)
								? generalData.Result.Resources.Resource
								: [generalData.Result.Resources.Resource];

							const formattedGeneralResources = generalResources.map((resource: any) => ({
								id: resource.Id,
								title: resource.Title || "Health Resource",
								description:
									(
										resource.Sections?.section?.[0]?.Content ||
										resource.MyHFDescription ||
										"No content available"
									)
										.replace(/<\/?[^>]+(>|$)/g, "")
										.substring(0, 150) + "...",
								sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
								imageUrl:
									resource.ImageUrl?.replace("Small", "Large") ||
									"https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
							}));

							// Update the store with these general resources
							setResources(formattedGeneralResources.slice(0, 3) as Resource[]);
							return;
						}
					}
				} catch (error) {
					console.error("Error fetching general resources:", error);
				}
			}

			// Update the store with the valid resources, limited to 3
			setResources(validResources.slice(0, 3) as Resource[]);
		} catch (error) {
			console.error("Error fetching recommended resources:", error);
			setError("Failed to load recommended resources");

			// Try to fetch general resources as a last resort
			try {
				const generalResponse = await fetch(`/api/myhealthfinder?keyword=general&limit=3`);
				if (generalResponse.ok) {
					const generalData = await generalResponse.json();
					if (generalData.Result?.Resources?.Resource) {
						const generalResources = Array.isArray(generalData.Result.Resources.Resource)
							? generalData.Result.Resources.Resource
							: [generalData.Result.Resources.Resource];

						const formattedGeneralResources = generalResources.map((resource: any) => ({
							id: resource.Id,
							title: resource.Title || "Health Resource",
							description:
								(
									resource.Sections?.section?.[0]?.Content ||
									resource.MyHFDescription ||
									"No content available"
								)
									.replace(/<\/?[^>]+(>|$)/g, "")
									.substring(0, 150) + "...",
							sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl,
							imageUrl:
								resource.ImageUrl?.replace("Small", "Large") ||
								"https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
						}));

						setResources(formattedGeneralResources.slice(0, 3) as Resource[]);
						setError(null); // Clear error since we recovered
					}
				}
			} catch (fallbackError) {
				console.error("Failed to fetch even general resources:", fallbackError);
			}
		}
	};

	// Fetch recommended resources on component mount or when user changes
	useEffect(() => {
		// Only fetch if we need a refresh
		if (needsRefresh()) {
			fetchRecommendedResources();
		}
	}, [user?.profile?.chronicConditions, needsRefresh]);

	// Handle saving/unsaving a resource
	const handleSaveToggle = async (resource: Resource) => {
		if (!isAuthenticated) {
			toast.error("Please log in to save resources", {
				id: "login-required",
				duration: 3000,
			});
			return;
		}

		const resourceId = resource.id;
		const isCurrentlySaved = savedResources.includes(resourceId);

		try {
			if (isCurrentlySaved) {
				await removeResource(resourceId);
				toast.success("Resource removed from saved");
			} else {
				await addResource(resourceId, resource);
				toast.success("Resource saved");
			}
		} catch (error) {
			console.error("Error toggling save status:", error);
			toast.error("Failed to update saved status");
		}
	};

	return (
		<section className="mb-16">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-semibold text-primary-heading">Recommended For You</h2>
			</div>

			{isLoading && (
				<div className="flex justify-center items-center py-8">
					<Loading />
				</div>
			)}

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
			)}

			{!isLoading && !error && recommendedResources.length === 0 && (
				<EmptyState
					title="No recommendations available"
					message="We couldn't find any resources to recommend at this time. Please check back later."
				/>
			)}

			{!isLoading && !error && recommendedResources.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{recommendedResources.map((resource) => (
						<ResourceCard
							key={resource.id}
							id={resource.id}
							title={resource.title}
							description={resource.description}
							imageUrl={resource.imageUrl}
							sourceUrl={resource.sourceUrl}
							isSaved={savedResources.includes(resource.id)}
							onSaveToggle={() => handleSaveToggle(resource)}
						/>
					))}
				</div>
			)}
		</section>
	);
}

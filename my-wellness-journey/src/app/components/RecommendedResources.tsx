"use client";

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import { useRecommendedResourcesStore } from "@/stores/recommendedResourcesStore";
import ResourceCard from "./ResourceCard";
import { Loading } from "./Loading";
import { EmptyState } from "./EmptyState";
import { Resource } from "@/types/resource";
import toast from "react-hot-toast";

// Types and Interfaces
interface GPTResponse {
	reply: string;
	keywords?: string[];
}

interface MyHealthFinderResource {
	Id: string;
	Title: string;
	MyHFDescription?: string;
	AccessibleVersion?: string;
	HealthfinderUrl?: string;
	ImageUrl?: string;
	Sections?: {
		section?: Array<{
			Content?: string;
		}>;
	};
}

interface MyHealthFinderResponse {
	Result?: {
		Resources?: {
			Resource: MyHealthFinderResource | MyHealthFinderResource[];
		};
	};
}

// Constants
const DEFAULT_TOPICS = ["exercise", "diet", "heart"] as const;
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528";
const RESOURCE_LIMIT = 3;

// Utility Functions
const parseGPTResponse = (reply: string): string[] => {
	try {
		const parsedReply = JSON.parse(reply);
		if (Array.isArray(parsedReply)) {
			return parsedReply.slice(0, RESOURCE_LIMIT);
		}
		if (parsedReply.keywords && Array.isArray(parsedReply.keywords)) {
			return parsedReply.keywords.slice(0, RESOURCE_LIMIT);
		}
	} catch (e) {
		const keywordMatch = reply.match(/\[(.*)\]/);
		if (keywordMatch && keywordMatch[1]) {
			return keywordMatch[1]
				.split(",")
				.map((k: string) => k.trim().replace(/"/g, ""))
				.slice(0, RESOURCE_LIMIT);
		}
	}
	return [];
};

const formatResourceDescription = (content: string): string => {
	return (
		(content || "No content available").replace(/<\/?[^>]+(>|$)/g, "").substring(0, 150) + "..."
	);
};

const formatResource = (resource: MyHealthFinderResource): Resource => ({
	id: resource.Id,
	title: resource.Title || "Health Resource",
	description: formatResourceDescription(
		resource.Sections?.section?.[0]?.Content || resource.MyHFDescription || ""
	),
	sourceUrl: resource.AccessibleVersion || resource.HealthfinderUrl || "",
	imageUrl: resource.ImageUrl?.replace("Small", "Large") || DEFAULT_IMAGE,
});

const fetchResourcesByKeyword = async (keyword: string): Promise<Resource | null> => {
	try {
		const response = await fetch(
			`/api/myhealthfinder?keyword=${encodeURIComponent(keyword)}&limit=1`
		);
		if (!response.ok) return null;

		const data: MyHealthFinderResponse = await response.json();
		if (!data.Result?.Resources?.Resource) return null;

		const resource = Array.isArray(data.Result.Resources.Resource)
			? data.Result.Resources.Resource[0]
			: data.Result.Resources.Resource;

		return resource ? formatResource(resource) : null;
	} catch (error) {
		console.error(`Error fetching resource for keyword ${keyword}:`, error);
		return null;
	}
};

const fetchGeneralResources = async (): Promise<Resource[]> => {
	try {
		const response = await fetch(`/api/myhealthfinder?keyword=general&limit=${RESOURCE_LIMIT}`);
		if (!response.ok) return [];

		const data: MyHealthFinderResponse = await response.json();
		if (!data.Result?.Resources?.Resource) return [];

		const resources = Array.isArray(data.Result.Resources.Resource)
			? data.Result.Resources.Resource
			: [data.Result.Resources.Resource];

		return resources.map(formatResource).slice(0, RESOURCE_LIMIT);
	} catch (error) {
		console.error("Error fetching general resources:", error);
		return [];
	}
};

// Components
interface SectionHeaderProps {
	title: string;
	subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => (
	<div className="text-center mb-12">
		<h2 className="text-3xl md:text-4xl font-bold text-primary-heading mb-4">{title}</h2>
		{subtitle && <p className="text-lg text-primary-subheading max-w-2xl mx-auto">{subtitle}</p>}
	</div>
);

interface ResourceListProps {
	resources: Resource[];
	onSaveToggle: (resource: Resource) => Promise<void>;
	savedResourceIds: string[];
}

const ResourceList: React.FC<ResourceListProps> = ({
	resources,
	onSaveToggle,
	savedResourceIds,
}) => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{resources.map((resource) => (
			<ResourceCard
				key={resource.id}
				id={resource.id}
				title={resource.title}
				description={resource.description}
				imageUrl={resource.imageUrl}
				sourceUrl={resource.sourceUrl}
				isSaved={savedResourceIds.includes(resource.id)}
				onSaveToggle={() => onSaveToggle(resource)}
			/>
		))}
	</div>
);

// Main Component
export default function RecommendedResources() {
	const { isAuthenticated, user } = useAuthStore();
	const { savedResources, addResource, removeResource } = useSavedStore();
	const {
		resources: recommendedResources,
		isLoading,
		error,
		needsRefresh,
		setResources,
		setLoading,
		setError,
	} = useRecommendedResourcesStore();

	const fetchRecommendedResources = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Get profile data if not already available
			let profileData = user?.profile;

			if (!profileData && user) {
				const profileResponse = await fetch("/api/user/profile", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

				if (profileResponse.ok) {
					const data = await profileResponse.json();
					profileData = data.profile;
				}
			}

			// Handle the case for new users with no conditions
			const conditions = profileData?.conditions?.map((c: { name: string }) => c.name) || [];

			const topicsToUse = conditions && conditions.length > 0 ? conditions : DEFAULT_TOPICS;

			// If user is not authenticated or doesn't have a profile yet, just show general resources
			if (!user || !profileData) {
				const generalResources = await fetchGeneralResources();
				setResources(generalResources);
				return;
			}

			const prompt = `Based on a patient with these health conditions or interests: ${topicsToUse.join(
				", "
			)}, recommend 3 specific resources from the MyHealthFinder API that would be most beneficial. Focus on practical, evidence-based resources that address their specific needs. Format the response as a JSON array of keywords to search for.`;

			const gptResponse = await fetch("/api/gpt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: topicsToUse.join(", "),
					originalPrompt: prompt,
				}),
			});

			// If GPT API fails, fall back to default topics and general resources
			if (!gptResponse.ok) {
				console.error("Failed to get GPT recommendations, using default topics");
				const resourcePromises = DEFAULT_TOPICS.slice(0, RESOURCE_LIMIT).map(
					fetchResourcesByKeyword
				);
				const resources = await Promise.all(resourcePromises);
				const validResources = resources.filter(Boolean) as Resource[];

				if (validResources.length === 0) {
					const generalResources = await fetchGeneralResources();
					setResources(generalResources);
				} else {
					setResources(validResources);
				}
				return;
			}

			const gptData: GPTResponse = await gptResponse.json();

			const keywords = gptData.reply ? parseGPTResponse(gptData.reply) : [];

			const finalKeywords = keywords.length > 0 ? keywords : topicsToUse.slice(0, RESOURCE_LIMIT);

			const resourcePromises = finalKeywords.map(fetchResourcesByKeyword);
			const resources = await Promise.all(resourcePromises);
			const validResources = resources.filter(Boolean) as Resource[];

			if (validResources.length === 0) {
				const generalResources = await fetchGeneralResources();
				setResources(generalResources);
				return;
			}

			setResources(validResources);
		} catch (error) {
			console.error("Error fetching recommended resources:", error);

			// Don't show error message, just fall back to general resources
			const generalResources = await fetchGeneralResources();
			if (generalResources.length > 0) {
				setResources(generalResources);
				setError(null);
			} else {
				setError("Failed to load recommended resources");
			}
		} finally {
			setLoading(false);
		}
	}, [user, setLoading, setError, setResources]); // Stable dependencies

	useEffect(() => {
		if (needsRefresh()) {
			fetchRecommendedResources();
		}
	}, [needsRefresh, user?.profile?.conditions, fetchRecommendedResources]);

	const handleSaveToggle = async (resource: Resource) => {
		try {
			const isSaved = savedResources.includes(resource.id);
			if (isSaved) {
				await removeResource(resource.id);
				toast.success("Resource removed from saved items");
			} else {
				await addResource(resource.id, resource);
				toast.success("Resource saved successfully");
			}
		} catch (error) {
			toast.error("Failed to update saved resources");
		}
	};

	if (isLoading) {
		return (
			<div className="w-full py-12">
				<Loading />
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full py-12">
				<EmptyState title="Error" message={error} icon={<div className="text-red-500">⚠️</div>} />
			</div>
		);
	}

	if (!recommendedResources || recommendedResources.length === 0) {
		return (
			<div className="w-full py-12">
				<EmptyState
					title="No recommendations available"
					message="We'll have some personalized recommendations for you soon!"
				/>
			</div>
		);
	}

	return (
		<section className="w-full py-12">
			<div className="max-w-[1200px] mx-auto px-4 md:px-8">
				<SectionHeader
					title="Recommended For You"
					subtitle="Personalized health resources based on your profile"
				/>
				<ResourceList
					resources={recommendedResources}
					onSaveToggle={handleSaveToggle}
					savedResourceIds={savedResources}
				/>
			</div>
		</section>
	);
}

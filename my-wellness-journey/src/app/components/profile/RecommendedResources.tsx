"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSavedStore } from "@/stores/savedStore";
import { useRecommendedResourcesStore } from "@/stores/recommendedResourcesStore";
import ResourceCard from "@/app/components/ResourceCard";
import { Loading } from "@/app/components/Loading";
import { EmptyState } from "@/app/components/EmptyState";
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
  return (content || "No content available")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .substring(0, 150) + "...";
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
    const response = await fetch(`/api/myhealthfinder?keyword=${encodeURIComponent(keyword)}&limit=1`);
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
interface ResourceListProps {
  resources: Resource[];
  onSaveToggle: (resource: Resource) => Promise<void>;
  savedResourceIds: string[];
}

const ResourceList: React.FC<ResourceListProps> = ({ resources, onSaveToggle, savedResourceIds }) => (
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

  const fetchRecommendedResources = async () => {
    setLoading(true);
    setError(null);

    try {
      const conditions = user?.profile?.chronicConditions?.map((c) => c.name);
      const topicsToUse = conditions && conditions.length > 0 ? conditions : DEFAULT_TOPICS;

      const prompt = `Based on a patient with these health conditions or interests: ${topicsToUse.join(
        ", "
      )}, recommend 3 specific resources from the MyHealthFinder API that would be most beneficial. Focus on practical, evidence-based resources that address their specific needs. Format the response as a JSON array of keywords to search for.`;

      const gptResponse = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!gptResponse.ok) throw new Error("Failed to get recommendations");

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
      setError("Failed to load recommended resources");

      const generalResources = await fetchGeneralResources();
      if (generalResources.length > 0) {
        setResources(generalResources);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (needsRefresh()) {
      fetchRecommendedResources();
    }
  }, [user?.profile?.chronicConditions]);

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

  if (isLoading) return <Loading />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!recommendedResources || recommendedResources.length === 0) {
    return <EmptyState title="No Resources" message="No recommended resources found" />;
  }

  return (
    <ResourceList
      resources={recommendedResources}
      onSaveToggle={handleSaveToggle}
      savedResourceIds={savedResources}
    />
  );
} 
"use client";

import { useState } from "react";
import ResourceCard from "../components/ResourceCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowRight } from "react-icons/fa";
import MedlinePlusSearch from "../components/MedlinePlusSearch";
import { MedlinePlusSearchResult } from "../../lib/api/medlineplus";

// Default health topics image URLs to use for MedlinePlus results
const healthTopicImages = [
	"https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
	"https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7",
	"https://images.unsplash.com/photo-1490645935967-10de6ba17061",
	"https://images.unsplash.com/photo-1576091160550-2173dba999ef",
	"https://images.unsplash.com/photo-1493836512294-502baa1986e2",
	"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
	"https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc",
	"https://images.unsplash.com/photo-1600443299762-7a743123645d",
	"https://images.unsplash.com/photo-1521453510357-5c7a77db7074",
	"https://images.unsplash.com/photo-1585435557343-3b092031a831",
];

const sampleResources = [
	{
		id: "1",
		title: "Understanding Mental Health",
		description:
			"A comprehensive guide to understanding and maintaining good mental health in today's fast-paced world.",
		category: "Mental Health",
		imageUrl: "https://images.unsplash.com/photo-1493836512294-502baa1986e2",
		isSaved: false,
	},
	{
		id: "2",
		title: "Balanced Nutrition Guide",
		description: "Learn how to create balanced, nutritious meals that fuel your body and mind.",
		category: "Nutrition",
		imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
		isSaved: false,
	},
	{
		id: "3",
		title: "Mindful Meditation Basics",
		description:
			"Discover the fundamentals of meditation and how to incorporate mindfulness into your daily routine.",
		category: "Mindfulness",
		imageUrl: "https://images.unsplash.com/photo-1602192509154-0b900ee1f851",
		isSaved: false,
	},
	{
		id: "4",
		title: "Better Sleep Habits",
		description:
			"Expert tips and strategies for improving your sleep quality and establishing a healthy sleep routine.",
		category: "Sleep",
		imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55",
		isSaved: false,
	},
	{
		id: "5",
		title: "Home Workout Essentials",
		description:
			"Effective exercises you can do at home with minimal equipment to stay fit and healthy.",
		category: "Exercise",
		imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e",
		isSaved: false,
	},
	{
		id: "6",
		title: "Stress Management Techniques",
		description:
			"Practical strategies to manage stress and maintain emotional balance in challenging times.",
		category: "Mental Health",
		imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
		isSaved: false,
	},
	{
		id: "7",
		title: "Healthy Meal Prep Guide",
		description: "Time-saving tips and recipes for preparing nutritious meals throughout the week.",
		category: "Nutrition",
		imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554",
		isSaved: false,
	},
	{
		id: "8",
		title: "Understanding Physical Wellness",
		description:
			"A holistic approach to maintaining your physical health through exercise, nutrition, and rest.",
		category: "Physical Health",
		imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
		isSaved: false,
	},
	{
		id: "9",
		title: "Mindful Eating Practices",
		description:
			"Learn how to develop a healthier relationship with food through mindful eating techniques.",
		category: "Mindfulness",
		imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
		isSaved: false,
	},
	{
		id: "10",
		title: "Building Healthy Habits",
		description:
			"Step-by-step guide to creating and maintaining healthy habits that last a lifetime.",
		category: "Physical Health",
		imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5",
		isSaved: false,
	},
];

export default function ResourcesPage() {
	const [savedResources, setSavedResources] = useState<Set<string>>(new Set());
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [medlineResults, setMedlineResults] = useState<MedlinePlusSearchResult[]>([]);
	const [showingSearchResults, setShowingSearchResults] = useState(false);

	const handleSaveToggle = (resourceId: string) => {
		setSavedResources((prev) => {
			const newSaved = new Set(prev);
			if (newSaved.has(resourceId)) {
				newSaved.delete(resourceId);
			} else {
				newSaved.add(resourceId);
			}
			return newSaved;
		});
	};

	const handleMedlineResultSelect = (result: MedlinePlusSearchResult) => {
		// Display the selected MedlinePlus result
		setMedlineResults([result]);
		setShowingSearchResults(true);
	};

	// Convert MedlinePlus results to ResourceCard format
	const medlineResourcesToShow = medlineResults.map((result, index) => {
		// Generate a unique ID for each MedlinePlus result
		const id = `medline-${result.url.replace(/[^a-zA-Z0-9]/g, "-")}`;

		// Get a category from the result's categories or use "Health"
		const category =
			result.categories && result.categories.length > 0 ? result.categories[0] : "Health";

		// Get an image from our array of health topic images using modulo for rotation
		const imageUrl = healthTopicImages[index % healthTopicImages.length];

		return {
			id,
			title: result.title,
			description: result.snippet,
			category,
			imageUrl,
			url: result.url,
			isSaved: savedResources.has(id),
			isMedlinePlus: true,
		};
	});

	return (
		<main className="min-h-screen w-full">
			<Header />

			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* My Saved Resources Section */}
				{isAuthenticated && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Resources</h2>
							<button className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2">
								View All <FaArrowRight className="w-4 h-4" color="#3A8C96" />
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{sampleResources
								.filter((resource) => savedResources.has(resource.id))
								.map((resource) => (
									<ResourceCard
										key={resource.id}
										{...resource}
										isSaved={true}
										onSaveToggle={() => handleSaveToggle(resource.id)}
									/>
								))}
						</div>
					</section>
				)}

				{/* All Resources Section */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Resources</h2>
					</div>

					{/* MedlinePlus Search */}
					<div className="mb-10">
						<h3 className="text-lg font-semibold mb-4">Search MedlinePlus Health Information</h3>
						<MedlinePlusSearch
							onResultSelect={handleMedlineResultSelect}
							onResultsFound={(results) => {
								setMedlineResults(results);
								setShowingSearchResults(results.length > 0);
							}}
							maxResults={10}
						/>
					</div>

					{/* Display MedlinePlus Results */}
					{showingSearchResults && medlineResourcesToShow.length > 0 && (
						<div className="mb-8">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{medlineResourcesToShow.map((resource) => (
									<ResourceCard
										key={resource.id}
										{...resource}
										isSaved={savedResources.has(resource.id)}
										onSaveToggle={() => handleSaveToggle(resource.id)}
									/>
								))}
							</div>
						</div>
					)}

					{/* Show curated resources when not showing search results */}
					{!showingSearchResults && (
						<>
							<h3 className="text-lg font-semibold mb-4 mt-10">Recent Searches</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{sampleResources.map((resource) => (
									<ResourceCard
										key={resource.id}
										{...resource}
										isSaved={savedResources.has(resource.id)}
										onSaveToggle={() => handleSaveToggle(resource.id)}
									/>
								))}
							</div>
						</>
					)}
				</section>
			</div>

			<Footer />
		</main>
	);
}

"use client";

import { useState } from "react";
import ResourceCard from "../components/ResourceCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaArrowRight, FaSearch } from "react-icons/fa";

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
	const [searchQuery, setSearchQuery] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);

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

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Searching for:", searchQuery);
	};

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

					{/* Search Bar */}
					<form onSubmit={handleSearch} className="relative mb-8">
						<div className="flex gap-2">
							<div className="relative flex-1">
								<input
									type="text"
									placeholder="Search by condition, topic, or keyword"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200 pl-10"
								/>
								<FaSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-subheading" />
							</div>
							<button
								type="submit"
								className="px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
							>
								Search
							</button>
						</div>
					</form>

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
				</section>
			</div>

			<Footer />
		</main>
	);
}

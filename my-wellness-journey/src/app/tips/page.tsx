"use client";

import { useState } from "react";
import TipCard from "../components/TipCard";
import { FaSearch, FaArrowRight } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";

const sampleTips = [
	{
		id: "1",
		title: "Stay Hydrated Throughout the Day",
		content:
			"Drink at least 8 glasses of water daily. Set reminders on your phone to help you maintain this habit.",
		category: "Physical Health",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "2",
		title: "Practice the 5-4-3-2-1 Grounding Technique",
		content:
			"When feeling anxious, identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
		category: "Mental Health",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "3",
		title: "Morning Stretching Routine",
		content:
			"Start your day with 5-10 minutes of gentle stretching. Focus on your neck, shoulders, and back to improve flexibility and reduce stiffness.",
		category: "Exercise",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "4",
		title: "Mindful Eating Practice",
		content:
			"Take time to eat without distractions. Notice the colors, smells, textures, and flavors of your food. This helps with digestion and portion control.",
		category: "Nutrition",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "5",
		title: "Create a Relaxing Bedtime Routine",
		content:
			"Establish a consistent sleep schedule. Dim the lights, avoid screens, and try relaxing activities like reading or gentle stretching 30 minutes before bed.",
		category: "Sleep",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "6",
		title: "Practice Deep Breathing",
		content:
			"Try the 4-7-8 breathing technique: Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Repeat 4 times to reduce stress.",
		category: "Mental Health",
		source: "Mayo Clinic",
		readTime: "2 min read",
		isSaved: false,
	},
	{
		id: "7",
		title: "Incorporate More Plant-Based Foods",
		content:
			"Add one extra serving of vegetables to each meal. Try meatless Mondays to explore new plant-based protein sources.",
		category: "Nutrition",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "8",
		title: "Take Regular Movement Breaks",
		content:
			"For every hour of sitting, take a 2-3 minute movement break. Stand up, stretch, or walk around to improve circulation.",
		category: "Exercise",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "9",
		title: "Practice Gratitude Daily",
		content:
			"Write down three things you're grateful for each day. This simple practice can improve mental well-being and reduce stress.",
		category: "Mental Health",
		source: "Mayo Clinic",
		isSaved: false,
	},
	{
		id: "10",
		title: "Smart Snacking Strategies",
		content:
			"Keep healthy snacks like nuts, fruits, or yogurt readily available. Plan your snacks to avoid impulsive eating.",
		category: "Nutrition",
		source: "Mayo Clinic",
		isSaved: false,
	},
];

export default function TipsPage() {
	const [isAuthenticated] = useState(false);
	const [savedTips, setSavedTips] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Searching for:", searchQuery);
	};

	const handleSaveToggle = (tipId: string) => {
		setSavedTips((prev) => {
			const newSaved = new Set(prev);
			if (newSaved.has(tipId)) {
				newSaved.delete(tipId);
			} else {
				newSaved.add(tipId);
			}
			return newSaved;
		});
	};

	const categories = ["All", "Mental Health", "Physical Health", "Nutrition", "Exercise", "Sleep"];

	return (
		<main className="min-h-screen w-full">
			<Header />
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* My Saved Tips Section */}
				{isAuthenticated && (
					<section className="mb-16">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-semibold text-primary-heading">My Saved Tips</h2>
							<button className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2">
								View All <FaArrowRight className="w-4 h-4" />
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{sampleTips
								.filter((tip) => savedTips.has(tip.id))
								.map((tip) => (
									<TipCard
										key={tip.id}
										{...tip}
										isSaved={true}
										onSaveToggle={() => handleSaveToggle(tip.id)}
									/>
								))}
						</div>
					</section>
				)}

				{/* All Tips Section */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Wellness Tips</h2>
					</div>

					{/* Search and Filter Section */}
					<div className="space-y-6 mb-8">
						{/* Search Bar */}
						<form onSubmit={handleSearch} className="relative">
							<div className="flex gap-2">
								<div className="relative flex-1">
									<input
										type="text"
										placeholder="Search tips by topic or keyword"
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

						{/* Category Filter Chips */}
						<div className="flex flex-wrap gap-2">
							{categories.map((category) => (
								<button
									key={category}
									onClick={() => setSelectedCategory(category === "All" ? null : category)}
									className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                            ${
																							selectedCategory === category ||
																							(category === "All" && !selectedCategory)
																								? "bg-primary-accent text-white"
																								: "bg-gray-100 text-primary-subheading hover:bg-gray-200"
																						}`}
								>
									{category}
								</button>
							))}
						</div>
					</div>

					{/* Tips Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{sampleTips.map((tip) => (
							<TipCard
								key={tip.id}
								{...tip}
								isSaved={savedTips.has(tip.id)}
								onSaveToggle={() => handleSaveToggle(tip.id)}
							/>
						))}
					</div>
				</section>
			</div>
			<Footer />
		</main>
	);
}

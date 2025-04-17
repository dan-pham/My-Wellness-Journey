"use client";

import { useState } from "react";
import ResourceCard from "../components/ResourceCard";
import { FaArrowRight, FaBookmark, FaRegBookmark } from "react-icons/fa";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TipCard from "../components/TipCard";

export default function DashboardPage() {
	// Temporary state for bookmark functionality
	const [isDailyTipSaved, setIsDailyTipSaved] = useState(false);

	// Sample daily tip
	const dailyTip = {
		title: "Morning Stretching Routine",
		content:
			"Start your day with 5-10 minutes of gentle stretching. Focus on your neck, shoulders, and back to improve flexibility and reduce stiffness.",
		source: "Mayo Clinic",
	};

	// Sample recommended resources
	const recommendedResources = [
		{
			id: "1",
			title: "Understanding Mental Health",
			description:
				"A comprehensive guide to understanding and maintaining good mental health in today's fast-paced world.",
			category: "Mental Health",
			imageUrl: "https://images.unsplash.com/photo-1493836512294-502baa1986e2",
		},
		{
			id: "2",
			title: "Balanced Nutrition Guide",
			description: "Learn how to create balanced, nutritious meals that fuel your body and mind.",
			category: "Nutrition",
			imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
		},
		{
			id: "3",
			title: "Better Sleep Habits",
			description:
				"Expert tips and strategies for improving your sleep quality and establishing a healthy sleep routine.",
			category: "Sleep",
			imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55",
		},
	];

	// Sample recent activity
	const recentActivity = [
		{
			id: "1",
			title: "Understanding Mental Health",
			description:
				"A comprehensive guide to understanding and maintaining good mental health in today's fast-paced world.",
			category: "Mental Health",
			imageUrl: "https://images.unsplash.com/photo-1493836512294-502baa1986e2",
		},
		{
			id: "2",
			title: "Balanced Nutrition Guide",
			description: "Learn how to create balanced, nutritious meals that fuel your body and mind.",
			category: "Nutrition",
			imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
		},
		{
			id: "3",
			title: "Better Sleep Habits",
			description:
				"Expert tips and strategies for improving your sleep quality and establishing a healthy sleep routine.",
			category: "Sleep",
			imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55",
		},
	];

	return (
		<main className="min-h-screen w-full">
			<Header />
			<div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12">
				{/* Greeting Section */}
				<h1 className="text-3xl md:text-4xl font-bold text-primary-heading mb-4">
					Good morning, John
				</h1>
				<p className="text-primary-subheading mb-8">Here's your wellness tip for today:</p>

				{/* Daily Tip Card */}
				<div className="mb-16 max-w-2xl mx-auto">
					<TipCard
						id="daily-tip"
						title={dailyTip.title}
						content={dailyTip.content}
						category="Daily Tip"
						source={dailyTip.source}
						isSaved={isDailyTipSaved}
						onSaveToggle={() => setIsDailyTipSaved(!isDailyTipSaved)}
						showFullContent={true}
						onDismiss={() => console.log("Tip dismissed")}
					/>
				</div>

				{/* Resources Based on Health Profile */}
				<section className="mb-16">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">
							Resources Based on Your Health Profile
						</h2>
						<Link
							href="/resources"
							className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
						>
							View All <FaArrowRight className="w-4 h-4" />
						</Link>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{recommendedResources.map((resource) => (
							<ResourceCard key={resource.id} {...resource} />
						))}
					</div>
				</section>

				{/* Recent Activity */}
				<section>
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-semibold text-primary-heading">Your Recent Activity</h2>
						<Link
							href="/activity"
							className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
						>
							View All <FaArrowRight className="w-4 h-4" />
						</Link>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{recentActivity.map((resource) => (
							<ResourceCard key={resource.id} {...resource} />
						))}
					</div>
				</section>
			</div>
			<Footer />
		</main>
	);
}

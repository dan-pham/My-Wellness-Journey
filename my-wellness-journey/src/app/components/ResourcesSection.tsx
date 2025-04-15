import React from "react";
import ResourceCard from "../components/ResourceCard";

const ResourcesSection = () => {
	const resources = [
		{
			id: 1,
			category: "Category",
			imageUrl:
				"https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			title: "Title",
			description: "Description description description description...",
		},
		{
			id: 2,
			category: "Category",
			imageUrl:
				"https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			title: "Title",
			description: "Description description description description...",
		},
		{
			id: 3,
			category: "Category",
			imageUrl:
				"https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			title: "Title",
			description: "Description description description description...",
		},
	];

	return (
		<section id="resources" className="w-full bg-white mb-16">
			<div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16">
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-primary-heading mb-4">
						Featured Wellness Resources
					</h2>
					<p className="text-lg text-primary-subheading max-w-2xl mx-auto">
						Curated content to support your health journey
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{resources.slice(0, 3).map((res) => (
						<div
							key={res.id}
							className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
						>
							<ResourceCard
								category={res.category}
								imageUrl={res.imageUrl}
								title={res.title}
								description={res.description}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ResourcesSection;

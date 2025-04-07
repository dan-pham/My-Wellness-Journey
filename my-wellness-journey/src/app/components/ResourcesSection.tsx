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
		{
			id: 4,
			category: "Category",
			imageUrl:
				"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			title: "Title",
			description: "Description description description description...",
		},
	];

	return (
		<section id="resources" className="flex flex-col items-center py-5 bg-white">
			<h2 className="text-3xl font-bold text-primary-heading">Featured Wellness Resources</h2>
			<p className="mt-3.5 text-lg text-center text-primary-subheading">
				Curated content to support your health journey
			</p>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{resources.map((res) => (
					<ResourceCard
						key={res.id}
						category={res.category}
						imageUrl={res.imageUrl}
						title={res.title}
						description={res.description}
					/>
				))}
			</div>
		</section>
	);
};

export default ResourcesSection;

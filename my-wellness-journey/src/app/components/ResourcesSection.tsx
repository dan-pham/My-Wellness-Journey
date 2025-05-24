import React from "react";
import ResourceCard from "../components/ResourceCard";
import { MyHealthFinder } from "../../lib/api/myhealthfinder";

// Types and Interfaces
interface ResourcesSectionProps {
	resources: MyHealthFinder[];
}

interface SectionHeaderProps {
	title: string;
	subtitle: string;
}

interface ResourceGridProps {
	resources: MyHealthFinder[];
	maxDisplay?: number;
}

// Components
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => (
	<div className="text-center mb-12">
		<h2 className="text-3xl md:text-4xl font-bold text-primary-heading mb-4">{title}</h2>
		<p className="text-lg text-primary-subheading max-w-2xl mx-auto">{subtitle}</p>
	</div>
);

const ResourceGrid: React.FC<ResourceGridProps> = ({ resources, maxDisplay = 3 }) => (
	<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
		{resources.slice(0, maxDisplay).map((res) => (
			<div
				key={res.id}
				className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
			>
				<ResourceCard
					id={res.id}
					imageUrl={res.imageUrl || ""}
					title={res.title}
					description={res.content.slice(0, 120) + (res.content.length > 120 ? "..." : "")}
					sourceUrl={res.sourceUrl || "#"}
				/>
			</div>
		))}
	</div>
);

// Main Component
const ResourcesSection: React.FC<ResourcesSectionProps> = ({ resources }) => {
	return (
		<section id="resources" className="w-full bg-white mb-16">
			<div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16">
				<SectionHeader
					title="Featured Wellness Resources"
					subtitle="Curated content to support your health journey"
				/>
				<ResourceGrid resources={resources} />
			</div>
		</section>
	);
};

export default ResourcesSection;

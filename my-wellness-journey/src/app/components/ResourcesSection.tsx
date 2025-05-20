import React from "react";
import ResourceCard from "../components/ResourceCard";
import { MyHealthFinder } from "../../lib/api/myhealthfinder";

interface ResourcesSectionProps {
	resources: MyHealthFinder[];
}

const ResourcesSection = ({ resources }: ResourcesSectionProps) => {
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
								id={res.id}
								imageUrl={res.imageUrl || ""}
								title={res.title}
								description={res.content.slice(0, 120) + (res.content.length > 120 ? "..." : "")}
								sourceUrl={res.sourceUrl || "#"}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ResourcesSection;

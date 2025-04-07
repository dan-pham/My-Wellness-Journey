import React from "react";
import { FaBookReader, FaChartLine } from "react-icons/fa";

const FeaturesSection = () => {
	const features = [
		{
			icon: <FaBookReader className="h-8 w-8 text-primary-accent" />,
			title: "Personalized Education",
			description: "Resources tailored to your specific chronic conditions and needs",
		},
		{
			icon: <FaChartLine className="h-8 w-8 text-primary-accent" />,
			title: "Practical Wellness Tools",
			description: "Track progress and access reliable health information in one place",
		},
	];

	return (
		<section className="py-16 bg-white">
			<div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 text-center">
				{features.map((feature, idx) => (
					<div key={idx} className="flex flex-col items-center space-y-4">
						{feature.icon}
						<h3 className="text-xl font-semibold text-primary-heading">{feature.title}</h3>
						<p className="text-primary-subheading">{feature.description}</p>
					</div>
				))}
			</div>
		</section>
	);
};

export default FeaturesSection;

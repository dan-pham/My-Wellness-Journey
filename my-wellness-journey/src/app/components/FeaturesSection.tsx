import React from "react";
import { FaBookReader, FaChartLine } from "react-icons/fa";

const FeaturesSection = () => {
	const features = [
		{
			icon: <FaBookReader className="h-8 w-8" color="#2B4C7E" />,
			title: "Personalized Education",
			description: "Resources tailored to your specific chronic conditions and needs",
		},
		{
			icon: <FaChartLine className="h-8 w-8" color="#2B4C7E" />,
			title: "Practical Wellness Tools",
			description: "Track progress and access reliable health information in one place",
		},
	];

	return (
		<section className="w-full bg-primary-heading mb-16">
			<div className="mx-auto max-w-[1200px] px-4 md:px-8 py-20">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					{features.map((feature, idx) => (
						<div
							key={idx}
							className="flex flex-col items-center text-center p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
						>
							<div className="mb-6 p-4 bg-primary-accent/10 rounded-full">{feature.icon}</div>
							<h3 className="text-2xl font-semibold text-primary-heading mb-4">{feature.title}</h3>
							<p className="text-lg text-primary-subheading">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesSection;

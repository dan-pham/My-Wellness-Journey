import React from "react";
import Image from "next/image";

interface ResourceCardProps {
	category: string;
	imageUrl: string;
	title: string;
	description: string;
}

const ResourceCard = ({ category, imageUrl, title, description }: ResourceCardProps) => {
	return (
		<div className="bg-white shadow rounded-lg overflow-hidden">
			<Image src={imageUrl} alt={title} width={400} height={250} className="w-full object-cover" />
			<div className="p-4 text-left">
				<span className="text-sm text-primary-accent font-medium">{category}</span>
				<h3 className="text-lg text-primary-heading font-semibold mt-1">{title}</h3>
				<p className="text-sm text-primary-subheading mb-2">{description}</p>
				<a href="#" className="text-sm text-primary-accent font-medium inline-flex items-center">
					Read More <span className="ml-1">→</span>
				</a>
			</div>
		</div>
	);
};

export default ResourceCard;

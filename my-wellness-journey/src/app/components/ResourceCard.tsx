import React from "react";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

interface ResourceCardProps {
	category: string;
	imageUrl: string;
	title: string;
	description: string;
}

const ResourceCard = ({ category, imageUrl, title, description }: ResourceCardProps) => {
	return (
		<div className="overflow-hidden rounded-xl h-full flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
			<div className="relative w-full aspect-video">
				<Image src={imageUrl} alt={title} fill className="object-cover" />
				<div className="absolute top-4 left-4">
					<span className="px-4 py-2 text-sm font-semibold text-white bg-primary-heading/90 rounded-full backdrop-blur-sm">
						{category}
					</span>
				</div>
			</div>

			<div className="p-6 flex flex-col flex-grow">
				<h3 className="text-xl font-semibold text-primary-heading mb-3 line-clamp-2">{title}</h3>
				<p className="text-primary-subheading mb-4 flex-grow line-clamp-3">{description}</p>

				<div className="mt-auto flex justify-end">
					<button className="text-primary-accent px-4 py-2 rounded-full hover:bg-primary-accent/10 font-semibold transition-colors duration-200 flex items-center gap-2">
						Read More <FaArrowRight className="w-4 h-4" color="#3A8C96" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ResourceCard;

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { Resource } from "@/types/resource";
import ResourceCard from "@/app/components/ResourceCard";
import { Error } from "@/app/components/Error";

interface SavedResourcesSectionProps {
	savedResources: Resource[];
	savedError: string | null;
	onSaveToggle: (resource: Resource) => void;
}

export const SavedResourcesSection = ({
	savedResources,
	savedError,
	onSaveToggle,
}: SavedResourcesSectionProps) => {
	if (savedResources.length === 0) return null;

	return (
		<section className="mb-16">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-semibold text-primary-heading">My Saved Resources</h2>
				{savedResources.length > 3 && (
					<Link
						href="/resources/saved"
						className="text-primary-accent hover:text-primary-accent/80 transition-colors duration-200 flex items-center gap-2"
					>
						View All <FaArrowRight className="w-4 h-4" color="#3A8C96" />
					</Link>
				)}
			</div>

			{savedError && <Error message={savedError} />}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{savedResources
					.slice(0, 3) // Show only first 3 saved resources
					.map((resource) => (
						<ResourceCard
							key={resource.id}
							{...resource}
							isSaved={true}
							onSaveToggle={() => onSaveToggle(resource)}
						/>
					))}
			</div>
		</section>
	);
};

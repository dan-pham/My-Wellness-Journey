import { Resource } from "@/types/resource";
import ResourceCard from "@/app/components/ResourceCard";
import { Loading } from "@/app/components/Loading";
import { Error } from "@/app/components/Error";
import { EmptyState } from "@/app/components/EmptyState";

interface ResourcesSectionProps {
	resources: Resource[];
	isLoading: boolean;
	error: string | null;
	hasSearched: boolean;
	savedResourceIds: string[];
	onSaveToggle: (resource: Resource) => void;
	onSearch?: (query: string) => void;
}

export const ResourcesSection = ({
	resources,
	isLoading,
	error,
	hasSearched,
	savedResourceIds,
	onSaveToggle,
	onSearch,
}: ResourcesSectionProps) => {
	const quickSearchTopics = [
		"diabetes",
		"heart health",
		"nutrition",
		"exercise",
		"sleep",
		"stress management",
	];

	const handleTopicClick = (topic: string) => {
		if (onSearch) {
			onSearch(topic);
		}
	};

	return (
		<section>
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-semibold text-primary-heading">Resources</h2>
			</div>

			{isLoading && <Loading />}
			{error && <Error message={error} />}
			{!hasSearched && !isLoading && !error && (
				<div
					className="text-center py-16 border border-gray-100 rounded-lg bg-white shadow-sm"
					data-testid="empty-state"
				>
					<div className="max-w-md mx-auto">
						<h3 className="text-xl font-semibold text-primary-heading mb-3">
							Discover Health Resources
						</h3>
						<p className="text-primary-subheading mb-6">
							Search for health topics above to find trusted resources that can help you on your
							wellness journey.
						</p>
						<div className="space-y-4" data-testid="quick-search-section">
							<p className="text-sm text-primary-subheading">Try searching for:</p>
							<div className="flex flex-wrap justify-center gap-2">
								{quickSearchTopics.map((topic) => (
									<button
										key={topic}
										onClick={() => handleTopicClick(topic)}
										className="px-4 py-2 bg-primary-accent/10 text-primary-accent rounded-full text-sm hover:bg-primary-accent/20 transition-colors duration-200"
										data-testid={`topic-${topic.replace(/\s+/g, "-")}`}
									>
										{topic}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
			{hasSearched && !isLoading && !error && resources.length === 0 && (
				<EmptyState title="No resources found." message="Try a different search." />
			)}
			{resources.length > 0 && !isLoading && !error && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{resources.map((resource) => (
						<ResourceCard
							key={resource.id}
							{...resource}
							isSaved={savedResourceIds.includes(resource.id)}
							onSaveToggle={() => onSaveToggle(resource)}
						/>
					))}
				</div>
			)}
		</section>
	);
};

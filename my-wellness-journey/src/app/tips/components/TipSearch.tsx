import { FaSearch } from "react-icons/fa";

interface TipSearchProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	onSearch: (e: React.FormEvent) => void;
	placeholder?: string;
}

export const TipSearch: React.FC<TipSearchProps> = ({
	searchQuery,
	setSearchQuery,
	onSearch,
	placeholder = "Search tips by topic or keyword",
}) => {
	return (
		<div className="mb-12">
			<form
				onSubmit={onSearch}
				className="flex flex-col md:flex-row gap-4"
				data-testid="tip-search-form"
				aria-label="Search tips"
			>
				<div className="flex-1 relative">
					<input
						type="text"
						placeholder={placeholder}
						className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
						<FaSearch />
					</div>
				</div>
				<button
					type="submit"
					className="px-6 py-3 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors flex items-center justify-center gap-2"
					data-testid="tip-search-button"
				>
					Search <FaSearch className="w-4 h-4" />
				</button>
			</form>
		</div>
	);
};

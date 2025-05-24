import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onSearch: (e: React.FormEvent) => void;
	isLoading: boolean;
	placeholder?: string;
}

export const SearchBar = ({
	searchQuery,
	onSearchChange,
	onSearch,
	isLoading,
	placeholder = "Search health resources...",
}: SearchBarProps) => {
	return (
		<form onSubmit={onSearch} className="relative mb-8">
			<div className="flex gap-2">
				<div className="relative flex-1">
					<input
						type="text"
						placeholder={placeholder}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full px-4 py-2 text-primary-heading bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all duration-200 pl-10"
					/>
					<FaSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-subheading" />
				</div>
				<button
					type="submit"
					disabled={isLoading}
					className="px-6 py-2 bg-primary-accent text-white rounded-full hover:bg-primary-accent/90 transition-colors duration-200 font-medium"
				>
					{isLoading ? "Searching..." : "Search"}
				</button>
			</div>
		</form>
	);
};

import React, { useState } from "react";
import { MedlinePlusSearchResult } from "../../lib/api/medlineplus";
import { FaSearch } from "react-icons/fa";

interface MedlinePlusSearchProps {
	onResultSelect?: (result: MedlinePlusSearchResult) => void;
	onResultsFound?: (results: MedlinePlusSearchResult[]) => void;
	maxResults?: number;
}

const MedlinePlusSearch: React.FC<MedlinePlusSearchProps> = ({
	onResultSelect,
	onResultsFound,
	maxResults = 10,
}) => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<MedlinePlusSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!query.trim()) {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/medlineplus?query=${encodeURIComponent(query)}&maxResults=${maxResults}`
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			const searchResults = data.results || [];
			setResults(searchResults);

			// Notify parent component of results
			if (onResultsFound) {
				onResultsFound(searchResults);
			}

			if (searchResults.length === 0) {
				setError("No results found. Try different search terms.");
			}
		} catch (err) {
			setError("Failed to search MedlinePlus. Please try again later.");
			console.error("MedlinePlus search error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="medlineplus-search">
			<form onSubmit={handleSearch} className="relative">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<input
							type="text"
							placeholder="Search by condition, topic, or keyword"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
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

			{error && <div className="error-message">{error}</div>}
		</div>
	);
};

export default MedlinePlusSearch;

import React, { useState } from "react";
import { MedlinePlusSearchResult } from "../../lib/api/medlineplus";

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

	const handleResultClick = (result: MedlinePlusSearchResult) => {
		if (onResultSelect) {
			onResultSelect(result);
		}
	};

	return (
		<div className="medlineplus-search">
			<form onSubmit={handleSearch}>
				<div className="search-controls">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search health topics..."
						className="search-input"
					/>

					<button
						type="submit"
						disabled={isLoading}
						className="px-4 py-2 bg-primary-accent text-white rounded hover:bg-primary-accent/90"
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

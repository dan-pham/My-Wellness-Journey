/**
 * Utility functions for string manipulation
 */

/**
 * Calculate Levenshtein distance between two strings for spellchecking
 */
export function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	// Initialize matrix
	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	// Fill matrix
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1 // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Format date from ISO to YYYY-MM-DD
 */
export function formatDate(date: string | Date | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	return d.toISOString().split("T")[0];
} 
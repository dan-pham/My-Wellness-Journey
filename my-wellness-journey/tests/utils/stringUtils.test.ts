import { levenshteinDistance, formatDate } from "@/utils/stringUtils";

describe("String Utilities", () => {
	describe("levenshteinDistance", () => {
		it("should return 0 for identical strings", () => {
			expect(levenshteinDistance("hello", "hello")).toBe(0);
			expect(levenshteinDistance("", "")).toBe(0);
			expect(levenshteinDistance("12345", "12345")).toBe(0);
		});

		it("should return the length of first string when second string is empty", () => {
			expect(levenshteinDistance("hello", "")).toBe(5);
			expect(levenshteinDistance("a", "")).toBe(1);
		});

		it("should return the length of second string when first string is empty", () => {
			expect(levenshteinDistance("", "hello")).toBe(5);
			expect(levenshteinDistance("", "a")).toBe(1);
		});

		it("should calculate distance correctly for substitutions", () => {
			// One character different
			expect(levenshteinDistance("hello", "hallo")).toBe(1);
			// Multiple characters different
			expect(levenshteinDistance("book", "back")).toBe(2);
		});

		it("should calculate distance correctly for insertions", () => {
			expect(levenshteinDistance("hello", "helloo")).toBe(1);
			expect(levenshteinDistance("cat", "cats")).toBe(1);
		});

		it("should calculate distance correctly for deletions", () => {
			expect(levenshteinDistance("hello", "hell")).toBe(1);
			expect(levenshteinDistance("cats", "cat")).toBe(1);
		});

		it("should handle complex edit distances correctly", () => {
			expect(levenshteinDistance("kitten", "sitting")).toBe(3);
			expect(levenshteinDistance("saturday", "sunday")).toBe(3);
			expect(levenshteinDistance("intention", "execution")).toBe(5);
		});

		it("should handle case sensitivity", () => {
			expect(levenshteinDistance("Hello", "hello")).toBe(1);
			expect(levenshteinDistance("WORLD", "world")).toBe(5);
		});
	});

	describe("formatDate", () => {
		it("should format date string properly", () => {
			expect(formatDate("2023-05-15T12:00:00Z")).toBe("2023-05-15");
			expect(formatDate("2023-12-31T23:59:59Z")).toBe("2023-12-31");
		});

		it("should format Date object properly", () => {
			expect(formatDate(new Date("2023-05-15T12:00:00Z"))).toBe("2023-05-15");
			expect(formatDate(new Date("2023-12-31T23:59:59Z"))).toBe("2023-12-31");
		});

		it("should handle date with timezone offset", () => {
			const date = new Date("2023-05-15T12:00:00+02:00");
			expect(formatDate(date)).toBe(date.toISOString().split("T")[0]);
		});

		it("should return empty string for undefined input", () => {
			expect(formatDate(undefined)).toBe("");
		});
	});
});

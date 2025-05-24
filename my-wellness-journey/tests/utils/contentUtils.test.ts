import { stripHtmlForPreview, processHtmlForDetail } from "@/utils/contentUtils";

describe("Content Utilities", () => {
	describe("stripHtmlForPreview", () => {
		it("should return empty string for empty input", () => {
			expect(stripHtmlForPreview("")).toBe("");
			expect(stripHtmlForPreview(null as unknown as string)).toBe("");
			expect(stripHtmlForPreview(undefined as unknown as string)).toBe("");
		});

		it("should strip HTML tags", () => {
			expect(stripHtmlForPreview("<p>Hello world</p>")).toBe("Hello world");
			expect(stripHtmlForPreview("<div><h1>Title</h1><p>Content</p></div>")).toBe("Title Content");
		});

		it("should replace non-breaking spaces", () => {
			expect(stripHtmlForPreview("Hello&nbsp;world")).toBe("Hello world");
			expect(stripHtmlForPreview("<p>Hello&nbsp;&nbsp;world</p>")).toBe("Hello world");
		});

		it("should normalize whitespace", () => {
			expect(stripHtmlForPreview("<p>Hello  \n  world</p>")).toBe("Hello world");
			expect(stripHtmlForPreview("  Multiple    spaces  ")).toBe("Multiple spaces");
		});

		it("should trim whitespace", () => {
			expect(stripHtmlForPreview("  <p>Hello</p>  ")).toBe("Hello");
			expect(stripHtmlForPreview("\n<p>Test</p>\t")).toBe("Test");
		});

		it("should limit content to 200 characters with ellipsis for longer content", () => {
			const longText = "a".repeat(250);
			const result = stripHtmlForPreview(longText);
			expect(result.length).toBe(203); // 200 chars + '...'
			expect(result.endsWith("...")).toBe(true);
		});

		it("should not add ellipsis for content under 200 characters", () => {
			const shortText = "a".repeat(150);
			const result = stripHtmlForPreview(shortText);
			expect(result.length).toBe(150);
			expect(result.endsWith("...")).toBe(false);
		});

		it("should handle complex HTML correctly", () => {
			const html = `
              <div class="container">
                <h1 class="title">Main Title</h1>
                <p>This is a <strong>bold</strong> statement with a <a href="https://example.com">link</a>.</p>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                </ul>
              </div>
            `;

			const result = stripHtmlForPreview(html);
			expect(result).toContain("Main Title");
			expect(result).toContain("This is a bold statement with a link");
			expect(result).toContain("Item 1");
			expect(result).toContain("Item 2");
			// Check that HTML tags are removed
			expect(result).not.toContain("<");
			expect(result).not.toContain(">");
		});

		it("should handle malformed HTML", () => {
			expect(stripHtmlForPreview("<p>Unclosed tag")).toBe("Unclosed tag");
			expect(stripHtmlForPreview("Unopened tag</p>")).toBe("Unopened tag");
			expect(stripHtmlForPreview("<p>Mismatched <div>tags</p>")).toBe("Mismatched tags");
		});
	});

	describe("processHtmlForDetail", () => {
		it("should return empty string for empty input", () => {
			expect(processHtmlForDetail("")).toBe("");
			expect(processHtmlForDetail(null as unknown as string)).toBe("");
			expect(processHtmlForDetail(undefined as unknown as string)).toBe("");
		});

		it("should add spacing for unordered lists", () => {
			const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain(
				'<ul style="list-style-type: disc; margin: 1em 0; padding-left: 2em;">\n<li'
			);
			expect(processed).toContain("</li>\n<li");
			expect(processed).toContain("</li>\n</ul");
		});

		it("should add spacing for ordered lists", () => {
			const html = "<ol><li>Item 1</li><li>Item 2</li></ol>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain(
				'<ol style="list-style-type: decimal; margin: 1em 0; padding-left: 2em;">\n<li'
			);
			expect(processed).toContain("</li>\n<li");
			expect(processed).toContain("</li>\n</ol");
		});

		it("should ensure proper paragraph spacing", () => {
			const html = "<p>Paragraph 1</p><p>Paragraph 2</p>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain("</p>\n<p");
		});

		it("should style unordered lists correctly", () => {
			const html = "<ul><li>Item</li></ul>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain(
				'<ul style="list-style-type: disc; margin: 1em 0; padding-left: 2em;"'
			);
		});

		it("should style ordered lists correctly", () => {
			const html = "<ol><li>Item</li></ol>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain(
				'<ol style="list-style-type: decimal; margin: 1em 0; padding-left: 2em;"'
			);
		});

		it("should style list items correctly", () => {
			const html = "<ul><li>Item</li></ul>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain('<li style="display: list-item; margin: 0.5em 0;"');
		});

		it("should style paragraphs correctly", () => {
			const html = "<p>Content</p>";
			const processed = processHtmlForDetail(html);
			expect(processed).toContain('<p style="margin: 1em 0; line-height: 1.6;"');
		});

		it("should make links open in new tab with security attributes", () => {
			const html = '<a href="https://example.com">Link</a>';
			const processed = processHtmlForDetail(html);
			expect(processed).toContain(
				'<a href="https://example.com" target="_blank" rel="noopener noreferrer" style="color: #3A8C96; text-decoration: underline;"'
			);
		});

		it("should convert relative image URLs to absolute ones", () => {
			const html = '<img src="/images/test.jpg" alt="Test">';
			const processed = processHtmlForDetail(html);
			expect(processed).toContain('<img src="https://medlineplus.gov/images/test.jpg"');
		});

		it("should handle various link formats", () => {
			const html = `
        <a href='https://example1.com'>Single quotes</a>
        <a href="https://example2.com">Double quotes</a>
        <a href="https://example3.com" class="link">With attributes</a>
      `;
			const processed = processHtmlForDetail(html);
			expect(processed).toContain('target="_blank" rel="noopener noreferrer"');
			expect(processed).toContain('style="color: #3A8C96; text-decoration: underline;"');
		});

		it("should handle complex nested HTML", () => {
			const html = `
        <div>
          <h2>Section Title</h2>
          <p>Intro paragraph</p>
          <ul>
            <li>Item with <a href="https://example.com">link</a></li>
            <li>Item with <img src="/images/icon.png" alt="icon"></li>
          </ul>
          <p>Conclusion</p>
        </div>
      `;
			const processed = processHtmlForDetail(html);

			// Test list spacing
			expect(processed).toContain(
				'<ul style="list-style-type: disc; margin: 1em 0; padding-left: 2em;">\n<li'
			);

			// Test link processing
			expect(processed).toContain('target="_blank" rel="noopener noreferrer"');

			// Test image URL conversion
			expect(processed).toContain("https://medlineplus.gov/images/icon.png");

			// Test paragraph styling
			expect(processed).toContain('<p style="margin: 1em 0; line-height: 1.6;"');
		});
	});
});

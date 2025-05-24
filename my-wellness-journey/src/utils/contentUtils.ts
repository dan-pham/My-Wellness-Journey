/**
 * Utility functions for content handling
 */

/**
 * Strip HTML tags from text for use in previews/cards
 * @param htmlContent HTML content to strip
 * @returns Plain text without HTML tags
 */
export function stripHtmlForPreview(htmlContent: string): string {
  if (!htmlContent) return '';
  
  return htmlContent
    .replace(/<\/?[^>]+(>|$)/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim() // Trim whitespace
    .substring(0, 200) + (htmlContent.length > 200 ? '...' : ''); // Limit length for preview
}

/**
 * Process HTML content for detail views, ensuring it's safe and properly formatted
 * @param htmlContent HTML content to process
 * @returns Sanitized HTML content safe for rendering
 */
export function processHtmlForDetail(htmlContent: string): string {
  if (!htmlContent) return '';
  
  // First ensure proper spacing for lists and paragraphs
  let processedHtml = htmlContent
    // Fix common list structure issues
    .replace(/<ul\s*>\s*<li/g, '<ul>\n<li')
    .replace(/<\/li>\s*<li/g, '</li>\n<li')
    .replace(/<\/li>\s*<\/ul/g, '</li>\n</ul')
    // Same for ordered lists
    .replace(/<ol\s*>\s*<li/g, '<ol>\n<li')
    .replace(/<\/li>\s*<\/ol/g, '</li>\n</ol')
    // Ensure paragraphs have proper spacing
    .replace(/<\/p>\s*<p>/g, '</p>\n<p>');
  
  // Now handle links, images, and inline styles
  processedHtml = processedHtml
    // Add explicit display properties to list elements to ensure they render correctly
    .replace(/<ul/g, '<ul style="list-style-type: disc; margin: 1em 0; padding-left: 2em;"')
    .replace(/<ol/g, '<ol style="list-style-type: decimal; margin: 1em 0; padding-left: 2em;"')
    .replace(/<li/g, '<li style="display: list-item; margin: 0.5em 0;"')
    // Add paragraph spacing
    .replace(/<p/g, '<p style="margin: 1em 0; line-height: 1.6;"')
    // Make all links open in a new tab with appropriate security attributes
    .replace(
      /<a\s+(?:[^>]*?\s+)?href=(["])(.*?)\1/gi, 
      '<a href=$1$2$1 target="_blank" rel="noopener noreferrer" style="color: #3A8C96; text-decoration: underline;"'
    )
    // Convert relative URLs to absolute ones
    .replace(
      /<img\s+src=(['"])(\/[^'"]+)\1/gi,
      (match, quote, url) => `<img src=${quote}https://medlineplus.gov${url}${quote}`
    );
  
  return processedHtml;
} 
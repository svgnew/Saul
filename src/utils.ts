/**
 * Generate timestamp in format YYYYMMDD-HHMMSS
 */
export function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Remove timestamp prefix from filename
 * @param filename - Filename with timestamp prefix (e.g., "20251006-143022-red-house")
 * @returns Base filename without timestamp
 */
export function removeTimestampPrefix(filename: string): string {
  return filename.replace(/^\d{8}-\d{6}-/, '');
}

/**
 * Clean SVG markup by removing markdown code blocks
 * @param svg - Raw SVG string that may contain markdown
 * @returns Cleaned SVG markup
 */
export function cleanSVGMarkup(svg: string): string {
  return svg
    .trim()
    .replace(/^```svg\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
}

/**
 * Sanitize filename to kebab-case
 * @param filename - Raw filename string
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Normalizes author names by removing common metadata prefixes and suffixes
 * This ensures consistent display and filtering across the application
 *
 * Examples:
 * - "tr. Annette Susannah Beveridge" -> "Annette Susannah Beveridge"
 * - "ed. William Foster" -> "William Foster"
 * - "1762-1829 Francis Buchanan Hamilton" -> "Francis Buchanan Hamilton"
 * - "Francis Buchanan Hamilton, 1762-1829" -> "Francis Buchanan Hamilton"
 */
export function normalizeAuthorName(name: string): string {
  return name
    // Remove translator/editor prefixes: "tr. ", "ed. ", "eds. ", etc.
    .replace(/^(tr\.|ed\.|eds\.|comp\.|rev\.|trans\.|translator\.|editor\.|compiled by)\s+/i, '')
    // Remove date ranges at the beginning: "YYYY-YYYY "
    .replace(/^\d{4}-\d{4}\s+/, '')
    // Remove date ranges at the end: ", YYYY-YYYY" or " (YYYY-YYYY)"
    .replace(/[,\s]*[\(]?\d{4}-\d{4}[\)]?\s*$/, '')
    // Remove birth years at the end: ", b. YYYY" or " (b. YYYY)"
    .replace(/[,\s]*[\(]?b\.\s*\d{4}[\)]?\s*$/i, '')
    // Remove death years at the end: ", d. YYYY" or " (d. YYYY)"
    .replace(/[,\s]*[\(]?d\.\s*\d{4}[\)]?\s*$/i, '')
    // Clean up extra whitespace
    .trim();
}

/**
 * Normalizes an array of author names
 */
export function normalizeAuthorNames(names: string[]): string[] {
  return names.map(normalizeAuthorName);
}

/**
 * Gets unique normalized author names from a collection of works
 */
export function getUniqueNormalizedAuthors(works: Array<{ data: { author: string[] } }>): string[] {
  const allAuthors = works.flatMap(work => work.data.author.map(normalizeAuthorName));
  return [...new Set(allAuthors)].sort();
}

/**
 * Pure helpers for associating news articles with bills. Kept separate from
 * the sync route so they're unit-testable without a DB or network.
 */

/**
 * Extract normalized bill-code keys (e.g. "HR1234", "S2", "HJRES5") from free
 * text. Normalization matches the DB's billType+billNumber so callers can look
 * up `${billType}${billNumber}` directly. Returns unique keys.
 */
export function billCodeKeys(text: string): string[] {
  const keys = new Set<string>()
  const re = /\b(h\.?\s?j\.?\s?res|s\.?\s?j\.?\s?res|h\.?\s?con\.?\s?res|s\.?\s?con\.?\s?res|h\.?\s?res|s\.?\s?res|h\.?\s?r|s)\.?\s*(\d{1,5})\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const prefix = m[1].replace(/[^a-z]/gi, '').toUpperCase()
    keys.add(`${prefix}${m[2]}`)
  }
  return Array.from(keys)
}

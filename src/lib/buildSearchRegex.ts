/**
 * Builds a RegExp for PDF text search.
 *
 * Mirrors the web project's implementation so both apps share identical
 * search semantics.
 *
 * Handles the many ways PDF.js may represent extracted text:
 * - Missing or extra whitespace between tokens (zero-or-more gap)
 * - Non-breaking spaces (NBSP, narrow-NBSP, thin space …) in extracted text
 * - Soft hyphens (U+00AD) and regular hyphens at visual line-breaks
 * - Multi-line pasted queries: each line is a segment joined with the same
 *   flexible separator so PDF line-breaks are transparent to the user.
 */

const REDOS_SAFE_MAX_LENGTH = 500

/**
 * Unicode "gap" characters that PDF.js may produce between words.
 * Used inside a regex character class `[…]`.
 */
const PDF_GAP_CHARS = "\\s\\u00A0\\u202F\\u2009\\u2003\\u2002\\u2005\\u2006\\u2008\\u200A"

/**
 * Separator placed between every consecutive query-token pair.
 * Matches any combination of Unicode spaces, soft hyphens (U+00AD), or
 * regular hyphens — all zero-or-more — so the pattern tolerates:
 *   "word word"        — space
 *   "wordword"         — concatenated (zero gap)
 *   "word\u00A0word"   — NBSP
 *   "word-word"        — hyphenated compound
 *   "word\u00ADword"   — soft-hyphen in PDF stream
 *   "word-\nword"      — hyphenated line-break in extracted text
 * The hyphen `-` is placed last in the class to be treated as a literal char.
 */
const TOKEN_SEP = `[${PDF_GAP_CHARS}\\u00AD-]*`

export interface BuildSearchRegexOptions {
  /** When true, search is case-sensitive (no `i` flag). */
  matchCase?: boolean
  /** When true, each token is wrapped in `\b…\b`. */
  wholeWords?: boolean
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Normalise the raw query before tokenising:
 * - NFC composition for consistent code-point comparison
 * - Replace Unicode space variants with ASCII space so token splitting works
 * - Remove soft hyphens (invisible — users should not have to type them)
 */
function normalizeQuery(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[\u00A0\u202F\u2009\u2003\u2002\u2005\u2006\u2008\u200A\u205F\u3000]/g, " ")
    .replace(/\u00AD/g, "")
}

function patternForLine(trimmedLine: string, wholeWords: boolean): string | null {
  const tokens = trimmedLine.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const escaped = tokens.map(escapeRegExp)
  const parts = wholeWords ? escaped.map((s) => `\\b${s}\\b`) : escaped
  return parts.join(TOKEN_SEP)
}

export function buildSearchRegex(rawQuery: string, opts?: BuildSearchRegexOptions): RegExp | null {
  const normalized = normalizeQuery(rawQuery)
  if (!normalized || normalized.trim() === "") return null
  if (normalized.length > REDOS_SAFE_MAX_LENGTH) return null

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  const wholeWords = Boolean(opts?.wholeWords)
  const linePatterns: string[] = []
  for (const line of lines) {
    const p = patternForLine(line, wholeWords)
    if (p) linePatterns.push(p)
  }
  if (linePatterns.length === 0) return null

  // Between query lines: same flexible separator — line-breaks in the PDF are transparent
  const pattern = linePatterns.join(TOKEN_SEP)
  const flags = opts?.matchCase ? "g" : "gi"

  try {
    return new RegExp(pattern, flags)
  } catch {
    return null
  }
}

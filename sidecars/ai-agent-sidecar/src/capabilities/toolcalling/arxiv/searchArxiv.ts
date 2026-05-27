import type { ArxivSearchResult } from "./types.ts";
import type { UserIntent } from "@/intent/types.ts";
import { filterWithdrawnPapers } from "./filterWithdrawnPapers.ts";
import { parseAtomResponse } from "./parseAtomXml.ts";
import { expandQueries } from "./queryExpander.ts";
import { parallelArxivSearch } from "./parallelSearch.ts";

const ARXIV_API_URL = "http://export.arxiv.org/api/query";
const MAX_RESULTS_LIMIT = 10;

/** Intent-aware search: expands queries and runs in parallel */
export async function searchArxivWithIntent(
  intent: UserIntent,
  maxPerQuery = 5,
): Promise<ArxivSearchResult> {
  const queries = expandQueries(intent);
  if (queries.length === 0) {
    return { papers: [], total_results: 0 };
  }
  return parallelArxivSearch(queries, maxPerQuery);
}

/** Original single-query search (used by tool and parallelSearch) */
export const searchArxivSingle = searchArxiv;

export async function searchArxiv(
  query: string,
  maxResults = 5,
): Promise<ArxivSearchResult> {
  const clampedMax = Math.min(Math.max(1, maxResults), MAX_RESULTS_LIMIT);
  const encodedQuery = encodeURIComponent(query);
  const url =
    `${ARXIV_API_URL}?search_query=all:${encodedQuery}&max_results=${clampedMax}&sortBy=relevance&sortOrder=descending`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ArXiv API error: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parsed = parseAtomResponse(xml);
  const filtered = await filterWithdrawnPapers(parsed.papers);
  return { papers: filtered, total_results: parsed.total_results };
}

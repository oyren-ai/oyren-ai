import type { ArxivSearchResult } from "./types.ts";
import { searchArxivSingle } from "./searchArxiv.ts";
import { deduplicatePapers } from "./deduplicateResults.ts";

const DEFAULT_MAX_PER_QUERY = 5;

export async function parallelArxivSearch(
  queries: string[],
  maxPerQuery = DEFAULT_MAX_PER_QUERY,
): Promise<ArxivSearchResult> {
  const results = await Promise.allSettled(
    queries.map((query) => searchArxivSingle(query, maxPerQuery)),
  );

  const allPapers = results
    .filter(
      (r): r is PromiseFulfilledResult<ArxivSearchResult> =>
        r.status === "fulfilled",
    )
    .flatMap((r) => r.value.papers);

  const deduped = deduplicatePapers(allPapers);

  return {
    papers: deduped,
    total_results: deduped.length,
  };
}

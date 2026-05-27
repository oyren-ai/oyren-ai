import type { ArxivPaper } from "./types.ts";

export function deduplicatePapers(papers: ArxivPaper[]): ArxivPaper[] {
  const countMap = new Map<string, number>();
  const paperMap = new Map<string, ArxivPaper>();

  for (const paper of papers) {
    const count = countMap.get(paper.id) || 0;
    countMap.set(paper.id, count + 1);
    if (!paperMap.has(paper.id)) {
      paperMap.set(paper.id, paper);
    }
  }

  // Sort by occurrence count descending (papers found by more queries ranked higher)
  return Array.from(paperMap.values()).sort((a, b) => {
    const countA = countMap.get(a.id)!;
    const countB = countMap.get(b.id)!;
    return countB - countA;
  });
}

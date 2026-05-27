import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchArxiv } from "./arxiv/searchArxiv.ts";
import type { ArxivPaper } from "./arxiv/types.ts";

const arxivSearchSchema = z.object({
  query: z.string().describe(
    "Search query for ArXiv papers. Use academic keywords, author names, or paper topics.",
  ),
  maxResults: z.number().min(1).max(10).default(5).describe(
    "Maximum number of papers to return (1-10, default 5).",
  ),
});

export const arxivSearchTool = tool(
  async (input) => {
    const result = await searchArxiv(input.query, input.maxResults);

    const formatted = result.papers.map((p: ArxivPaper) => ({
      id: p.id,
      title: p.title,
      authors: p.authors.slice(0, 5),
      summary: p.summary,
      published: p.published,
      arxiv_url: p.arxiv_url,
      pdf_url: p.pdf_url,
      categories: p.categories.slice(0, 3),
    }));

    return JSON.stringify({
      total_results: result.total_results,
      papers: formatted,
    });
  },
  {
    name: "arxiv_search",
    description:
      "Search ArXiv for academic papers. Use this when the user asks about research papers, " +
      "academic topics, scientific findings, or wants to find papers on a specific subject. " +
      "Returns paper titles, authors, abstracts, and links.",
    schema: arxivSearchSchema,
  },
);

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { fetchPaperText } from "./arxiv/fetchPaperText.ts";

const arxivFetchSchema = z.object({
  arxivId: z.string().describe(
    "ArXiv paper ID (e.g., '2301.07041'). Usually obtained from a search result.",
  ),
  abstract: z.string().optional().describe(
    "The paper abstract as fallback if full text retrieval fails.",
  ),
});

export const arxivFetchTool = tool(
  async (input) => {
    const result = await fetchPaperText(input.arxivId, input.abstract);

    return JSON.stringify({
      arxiv_id: input.arxivId,
      source: result.source,
      text: result.fullText,
    });
  },
  {
    name: "arxiv_fetch",
    description:
      "Fetch the full text of an ArXiv paper by its ID. Use this after searching " +
      "to get detailed content of a specific paper for analysis or summarization. " +
      "The text is extracted from ar5iv (HTML version of ArXiv papers).",
    schema: arxivFetchSchema,
  },
);

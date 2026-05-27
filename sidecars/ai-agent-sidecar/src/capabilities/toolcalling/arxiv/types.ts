export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  arxiv_url: string;
  pdf_url: string;
  categories: string[];
}

export interface ArxivSearchResult {
  papers: ArxivPaper[];
  total_results: number;
}

export interface ArxivPaperMeta {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  arxiv_url: string;
  pdf_url: string;
  published: string;
}

export function paperToMeta(paper: ArxivPaper): ArxivPaperMeta {
  return {
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    summary: paper.summary,
    arxiv_url: paper.arxiv_url,
    pdf_url: paper.pdf_url,
    published: paper.published,
  };
}

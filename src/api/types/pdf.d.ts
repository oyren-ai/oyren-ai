export interface ProcessPdfResult {
  pages: Array<{
    page_number: number;
    text: string;
  }>;
  total_pages: number;
  extractable_pages: number;
}
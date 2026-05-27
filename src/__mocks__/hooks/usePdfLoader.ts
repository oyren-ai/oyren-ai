import { vi } from 'vitest';

export const usePdfLoader = vi.fn((pdfFilePath: string | null) => ({
  pdfData: pdfFilePath ? new Uint8Array([1, 2, 3]) : null,
  pdfUrl: pdfFilePath ? 'blob:mock-url' : null,
  pdfLoaded: !!pdfFilePath,
  pageCount: pdfFilePath ? 10 : 0,
  handleDocumentLoad: vi.fn()
}));
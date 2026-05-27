import { vi } from 'vitest';

export const usePdfLoader = vi.fn((pdfFilePath: string | null) => ({
  pdfData: pdfFilePath ? new Uint8Array([1, 2, 3, 4, 5]) : null,
  pdfUrl: pdfFilePath ? 'blob:mock-url' : null,
  pdfLoaded: false,
  pageCount: 0,
  handleDocumentLoad: vi.fn((e: any) => {
    console.log('Mock handleDocumentLoad called');
  })
}));
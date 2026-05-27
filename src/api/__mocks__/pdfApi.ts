import { vi } from 'vitest';

export const pdfApi = {
  processPdfFile: vi.fn().mockImplementation((path) => {
    if (path === '/test/document.pdf') {
      const pages = Array.from({ length: 10 }, (_, i) => ({
        page_number: i + 1,
        text_content: `Page ${i + 1} content`,
      }));
      return Promise.resolve({
        pages,
        total_pages: 10,
        extractable_pages: 10,
      });
    }
    return Promise.resolve({
      pages: [
        { page_number: 1, text_content: 'Page 1 content' },
        { page_number: 2, text_content: 'Page 2 content' },
      ],
      total_pages: 2,
      extractable_pages: 2,
    });
  }),
  readPdfFile: vi.fn().mockResolvedValue([1, 2, 3]),
};

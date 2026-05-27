import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pdfApi } from '../pdfApi';
import type { ProcessPdfResult } from '../pdfApi';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('pdfApi', () => {
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { invoke } = vi.mocked(await import('@tauri-apps/api/core'));
    mockInvoke = invoke as ReturnType<typeof vi.fn>;
  });

  describe('readPdfFile', () => {
    it('should read PDF file with correct filepath', async () => {
      const mockFileData = [1, 2, 3, 4, 5];
      const filepath = '/path/to/document.pdf';

      mockInvoke.mockResolvedValueOnce(mockFileData);

      const result = await pdfApi.readPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath });
      expect(result).toEqual(mockFileData);
    });

    it('should handle empty file data', async () => {
      const mockFileData: number[] = [];
      const filepath = '/path/to/empty.pdf';

      mockInvoke.mockResolvedValueOnce(mockFileData);

      const result = await pdfApi.readPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath });
      expect(result).toEqual(mockFileData);
    });

    it('should handle large file data', async () => {
      const mockFileData = Array.from({ length: 10000 }, (_, i) => i);
      const filepath = '/path/to/large.pdf';

      mockInvoke.mockResolvedValueOnce(mockFileData);

      const result = await pdfApi.readPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath });
      expect(result).toEqual(mockFileData);
      expect(result).toHaveLength(10000);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('File not found');
      const filepath = '/path/to/nonexistent.pdf';

      mockInvoke.mockRejectedValueOnce(error);

      await expect(pdfApi.readPdfFile(filepath)).rejects.toThrow('File not found');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in filepath', async () => {
      const mockFileData = [1, 2, 3];
      const filepath = '/path/to/файл with spaces & special@chars.pdf';

      mockInvoke.mockResolvedValueOnce(mockFileData);

      const result = await pdfApi.readPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath });
      expect(result).toEqual(mockFileData);
    });
  });

  describe('processPdfFile', () => {
    const mockProcessResult: ProcessPdfResult = {
      pages: [
        { page_number: 1, text: 'Page 1 content' },
        { page_number: 2, text: 'Page 2 content' },
        { page_number: 3, text: 'Page 3 content' }
      ],
      total_pages: 3,
      extractable_pages: 3
    };

    it('should process PDF file without maxPages parameter', async () => {
      const filepath = '/path/to/document.pdf';

      mockInvoke.mockResolvedValueOnce(mockProcessResult);

      const result = await pdfApi.processPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', { filepath });
      expect(result).toEqual(mockProcessResult);
    });

    it('should process PDF file with maxPages parameter', async () => {
      const filepath = '/path/to/document.pdf';
      const maxPages = 10;

      mockInvoke.mockResolvedValueOnce(mockProcessResult);

      const result = await pdfApi.processPdfFile(filepath, maxPages);

      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', {
        filepath,
        maxPages
      });
      expect(result).toEqual(mockProcessResult);
    });

    it('should handle maxPages of 0', async () => {
      const filepath = '/path/to/document.pdf';
      const maxPages = 0;

      const emptyResult: ProcessPdfResult = {
        pages: [],
        total_pages: 0,
        extractable_pages: 0
      };

      mockInvoke.mockResolvedValueOnce(emptyResult);

      const result = await pdfApi.processPdfFile(filepath, maxPages);

      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', {
        filepath,
        maxPages
      });
      expect(result).toEqual(emptyResult);
    });

    it('should handle PDF with no extractable pages', async () => {
      const filepath = '/path/to/scanned.pdf';

      const scannedPdfResult: ProcessPdfResult = {
        pages: [],
        total_pages: 10,
        extractable_pages: 0
      };

      mockInvoke.mockResolvedValueOnce(scannedPdfResult);

      const result = await pdfApi.processPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', { filepath });
      expect(result).toEqual(scannedPdfResult);
      expect(result.extractable_pages).toBe(0);
      expect(result.total_pages).toBe(10);
    });

    it('should handle undefined maxPages correctly', async () => {
      const filepath = '/path/to/document.pdf';
      const maxPages = undefined;

      mockInvoke.mockResolvedValueOnce(mockProcessResult);

      const result = await pdfApi.processPdfFile(filepath, maxPages);

      // Should not include maxPages in the invoke call when undefined
      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', { filepath });
      expect(result).toEqual(mockProcessResult);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Failed to process PDF');
      const filepath = '/path/to/corrupt.pdf';

      mockInvoke.mockRejectedValueOnce(error);

      await expect(pdfApi.processPdfFile(filepath)).rejects.toThrow('Failed to process PDF');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should handle large PDF processing', async () => {
      const filepath = '/path/to/large.pdf';

      const largePdfResult: ProcessPdfResult = {
        pages: Array.from({ length: 1000 }, (_, i) => ({
          page_number: i + 1,
          text: `Page ${i + 1} content with lots of text...`
        })),
        total_pages: 1000,
        extractable_pages: 1000
      };

      mockInvoke.mockResolvedValueOnce(largePdfResult);

      const result = await pdfApi.processPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', { filepath });
      expect(result.pages).toHaveLength(1000);
      expect(result.total_pages).toBe(1000);
    });
  });

  describe('pdfApi object', () => {
    it('should expose readPdfFile function', () => {
      expect(pdfApi.readPdfFile).toBeDefined();
      expect(typeof pdfApi.readPdfFile).toBe('function');
    });

    it('should expose processPdfFile function', () => {
      expect(pdfApi.processPdfFile).toBeDefined();
      expect(typeof pdfApi.processPdfFile).toBe('function');
    });

    it('should call the same functions as standalone exports', async () => {
      const mockFileData = [10, 20, 30];
      const filepath = '/test/file.pdf';

      mockInvoke.mockResolvedValueOnce(mockFileData);

      const result = await pdfApi.readPdfFile(filepath);

      expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath });
      expect(result).toEqual(mockFileData);
    });

    it('should handle processPdfFile through object', async () => {
      const filepath = '/test/process.pdf';
      const maxPages = 5;

      const mockResult: ProcessPdfResult = {
        pages: [
          { page_number: 1, text: 'Test content' }
        ],
        total_pages: 1,
        extractable_pages: 1
      };

      mockInvoke.mockResolvedValueOnce(mockResult);

      const result = await pdfApi.processPdfFile(filepath, maxPages);

      expect(mockInvoke).toHaveBeenCalledWith('extract_pdf_sync', {
        filepath,
        maxPages
      });
      expect(result).toEqual(mockResult);
    });
  });
});
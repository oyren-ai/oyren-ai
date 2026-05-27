/**
 * PDF API module - Centralized PDF-related Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { ProcessPdfResult } from './types/pdf';

// Re-export types for convenience
export type { ProcessPdfResult };

export const pdfApi = {
    //TODO: create request and response types for these functions
    readPdfFile: async (filepath: string): Promise<number[]> => {
    return await invoke('read_pdf_file', { filepath });
  },
    //TODO: create request and response types for these functions

  processPdfFile: async (filepath: string, maxPages?: number): Promise<ProcessPdfResult> => {
    return await invoke('extract_pdf_sync', {
      filepath,
      ...(maxPages !== undefined && { maxPages })
    });
  }
};
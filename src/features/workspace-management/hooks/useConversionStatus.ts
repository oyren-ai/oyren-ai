import { useMemo } from 'react';
import type { WorkspaceFile } from '@/types/workspace';

interface SourcePdfMetadata {
  source_pdf_id: string;
}

function parseMetadata(file: WorkspaceFile): SourcePdfMetadata | null {
  if (!file.metadata) return null;
  try {
    return JSON.parse(file.metadata) as SourcePdfMetadata;
  } catch {
    return null;
  }
}

export function useConversionStatus(files: WorkspaceFile[]) {
  const pdfIdsWithConversion = useMemo(() => {
    const ids = new Set<string>();
    for (const file of files) {
      const meta = parseMetadata(file);
      if (meta?.source_pdf_id) {
        ids.add(meta.source_pdf_id);
      }
    }
    return ids;
  }, [files]);

  const hasConversion = (pdfFileId: string): boolean => {
    return pdfIdsWithConversion.has(pdfFileId);
  };

  return { hasConversion };
}

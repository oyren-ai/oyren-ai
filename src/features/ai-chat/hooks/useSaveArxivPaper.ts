import { useCallback, useState } from 'react';
import { workspaceApi } from '@/api/workspaceApi';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { ArxivPaperMeta } from '@/api/types/ai';

export function useSaveArxivPaper(workspaceId?: string) {
  const [savingPaperId, setSavingPaperId] = useState<string | null>(null);

  const savePaper = useCallback(async (paper: ArxivPaperMeta) => {
    if (!workspaceId) {
      console.error('[useSaveArxivPaper] No workspace ID available');
      return;
    }

    setSavingPaperId(paper.id);
    try {
      const filename = `${sanitizeFilename(paper.title)}.pdf`;
      const fileId = await workspaceApi.downloadArxivPaper(workspaceId, paper.pdf_url, filename);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
      const file = await workspaceFilesApi.getWorkspaceFile(fileId);
      window.dispatchEvent(new CustomEvent('open-workspace-file', {
        detail: { filePath: file.file_path, fileId: file.id },
      }));
    } catch (error) {
      console.error('[useSaveArxivPaper] Failed to save paper:', error);
    } finally {
      setSavingPaperId(null);
    }
  }, [workspaceId]);

  return { savePaper, savingPaperId };
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80);
}

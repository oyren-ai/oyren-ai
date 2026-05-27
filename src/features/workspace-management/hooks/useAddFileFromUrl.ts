import { useCallback, useState } from 'react';
import { workspaceApi } from '@/api/workspaceApi';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import { validatePdfUrl } from '../utils/validatePdfUrl';
import { extractFilenameFromUrl } from '../utils/extractFilenameFromUrl';

export function useAddFileFromUrl(workspaceId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFromUrl = useCallback(async (url: string): Promise<boolean> => {
    setError(null);

    if (!workspaceId) {
      setError('No workspace selected');
      return false;
    }

    const validation = validatePdfUrl(url);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid URL');
      return false;
    }

    setLoading(true);
    try {
      const filename = extractFilenameFromUrl(url.trim());
      const fileId = await workspaceApi.downloadArxivPaper(workspaceId, url.trim(), filename);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));

      const file = await workspaceFilesApi.getWorkspaceFile(fileId);
      window.dispatchEvent(new CustomEvent('open-workspace-file', {
        detail: { filePath: file.file_path, fileId: file.id },
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      return false;
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const resetError = useCallback(() => setError(null), []);

  return { loading, error, downloadFromUrl, resetError };
}

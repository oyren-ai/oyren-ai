import { useState, useCallback, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { ConversionResult } from '@/api/markerApi';
import { runWorkspacePdfConversion } from '@/features/workspace-management/utils/workspacePdfConversion';

interface ConversionProgressPayload {
  workspace_file_id: string;
  progress: number;
  status: string;
}

interface UseMarkerConversionOptions {
  workspaceId: string | undefined;
}

export function useMarkerConversion({ workspaceId }: UseMarkerConversionOptions) {
  const [convertingFiles, setConvertingFiles] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (convertingFiles.size === 0) return;

    const unlisten = listen<ConversionProgressPayload>('conversion-progress', (event) => {
      const { workspace_file_id, progress } = event.payload;
      setConvertingFiles((prev) => {
        if (!prev.has(workspace_file_id)) return prev;
        const next = new Map(prev);
        next.set(workspace_file_id, progress);
        return next;
      });
    });

    return () => { unlisten.then((fn) => fn()); };
  }, [convertingFiles.size > 0]);

  const convertPdf = useCallback(
    async (workspaceFileId: string, estimatedPages?: number): Promise<ConversionResult | null> => {
      setConvertingFiles((prev) => new Map(prev).set(workspaceFileId, 0));
      setError(null);

      try {
        const result = await runWorkspacePdfConversion(workspaceId!, workspaceFileId, estimatedPages);
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        return null;
      } finally {
        setConvertingFiles((prev) => {
          const next = new Map(prev);
          next.delete(workspaceFileId);
          return next;
        });
      }
    },
    [workspaceId],
  );

  return { convertingFiles, error, convertPdf };
}

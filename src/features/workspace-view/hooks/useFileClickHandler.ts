import { useCallback, useEffect } from 'react';
import { useMarkdownViewer } from '@/contexts/MarkdownViewerContext';
import { useRightPanel } from '@/contexts/RightPanelContext';
import { useLatexNotesContext } from '@/contexts/LatexNotesContext';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import isMarkdownFile from '@/features/workspace-management/utils/isMarkdownFile';
import isTexFile from '@/features/workspace-management/utils/isTexFile';

interface UseFileClickHandlerOptions {
  handleOpenPdfPath: (path: string, workspaceFileId: string) => void;
}

export function useFileClickHandler({ handleOpenPdfPath }: UseFileClickHandlerOptions) {
  const { setCurrentMarkdownFile } = useMarkdownViewer();
  const { activePanel, setActivePanel } = useRightPanel();
  const { setFileIdToOpen } = useLatexNotesContext();

  const handleFileClick = useCallback(async (filePath: string, workspaceFileId: string) => {
    const fileName = filePath.split('/').pop() ?? '';

    if (isTexFile(fileName)) {
      setCurrentMarkdownFile(null);
      if (activePanel === 'markdown-viewer') setActivePanel(null);
      setFileIdToOpen(workspaceFileId);
      setActivePanel('latex-notes');
      return;
    }

    if (isMarkdownFile(fileName)) {
      const file = await workspaceFilesApi.getWorkspaceFile(workspaceFileId);
      setCurrentMarkdownFile(file);
      setActivePanel('markdown-viewer');
    } else {
      setCurrentMarkdownFile(null);
      if (activePanel === 'markdown-viewer') {
        setActivePanel(null);
      }
      handleOpenPdfPath(filePath, workspaceFileId);
    }
  }, [handleOpenPdfPath, setCurrentMarkdownFile, setActivePanel, activePanel, setFileIdToOpen]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { filePath, fileId } = (e as CustomEvent).detail;
      handleFileClick(filePath, fileId);
    };
    window.addEventListener('open-workspace-file', handler);
    return () => window.removeEventListener('open-workspace-file', handler);
  }, [handleFileClick]);

  return { handleFileClick };
}

import { useMemo } from 'react';
import { useMarkdownViewer } from '@/contexts/MarkdownViewerContext';
import { useRightPanel } from '@/contexts/RightPanelContext';
import { useMarkdownViewerState } from './hooks/useMarkdownViewerState';
import { MarkdownViewerNavbar } from './MarkdownViewerNavbar';
import { EmptyMarkdownState } from './EmptyMarkdownState';
import { WorkspaceMarkdownViewer } from './components/WorkspaceMarkdownViewer';
import NoteEditor from '@/features/notes/mdx-notes/NoteEditor';

export default function MarkdownViewerPanel() {
  const { currentMarkdownFile, setCurrentMarkdownFile } = useMarkdownViewer();
  const { setActivePanel } = useRightPanel();
  const { content, handleContentChange, isLoading, isSaving, isEditing, toggleEditing } =
    useMarkdownViewerState(currentMarkdownFile);

  const basePath = useMemo(() => {
    if (!currentMarkdownFile?.file_path) return undefined;
    const parts = currentMarkdownFile.file_path.replace(/\\/g, '/').split('/');
    parts.pop(); // remove filename
    return parts.join('/');
  }, [currentMarkdownFile?.file_path]);

  const handleClose = () => {
    setCurrentMarkdownFile(null);
    setActivePanel(null);
  };

  if (!currentMarkdownFile) return <EmptyMarkdownState />;

  return (
    <div className="flex flex-col h-full">
      <MarkdownViewerNavbar title={currentMarkdownFile.file_name} isEditing={isEditing}
        isSaving={isSaving} onToggleEdit={toggleEditing} onClose={handleClose} />
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <NoteEditor content={content} onChange={handleContentChange} isSaving={isSaving} isLoading={isLoading} />
        ) : (
          <WorkspaceMarkdownViewer content={content} basePath={basePath} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

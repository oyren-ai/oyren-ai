import { useState, useCallback, useEffect } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import { categorizeWorkspaceFile } from '@/features/workspace-management/utils/categorizeWorkspaceFile';
import type { WorkspaceFile } from '@/types/workspace';

export interface MentionedFile {
  id: string;
  name: string;
  path: string;
}

interface UseFileMentionProps {
  workspaceId: string | undefined;
  currentPdfPath: string | null;
  inputValue: string;
  onInputChange: (value: string) => void;
}

interface UseFileMentionReturn {
  showMentionPopup: boolean;
  mentionFiles: WorkspaceFile[];
  selectedFiles: MentionedFile[];
  mentionSearchQuery: string;
  onSelectFile: (file: WorkspaceFile) => void;
  onRemoveFile: (fileId: string) => void;
  onCloseMentionPopup: () => void;
  checkForMention: (value: string, cursorPosition: number) => void;
  clearSelectedFiles: () => void;
}

export function useFileMention({
  workspaceId,
  currentPdfPath,
  inputValue,
  onInputChange,
}: UseFileMentionProps): UseFileMentionReturn {
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFiles, setMentionFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<MentionedFile[]>([]);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Load workspace files when popup opens
  useEffect(() => {
    if (showMentionPopup && workspaceId) {
      loadWorkspaceFiles();
    }
  }, [showMentionPopup, workspaceId]);

  const loadWorkspaceFiles = async () => {
    if (!workspaceId) return;
    try {
      const files = await workspaceFilesApi.listWorkspaceFiles(workspaceId, false);

      
      // Only documents (PDF) and scans (markdown from PDF). Exclude Notes (MDX notes).
      const documentFiles = files.filter(file => {
        const fileName = file.file_name.toLowerCase();
        if (!fileName.endsWith('.pdf') && !fileName.endsWith('.md')) return false;
        const category = categorizeWorkspaceFile(file);
        return category === 'Documents' || category === 'Scans';
      });
      
      // Prefer markdown versions over PDFs
      // If both "file.pdf" and "file.md" exist, only show "file.md"
      const deduplicatedFiles = deduplicateMarkdownAndPdf(documentFiles);
      
      // Sort: current file first, then by name
      const sorted = sortFiles(deduplicatedFiles, currentPdfPath);

      setMentionFiles(sorted);
    } catch (error) {
      console.error('Failed to load workspace files:', error);
    }
  };
  
  const deduplicateMarkdownAndPdf = (files: WorkspaceFile[]): WorkspaceFile[] => {
    const fileMap = new Map<string, WorkspaceFile>();
    
    files.forEach(file => {
      const baseName = file.file_name.replace(/\.(pdf|md)$/i, '');
      const existing = fileMap.get(baseName);
      
      if (!existing) {
        fileMap.set(baseName, file);
      } else {
        // Prefer .md over .pdf
        const isMarkdown = file.file_name.toLowerCase().endsWith('.md');
        const existingIsMarkdown = existing.file_name.toLowerCase().endsWith('.md');
        
        if (isMarkdown && !existingIsMarkdown) {
          fileMap.set(baseName, file);
        }
      }
    });
    
    return Array.from(fileMap.values());
  };

  const sortFiles = (files: WorkspaceFile[], currentPath: string | null): WorkspaceFile[] => {
    return [...files].sort((a, b) => {
      const aIsCurrent = a.file_path === currentPath;
      const bIsCurrent = b.file_path === currentPath;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      return a.file_name.localeCompare(b.file_name);
    });
  };

  const checkForMention = useCallback((value: string, cursorPosition: number) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Show popup if @ is at start or after space, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setShowMentionPopup(true);
        setMentionStartIndex(lastAtIndex);
        setMentionSearchQuery(textAfterAt.toLowerCase());
        return;
      }
    }
    setShowMentionPopup(false);
  }, []);

  const onSelectFile = useCallback((file: WorkspaceFile) => {
    // Add to selected files if not already selected
    if (!selectedFiles.find(f => f.id === file.id)) {
      setSelectedFiles(prev => [...prev, {
        id: file.id,
        name: file.file_name,
        path: file.file_path,
      }]);
    }

    // Remove @query from input to save space
    if (mentionStartIndex !== -1) {
      const before = inputValue.slice(0, mentionStartIndex);
      const after = inputValue.slice(mentionStartIndex + mentionSearchQuery.length + 1);
      const newValue = `${before}${after}`.trim();
      onInputChange(newValue);
    }

    setShowMentionPopup(false);
    setMentionStartIndex(-1);
  }, [selectedFiles, mentionStartIndex, mentionSearchQuery, inputValue, onInputChange]);

  const onRemoveFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const onCloseMentionPopup = useCallback(() => {
    setShowMentionPopup(false);
  }, []);

  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    showMentionPopup,
    mentionFiles,
    selectedFiles,
    mentionSearchQuery,
    onSelectFile,
    onRemoveFile,
    onCloseMentionPopup,
    checkForMention,
    clearSelectedFiles,
  };
}

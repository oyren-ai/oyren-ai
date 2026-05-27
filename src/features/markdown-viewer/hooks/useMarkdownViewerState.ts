import { useState, useEffect, useCallback, useRef } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { WorkspaceFile } from '@/types/workspace';

export function useMarkdownViewerState(file: WorkspaceFile | null) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!file) { setContent(''); return; }
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await workspaceFilesApi.readFile(file.id);
        setContent(data);
      } catch (err) {
        console.error('Error loading markdown:', err);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [file?.id]);

  const saveContent = useCallback(async (newContent: string) => {
    if (!file) return;
    setIsSaving(true);
    try {
      await workspaceFilesApi.updateFile(file.id, newContent);
    } catch (err) {
      console.error('Error saving markdown:', err);
    } finally {
      setIsSaving(false);
    }
  }, [file?.id]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => void saveContent(newContent), 1000);
  }, [saveContent]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const toggleEditing = useCallback(() => setIsEditing(prev => !prev), []);

  return { content, handleContentChange, isLoading, isSaving, isEditing, toggleEditing };
}

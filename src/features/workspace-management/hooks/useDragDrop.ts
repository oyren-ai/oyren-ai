import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Workspace } from '@/types/workspace';

interface UseDragDropOptions {
  workspace: Workspace | null | undefined;
  onFilesDropped: (paths: string[]) => Promise<void>;
}

export function useDragDrop({ workspace, onFilesDropped }: UseDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);

  // Use refs to avoid re-registering the event listener when callbacks change
  const onFilesDroppedRef = useRef(onFilesDropped);
  const workspaceRef = useRef(workspace);

  useEffect(() => { onFilesDroppedRef.current = onFilesDropped; }, [onFilesDropped]);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);

  const processFiles = useCallback(async (paths: string[]) => {
    if (!workspaceRef.current?.id) {
      console.warn('No workspace selected for file drop');
      return;
    }

    const pdfPaths = paths.filter(path => path.toLowerCase().endsWith('.pdf'));
    if (pdfPaths.length === 0) {
      console.warn('No PDF files in dropped items');
      return;
    }

    await onFilesDroppedRef.current(pdfPaths);
  }, []);

  const handleDrop = useDebouncedCallback(
    processFiles,
    300,
    { leading: true, trailing: false, maxWait: 300 }
  );

  // Event listener registers once and stays stable
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const window = getCurrentWindow();
        unlisten = await window.onDragDropEvent((event) => {
          if (event.payload.type === 'enter') {
            setIsDragging(true);
          } else if (event.payload.type === 'drop') {
            setIsDragging(false);
            handleDrop(event.payload.paths);
          } else if (event.payload.type === 'leave') {
            setIsDragging(false);
          }
        });
      } catch (error) {
        console.error('Failed to setup drag-drop listener:', error);
      }
    };

    setupListener();
    return () => { unlisten?.(); };
  }, [handleDrop]);

  return { isDragging };
}
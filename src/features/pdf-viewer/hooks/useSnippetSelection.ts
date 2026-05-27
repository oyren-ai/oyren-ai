import { useState } from 'react';

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function useSnippetSelection() {
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  const startSelection = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionRect({
      startX,
      startY,
      endX: startX,
      endY: startY,
    });
  };

  const updateSelection = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionRect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    setSelectionRect({
      ...selectionRect,
      endX,
      endY,
    });
  };

  const endSelection = () => {
    setIsSelecting(false);
  };

  const clearSelection = () => {
    setSelectionRect(null);
  };

  const isValidSelection = () => {
    if (!selectionRect) return false;
    const width = Math.abs(selectionRect.endX - selectionRect.startX);
    const height = Math.abs(selectionRect.endY - selectionRect.startY);
    return width > 10 && height > 10;
  };

  const getSelectionBounds = () => {
    if (!selectionRect) return null;
    return {
      x: Math.min(selectionRect.startX, selectionRect.endX),
      y: Math.min(selectionRect.startY, selectionRect.endY),
      width: Math.abs(selectionRect.endX - selectionRect.startX),
      height: Math.abs(selectionRect.endY - selectionRect.startY)
    };
  };

  return {
    isSelecting,
    selectionRect,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    isValidSelection,
    getSelectionBounds
  };
}
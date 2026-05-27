import React from 'react';
import { useSnippetSelection } from '../../pdf-viewer/hooks/useSnippetSelection';
import { useSnippetCaptureHandler } from '../../pdf-viewer/hooks/useSnippetCaptureHandler';
import SelectionRectangle from './SelectionRectangle';
import SnippetCursor from './SnippetCursor';

interface SnippetOverlayProps {
  isActive: boolean;
  onDeactivate: () => void;
  viewerRef: React.RefObject<HTMLDivElement>;
}

const SnippetOverlay: React.FC<SnippetOverlayProps> = ({ 
  isActive, 
  onDeactivate,
  viewerRef 
}) => {
  const {
    isSelecting,
    selectionRect,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    isValidSelection,
    getSelectionBounds
  } = useSnippetSelection();

  const { handleCapture } = useSnippetCaptureHandler({
    viewerRef,
    onComplete: () => {
      clearSelection();
      onDeactivate();
    }
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return;
    startSelection(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateSelection(e);
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isSelecting || !selectionRect) return;
    
    endSelection();
    
    if (isValidSelection()) {
      const bounds = getSelectionBounds()!;
      await handleCapture(e, bounds);
    } else {
      clearSelection();
    }
  };

  if (!isActive) return null;

  return (
    <>
      <div
        className="absolute inset-0 z-50 snippet-overlay"
        style={{ 
          cursor: 'crosshair',
          pointerEvents: 'all',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        data-testid="snippet-overlay"
      >
        {selectionRect && (
          <SelectionRectangle
            startX={selectionRect.startX}
            startY={selectionRect.startY}
            endX={selectionRect.endX}
            endY={selectionRect.endY}
          />
        )}
      </div>
      <SnippetCursor isActive={isActive} />
    </>
  );
};

export default SnippetOverlay;
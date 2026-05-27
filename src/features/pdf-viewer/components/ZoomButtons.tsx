import React from 'react';
import { isMinScale, isMaxScale } from '@/constants/pdfZoom';

interface ZoomButtonsProps {
  currentScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Segmented zoom control — matches web PDF toolbar (WorkspacePdfViewerToolbar). */
const ZoomButtons: React.FC<ZoomButtonsProps> = ({ currentScale, onZoomIn, onZoomOut }) => {
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-md border border-neutral-200 bg-white/90 px-1 dark:border-white/15 dark:bg-neutral-950/90">
      <button
        type="button"
        onClick={onZoomOut}
        disabled={isMinScale(currentScale)}
        title="Zoom Out"
        className="rounded px-1.5 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        −
      </button>
      <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
        {Math.round(currentScale * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={isMaxScale(currentScale)}
        title="Zoom In"
        className="rounded px-1.5 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        +
      </button>
    </div>
  );
};

export default ZoomButtons;

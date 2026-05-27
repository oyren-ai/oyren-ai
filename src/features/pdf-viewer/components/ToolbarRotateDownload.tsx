import { RotateCcw, RotateCw } from 'lucide-react';
import { RotateDirection } from '@react-pdf-viewer/core';
import type { PdfViewerPluginsInstance } from '@/features/pdf-viewer/hooks/usePdfViewerPlugins';

interface ToolbarRotateProps {
  rotatePlugin: PdfViewerPluginsInstance['rotatePlugin'];
}

export default function ToolbarRotateDownload({ rotatePlugin }: ToolbarRotateProps) {
  const { Rotate } = rotatePlugin;

  return (
    <div className="flex h-8 items-center gap-0.5 rounded-md border border-neutral-200 bg-white/90 px-1 dark:border-white/15 dark:bg-neutral-950/90">
      <Rotate direction={RotateDirection.Backward}>
        {(props: { onClick: () => void }) => (
          <button
            type="button"
            onClick={props.onClick}
            title="Rotate left (all pages)"
            className="rounded p-0.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </Rotate>
      <Rotate direction={RotateDirection.Forward}>
        {(props: { onClick: () => void }) => (
          <button
            type="button"
            onClick={props.onClick}
            title="Rotate right (all pages)"
            className="rounded p-0.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
      </Rotate>
    </div>
  );
}

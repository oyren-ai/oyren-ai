import { Upload } from "lucide-react";
import { createPortal } from "react-dom";

interface DragDropZoneProps {
  isDragging: boolean;
}

export function DragDropZone({ isDragging }: DragDropZoneProps) {
  if (!isDragging) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm border-2 border-dashed border-primary animate-in fade-in-0 zoom-in-95 pointer-events-none">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <div className="rounded-full bg-primary/10 p-6">
          <Upload className="w-12 h-12 text-primary animate-bounce" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Drop PDF(s) here</h3>
          <p className="text-sm text-muted-foreground">
            Release to add files to workspace
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
import { FileText } from 'lucide-react';

export function EmptyMarkdownState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-2">No markdown file selected</p>
      <p className="text-sm text-muted-foreground">Click a .md file in the sidebar to view it here</p>
    </div>
  );
}

import { Edit, Eye, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarkdownViewerNavbarProps {
  title: string;
  isEditing: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onClose: () => void;
}

export function MarkdownViewerNavbar({
  title, isEditing, isSaving, onToggleEdit, onClose,
}: MarkdownViewerNavbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h2 className="flex-1 text-base font-semibold truncate text-foreground">{title}</h2>
      {isSaving && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Save className="w-3 h-3" /><span>Saving...</span>
        </div>
      )}
      <Button variant="ghost" size="icon" onClick={onToggleEdit}
        className="h-9 w-9 rounded-lg hover:bg-accent" title={isEditing ? 'Preview' : 'Edit'}>
        {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onClose}
        className="h-9 w-9 rounded-lg hover:bg-accent" title="Close">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

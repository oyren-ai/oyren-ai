import { Trash2, Edit, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteItemActionsProps {
  onRename: () => void;
  onDelete: () => void;
}

export function NoteItemActions({ onRename, onDelete }: NoteItemActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="note-actions-trigger"
          className="p-1 rounded hover:bg-accent hover:text-accent-foreground opacity-0 group-hover/note-item:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem
          data-testid="rename-note-btn"
          onClick={(e) => { e.stopPropagation(); onRename(); }}
        >
          <Edit className="w-4 h-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="delete-note-btn"
          className="text-red-500 focus:text-red-600"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

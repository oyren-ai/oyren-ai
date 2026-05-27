import { CreateNoteDialog } from './CreateNoteDialog.tsx';
import { RenameFileDialog } from '@/features/workspace-management/components/RenameFileDialog.tsx';
import { DeleteFileDialog } from '@/features/workspace-management/components/DeleteFileDialog.tsx';
import type { WorkspaceFile } from '@/types/workspace.ts';

interface NoteDialogsProps {
  createDialogOpen: boolean;
  onCreateClose: () => void;
  onCreateSubmit: (name: string) => Promise<void>;
  renameDialogOpen: boolean;
  onRenameClose: () => void;
  renameFile: WorkspaceFile | null;
  onRenameConfirm: (file: WorkspaceFile, newName: string) => Promise<void>;
  deleteDialogOpen: boolean;
  onDeleteClose: () => void;
  deleteFile: WorkspaceFile | null;
  onDeleteConfirm: (file: WorkspaceFile) => Promise<void>;
}

export function NoteDialogs({
  createDialogOpen, onCreateClose, onCreateSubmit,
  renameDialogOpen, onRenameClose, renameFile, onRenameConfirm,
  deleteDialogOpen, onDeleteClose, deleteFile, onDeleteConfirm,
}: NoteDialogsProps) {
  return (
    <>
      <CreateNoteDialog
        isOpen={createDialogOpen}
        onClose={onCreateClose}
        onSubmit={onCreateSubmit}
      />
      <RenameFileDialog
        isOpen={renameDialogOpen}
        onClose={onRenameClose}
        file={renameFile}
        onConfirm={onRenameConfirm}
      />
      <DeleteFileDialog
        isOpen={deleteDialogOpen}
        onClose={onDeleteClose}
        file={deleteFile}
        onConfirm={onDeleteConfirm}
      />
    </>
  );
}

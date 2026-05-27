import React, { useState } from 'react';
import { workspaceApi } from '@/api/workspaceApi.ts';
import type { Workspace } from '@/types/workspace';
import { useDeleteWorkspaceModal } from '@/contexts/ModalContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteWorkspaceDialog({ isOpen, onClose }: DeleteWorkspaceDialogProps) {
  const deleteWorkspaceModal = useDeleteWorkspaceModal();
  const workspace = deleteWorkspaceModal.data?.workspace as Workspace | undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!workspace) return;

    setLoading(true);
    setError('');

    try {
      await workspaceApi.delete(workspace.id);

      // Dispatch event for HomePage to refresh
      window.dispatchEvent(new CustomEvent('workspace-deleted', { detail: workspace }));

      onClose();
    } catch (err) {
      setError('Failed to delete workspace. Please try again.');
      console.error('Failed to delete workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  if (!workspace) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]" data-testid="delete-workspace-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Workspace
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the workspace "{workspace.name}"?
          </p>

          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All data associated with this workspace will be permanently deleted.
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Workspace'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { workspaceApi } from '@/api/workspaceApi.ts';
import type { Workspace } from '@/types/workspace.ts';
import { useEditWorkspaceModal } from '@/contexts/ModalContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EditWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
//TODO: see if it's possible to reuse some of the components from CreateWorkspaceDialog
//TODO: name such as dialog is confusing when there is a SettingsModal, make it consistent
export function EditWorkspaceDialog({
  isOpen,
  onClose,
}: EditWorkspaceDialogProps) {
  const editWorkspaceModal = useEditWorkspaceModal();
  const workspace = editWorkspaceModal.data?.workspace as Workspace | undefined;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workspace) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setError(null);
    }
  }, [isOpen, workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspace) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Workspace name is required');
      return;
    }

    if (trimmedName.length > 32) {
      setError('Workspace name must be 32 characters or less');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updated = await workspaceApi.update(
        workspace.id,
        trimmedName,
        description.trim() || null
      );

      // Dispatch event for HomePage to refresh
        //TODO: do we even need these
      window.dispatchEvent(new CustomEvent('workspace-updated', { detail: updated }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 32) {
      setName(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="edit-workspace-dialog">
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="workspace-name">
                Name *
              </Label>
              <span className="text-xs text-muted-foreground">
                {name.length}/32
              </span>
            </div>
            <Input
              id="workspace-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter workspace name"
              autoFocus
              disabled={isLoading}
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">
              Description
            </Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter workspace description (optional)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
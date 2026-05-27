import React, { useState } from 'react';
import { workspaceApi } from '@/api/workspaceApi.ts';
import { useViewNavigation } from '@/contexts/NavigationContext';
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

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceDialog({ isOpen, onClose }: CreateWorkspaceDialogProps) {
  const { navigateToWorkspace } = useViewNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create workspace via API
      const workspace = await workspaceApi.create(
        name.trim(),
        description.trim() || undefined
      );

      // Navigate to the newly created workspace
      navigateToWorkspace(workspace);

      // Dispatch workspace-created event for HomePage to refresh list
      window.dispatchEvent(new CustomEvent('workspace-created'));

      // Reset form and close dialog
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(`Failed: ${err?.message || JSON.stringify(err)}`);
      console.error('Failed to create workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="create-workspace-dialog">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">
              Name *
            </Label>
            <Input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              autoFocus
              autoCorrect='off'
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
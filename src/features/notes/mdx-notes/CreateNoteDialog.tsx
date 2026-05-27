import React, { useState, useEffect } from 'react';
import { useCreateNoteModal } from '@/contexts/ModalContext.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';

interface CreateNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteName: string) => Promise<void>;
}

export function CreateNoteDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateNoteDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Note name is required');
      return;
    }

    if (trimmedName.includes('/') || trimmedName.includes('\\')) {
      setError('Note name cannot contain slashes');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(trimmedName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="create-note-dialog">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-name">
              Note Name *
            </Label>
            <Input
              id="note-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter note name"
              autoFocus
              disabled={isLoading}
              data-testid="note-name-input"
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
              {isLoading ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

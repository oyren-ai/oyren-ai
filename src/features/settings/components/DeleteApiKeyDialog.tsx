import React, { useState } from 'react';
import { aiProviderApi } from '@/api/aiProviderApi';
import type { AiProviderKey } from '@/types/aiProviderKey';
import { useDeleteApiKeyModal } from '@/contexts/ModalContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteApiKeyDialog({ isOpen, onClose }: DeleteApiKeyDialogProps) {
  const deleteApiKeyModal = useDeleteApiKeyModal();
  const apiKey = deleteApiKeyModal.data?.apiKey as AiProviderKey | undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!apiKey) return;

    setLoading(true);
    setError('');

    try {
      await aiProviderApi.delete(apiKey.id);
      window.dispatchEvent(new CustomEvent('api-key-deleted'));
      onClose();
    } catch (err) {
      setError('Failed to delete API key. Please try again.');
      console.error('Failed to delete API key:', err);
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

  if (!apiKey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete API Key
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{apiKey.name}"?
          </p>

          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You will need to re-add this API key if you want to use it again.
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
            {loading ? 'Deleting...' : 'Delete API Key'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
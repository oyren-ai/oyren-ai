import React, { useState, useEffect } from 'react';
import type { WorkspaceFile } from '@/types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Loader2 } from 'lucide-react';

interface RenameFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: WorkspaceFile | null;
  onConfirm: (file: WorkspaceFile, newName: string) => Promise<void>;
}

/**
 * Extracts just the filename without extension
 */
function getFileNameWithoutExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return fileName;
  return fileName.substring(0, lastDotIndex);
}

/**
 * Gets the file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.substring(lastDotIndex);
}

/**
 * Validates filename - checks for invalid characters
 */
function isValidFileName(fileName: string): { valid: boolean; error?: string } {
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: 'File name cannot be empty' };
  }

  if (fileName.length > 255) {
    return { valid: false, error: 'File name is too long (max 255 characters)' };
  }

  // Windows and Unix invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    return { valid: false, error: 'File name contains invalid characters' };
  }

  // Reserved names on Windows
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(fileName)) {
    return { valid: false, error: 'File name is reserved' };
  }

  return { valid: true };
}

export function RenameFileDialog({
  isOpen,
  onClose,
  file,
  onConfirm,
}: RenameFileDialogProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen && file) {
      const nameWithoutExt = getFileNameWithoutExtension(file.file_name);
      setNewName(nameWithoutExt);
      setError(null);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setNewName('');
      setError(null);
    }
  }, [isOpen, file]);

  const handleSave = async () => {
    if (!file) return;

    const extension = getFileExtension(file.file_name);
    const fullNewName = newName.trim() + extension;

    // Validate
    const validation = isValidFileName(fullNewName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file name');
      return;
    }

    // Check if name actually changed
    if (fullNewName === file.file_name) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onConfirm(file, fullNewName);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename file';
      setError(errorMessage);
      console.error('Failed to rename file:', err);
      // Don't close the dialog on error - let user see the error and fix it
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!saving) {
      setError(null);
      onClose();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    // Prevent closing via overlay/escape during save operation
    // Only allow closing via Cancel button (handleCancel)
    if (!open && !saving && !error) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !saving) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!file) return null;

  const extension = getFileExtension(file.file_name);
  const hasChanges = newName.trim() + extension !== file.file_name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px] dark:bg-neutral-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rename File
          </DialogTitle>
          <DialogDescription>
            Enter a new name for <span className="font-medium">{file.file_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="filename-input" className="text-sm font-medium">
              File Name
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="filename-input"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter file name"
                disabled={saving}
                className="flex-1"
                autoCorrect='off'
                autoFocus
              />
              {extension && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {extension}
                </span>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The file extension will be preserved automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges || !newName.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renaming...
              </>
            ) : (
              'Rename'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



import { useState, useEffect } from 'react';
import type { WorkspaceFile } from '@/types/workspace';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Code } from 'lucide-react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';

interface EditMetadataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: WorkspaceFile | null;
}

export function EditMetadataDialog({ isOpen, onClose, file }: EditMetadataDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) return;
    setError(null);
    setLoading(true);
    workspaceFilesApi.getWorkspaceFile(file.id, false)
      .then((fresh) => setValue(fresh.metadata ?? ''))
      .catch(() => setValue(file.metadata ?? ''))
      .finally(() => setLoading(false));
  }, [isOpen, file]);

  const handleSave = async () => {
    if (!file) return;
    const trimmed = value.trim();
    if (trimmed && !isValidJson(trimmed)) { setError('Invalid JSON'); return; }

    setSaving(true);
    setError(null);
    try {
      await workspaceFilesApi.updateFileMetadata(file.id, trimmed || null);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metadata');
    } finally { setSaving(false); }
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-[500px] dark:bg-neutral-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Edit Metadata
          </DialogTitle>
          <DialogDescription>
            Raw JSON metadata for <span className="font-medium">{file.file_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <textarea
              data-testid="metadata-textarea"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              className="w-full h-48 rounded-md border bg-transparent px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder='{"key": "value"}'
              disabled={saving}
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isValidJson(str: string): boolean {
  try { JSON.parse(str); return true; } catch { return false; }
}

import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Link, Loader2 } from 'lucide-react';

interface AddFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowseFiles: () => void;
  onDownloadFromUrl: (url: string) => Promise<boolean>;
  isDownloading: boolean;
  urlError: string | null;
  onUrlErrorReset: () => void;
}

export function AddFileDialog({
  isOpen, onClose, onBrowseFiles, onDownloadFromUrl, isDownloading, urlError, onUrlErrorReset,
}: AddFileDialogProps) {
  const [url, setUrl] = useState('');

  const handleBrowse = () => { onBrowseFiles(); onClose(); };

  const handleImport = async () => {
    if (!url.trim() || isDownloading) return;
    const success = await onDownloadFromUrl(url);
    if (success) { setUrl(''); onClose(); }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (urlError) onUrlErrorReset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleImport(); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isDownloading && onClose()}>
      <DialogContent className="sm:max-w-[425px] dark:bg-neutral-950">
        <DialogHeader>
          <DialogTitle>Add File</DialogTitle>
          <DialogDescription>Add a file from your computer or import from a URL.</DialogDescription>
        </DialogHeader>

        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleBrowse}
          disabled={isDownloading}>
          <FolderOpen className="h-4 w-4" /> Browse Files
        </Button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="px-3 text-xs text-muted-foreground">or</span>
          <div className="flex-grow border-t border-border" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link className="h-3.5 w-3.5" /> Import from URL
          </div>
          <Input placeholder="Paste PDF URL..." value={url} onChange={handleUrlChange}
            onKeyDown={handleKeyDown} disabled={isDownloading} />
          {urlError && <div className="text-sm text-destructive">{urlError}</div>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDownloading}>Cancel</Button>
          <Button onClick={handleImport} disabled={!url.trim() || isDownloading}>
            {isDownloading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Importing...</> : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

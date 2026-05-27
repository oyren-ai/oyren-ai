import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { UpdateInfo } from '@/api/updaterApi';
import { CheckCircle, Loader2, ExternalLink, ChevronDown } from 'lucide-react';
import { browserApi } from '@/api/browserApi';

interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
}

export function UpdateDialog({ isOpen, onClose, updateInfo, isChecking }: UpdateDialogProps) {
  const [isWhatsChangedOpen, setIsWhatsChangedOpen] = React.useState(false);

  const handleDownload = async () => {
    try {
      await browserApi.openUrl('https://oyren.ai/download');
      onClose();
    } catch (error) {
      console.error('Failed to open download page:', error);
    }
  };

  const getDescription = () => {
    if (isChecking) return 'Please wait while we check for updates.';
    if (updateInfo?.available) return 'A new version is available!';
    return 'You are using the latest version.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isChecking ? 'Checking for Updates...' : 'Update Status'}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {isChecking && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isChecking && updateInfo && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Current version: <span className="font-medium">{updateInfo.current_version}</span></p>
              {updateInfo.latest_version && (
                <p>Latest version: <span className="font-medium">{updateInfo.latest_version}</span></p>
              )}
            </div>

            {updateInfo.whats_changed && updateInfo.available && (
              <Collapsible open={isWhatsChangedOpen} onOpenChange={setIsWhatsChangedOpen} className="space-y-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full rounded-md bg-muted p-3 text-sm font-medium hover:bg-muted/80 transition-colors">
                  <span>What's Changed in {updateInfo.latest_version}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isWhatsChangedOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{updateInfo.whats_changed}</p>
                </CollapsibleContent>
              </Collapsible>
            )}

            {!updateInfo.available && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Up to date!</span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Need help?{' '}
          <Button variant="link" className="h-auto p-0 text-xs" onClick={() => browserApi.openUrl('https://oyren.ai/report')}>
            Join our Discord
          </Button>
          {' '}for support.
        </p>

        <DialogFooter>
          {updateInfo?.available ? (
            <>
              <Button variant="outline" onClick={onClose}>Later</Button>
              <Button onClick={handleDownload}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Download
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

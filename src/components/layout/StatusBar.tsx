import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { FileText, ExternalLink } from 'lucide-react';
import { browserApi } from '@/api/browserApi';
import { useVersionCheck } from './hooks/useVersionCheck';
import { useUpdateListener } from './hooks/useUpdateListener';
import { UpdateDialog } from './UpdateDialog';

const getFileName = (path: string | null) => {
  if (!path) return null;
  return path.split(/[/\\]/).pop() || path;
};

export function StatusBar() {
  const { currentPdfPath } = useAppContext();
  const {
    version, loadVersion, isChecking, updateInfo,
    isNewUpdate, checkForUpdates, setUpdateInfoFromEvent, dismissUpdate,
  } = useVersionCheck();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => { void loadVersion(); }, [loadVersion]);

  const openDialog = useCallback(() => setIsUpdateDialogOpen(true), []);

  useUpdateListener({ isNewUpdate, setUpdateInfoFromEvent, openDialog });

  const fileName = currentPdfPath ? getFileName(currentPdfPath) : null;

  const handleReportClick = async () => {
    try { await browserApi.openUrl('https://oyren.ai/report'); }
    catch (error) { console.error('Failed to open report page:', error); }
  };

  const handleVersionClick = async () => {
    setIsUpdateDialogOpen(true);
    await checkForUpdates();
  };

  const handleCloseDialog = () => {
    if (updateInfo?.available && updateInfo.latest_version) {
      dismissUpdate(updateInfo.latest_version);
    }
    setIsUpdateDialogOpen(false);
  };

  return (
    <div className="h-6 bg-neutral-100 dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {fileName ? (
          <div className="flex items-center gap-2 max-w-[300px]" title={fileName}>
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">My PDF: {fileName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span>No PDF Selected</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleReportClick}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          title="Report an issue"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Report Issue</span>
        </button>

        <button
          onClick={handleVersionClick}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          title="Click to check for updates"
        >
          v{version}
          {updateInfo?.available && (
            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Update Available
            </span>
          )}
        </button>
      </div>

      <UpdateDialog
        isOpen={isUpdateDialogOpen}
        onClose={handleCloseDialog}
        updateInfo={updateInfo}
        isChecking={isChecking}
      />
    </div>
  );
}

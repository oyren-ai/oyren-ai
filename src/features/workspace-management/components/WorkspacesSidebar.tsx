import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Sidebar, SidebarContent, SidebarMenu, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarGroupAction } from "@/components/ui/sidebar";
import { useViewNavigation } from "@/contexts/NavigationContext";
import { Plus, Cloud, ChevronDown, ChevronRight, CloudDownload, Loader2 } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { DeleteFileDialog } from "./DeleteFileDialog";
import { RenameFileDialog } from "./RenameFileDialog";
import { CopyToWorkspaceDialog } from "./CopyToWorkspaceDialog";
import { AddFileDialog } from "./AddFileDialog";
import { DragDropZone } from "./DragDropZone";
import { CloudFilesPanel } from "./CloudFilesPanel";
import { useWorkspaceFiles } from "../hooks/useWorkspaceFiles";
import { useAddFileDialog } from "../hooks/useAddFileDialog";
import { useFileDropHandler } from "../hooks/useFileDropHandler";
import { useFileActions } from "../hooks/useFileActions";
import { useCloudFileRestore } from "../hooks/useCloudFileRestore";
import { useFileSyncActions } from "../hooks/useFileSyncActions";
import { usePullFromCloud } from "../hooks/usePullFromCloud";
import { organizeFilesIntoTree } from "../utils/organizeFilesIntoTree";
import { useDragDrop } from "../hooks/useDragDrop";
import { SidebarFileManagerTree } from "./SidebarFileManagerTree";
import { SidebarFooterMenu } from "./SidebarFooterMenu";
import { SidebarBrandHeader } from "./SidebarBrandHeader";
import { useMarkerConversion } from "../hooks/useMarkerConversion";
import { useConversionStatus } from "../hooks/useConversionStatus";
import { getConversionErrorMessage } from "../utils/workspacePdfConversion";
import { SidebarErrorBanner } from "./SidebarErrorBanner";
import { pdfPageCountStore } from "@/stores/pdfPageCountStore";

interface WorkspacesSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onFileClick?: (filePath: string, workspaceFileId: string) => void;
}

export function WorkspacesSidebar({ onFileClick, ...props }: WorkspacesSidebarProps) {
  const { selectedWorkspace, navigateToHome } = useViewNavigation();
  const { files, isLoading: loading } = useWorkspaceFiles(selectedWorkspace);
  const { currentPdfPath, setCurrentPdfPath, setCurrentWorkspaceFileId, closePdfTab } = useAppContext();
  const addFileDialog = useAddFileDialog(selectedWorkspace, setCurrentPdfPath, setCurrentWorkspaceFileId);
  const [error, setError] = React.useState<string | null>(null);
  const [cloudPanelOpen, setCloudPanelOpen] = React.useState(false);
  const { convertingFiles, error: conversionError, convertPdf } = useMarkerConversion({ workspaceId: selectedWorkspace?.id });
  const { hasConversion } = useConversionStatus(files);
  const fileActions = useFileActions({ currentPdfPath, closePdfTab, setError });
  const cloudRestore = useCloudFileRestore();
  const fileSyncActions = useFileSyncActions();
  const pullFromCloud = usePullFromCloud();
  const { handleFilesDropped } = useFileDropHandler({
    workspace: selectedWorkspace, setCurrentPdfPath, setCurrentWorkspaceFileId, setError,
  });
  const { isDragging } = useDragDrop({ workspace: selectedWorkspace, onFilesDropped: handleFilesDropped });

  const handleConvertPdf = React.useCallback(async (workspaceFileId: string) => {
    const file = files.find(f => f.id === workspaceFileId);
    if (file && !pdfPageCountStore.get(file.file_path)) {
      onFileClick?.(file.file_path, file.id);
      await new Promise((r) => setTimeout(r, 1500));
    }
    const pageCount = file ? pdfPageCountStore.get(file.file_path) : undefined;
    return convertPdf(workspaceFileId, pageCount);
  }, [files, convertPdf, onFileClick]);

  const fileTree = React.useMemo(() => organizeFilesIntoTree(files), [files]);
  const treeEntries = Object.entries(fileTree);

  // Resolve cloud UUID from sync state for the current workspace
  const [cloudUuid, setCloudUuid] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!selectedWorkspace?.id) return;
    invoke<{ workspaces: Record<string, { cloud_uuid: string }> }>('get_sync_state')
      .then((s) => setCloudUuid(s.workspaces[selectedWorkspace.id]?.cloud_uuid ?? null))
      .catch(() => setCloudUuid(null));
  }, [selectedWorkspace?.id]);

  // Load cloud files when panel is opened
  const handleOpenCloudPanel = React.useCallback(() => {
    const next = !cloudPanelOpen;
    setCloudPanelOpen(next);
    if (next && selectedWorkspace?.id && cloudUuid) {
      cloudRestore.loadDeletedFiles(selectedWorkspace.id, cloudUuid);
    }
  }, [cloudPanelOpen, selectedWorkspace?.id, cloudUuid, cloudRestore]);

  React.useEffect(() => {
    if (!conversionError) return;
    toast.error(getConversionErrorMessage(conversionError), { id: 'conversion-error' });
  }, [conversionError]);

  React.useEffect(() => { if (!error) return; const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }, [error]);

  const hasCloudSync = Boolean(cloudUuid);

  return (
    <Sidebar className="border-r-0 bg" role="complementary" data-testid="workspaces-sidebar" {...props}>
      {isDragging && <DragDropZone isDragging={isDragging} />}
      <SidebarBrandHeader onLogoClick={navigateToHome} />
      <SidebarContent>
        {/* ── Local Files ── */}
        <SidebarGroup>
          <div className="flex items-center px-2 pt-1 pb-0.5">
            <SidebarGroupLabel className="flex-1 px-0 py-0">Workspace Files</SidebarGroupLabel>
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Pull from cloud — only visible when workspace is linked */}
              {hasCloudSync && (
                <button
                  type="button"
                  title={pullFromCloud.status === 'pulling' ? 'Pulling from cloud…' : 'Pull new files from cloud'}
                  disabled={pullFromCloud.status === 'pulling'}
                  onClick={() => selectedWorkspace && void pullFromCloud.pull(selectedWorkspace).then((count) => {
                    if (count > 0) {
                      toast.success(`${count} file${count > 1 ? 's' : ''} pulled from cloud`);
                    } else {
                      toast.info('Already up to date');
                    }
                  }).catch(() => toast.error('Failed to pull from cloud'))}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors disabled:opacity-40"
                >
                  {pullFromCloud.status === 'pulling' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudDownload className="w-3.5 h-3.5" />
                  )}
                  <span className="sr-only">Pull from cloud</span>
                </button>
              )}
              {/* Add file */}
              <button
                type="button"
                title="Add File"
                onClick={addFileDialog.openDialog}
                disabled={addFileDialog.isDownloading || fileActions.isMutating}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="sr-only">Add File</span>
              </button>
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarErrorBanner message={error} />
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading files...</div>
            ) : treeEntries.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <p className="mb-2">No files in workspace</p>
                <p className="text-xs opacity-70">Drop PDF(s) here or click + to add</p>
              </div>
            ) : (
              <SidebarMenu>
                {treeEntries.map(([name, node]) => (
                  <SidebarFileManagerTree key={name} displayNameOfFileOrFolder={name}
                    treeNodeContainingChildren={node} onFileClick={onFileClick}
                    activeFilePath={currentPdfPath} onFileDelete={fileActions.handleDeleteFile}
                    onFileRename={fileActions.handleRenameFile} onFileCopy={fileActions.handleCopyFile}
                    onCopyContent={fileActions.handleCopyContent} onConvertPdf={handleConvertPdf}
                    convertingFiles={convertingFiles} hasConversion={hasConversion}
                    isCloudLinked={hasCloudSync}
                    onUploadToCloud={(file) => cloudUuid && fileSyncActions.uploadFile(file, cloudUuid)}
                    uploadingFileIds={fileSyncActions.uploadingIds} />
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Cloud Files (restore) — only shown when workspace is synced ── */}
        {hasCloudSync && (
          <SidebarGroup>
            <button
              type="button"
              className="flex items-center gap-1.5 w-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleOpenCloudPanel}
              aria-expanded={cloudPanelOpen}
            >
              {cloudPanelOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <Cloud className="w-3.5 h-3.5" />
              Cloud Files
            </button>
            {cloudPanelOpen && (
              <SidebarGroupContent>
                <CloudFilesPanel
                  deletedLocalFiles={cloudRestore.deletedLocalFiles}
                  cloudOnlyFiles={cloudRestore.cloudOnlyFiles}
                  status={cloudRestore.status}
                  error={cloudRestore.error}
                  onRestore={({ localFile, cloudFile }) =>
                    cloudRestore.restoreFile({
                      workspaceId: selectedWorkspace!.id,
                      cloudUuid: cloudUuid!,
                      localFile,
                      cloudFile,
                    })
                  }
                  onRefresh={() =>
                    cloudRestore.loadDeletedFiles(selectedWorkspace!.id, cloudUuid!)
                  }
                />
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <DeleteFileDialog isOpen={fileActions.deleteDialogOpen} onClose={fileActions.closeDeleteDialog}
        file={fileActions.selectedFile} onConfirm={fileActions.handleDeleteConfirm} />
      <RenameFileDialog isOpen={fileActions.renameDialogOpen} onClose={fileActions.closeRenameDialog}
        file={fileActions.selectedFile} onConfirm={fileActions.handleRenameConfirm} />
      <CopyToWorkspaceDialog isOpen={fileActions.copyDialogOpen} onClose={fileActions.closeCopyDialog}
        file={fileActions.selectedFile} currentWorkspaceId={selectedWorkspace?.id} />
      <AddFileDialog isOpen={addFileDialog.isOpen} onClose={addFileDialog.closeDialog}
        onBrowseFiles={addFileDialog.handleBrowseFiles} onDownloadFromUrl={addFileDialog.handleDownloadFromUrl}
        isDownloading={addFileDialog.isDownloading} urlError={addFileDialog.urlError}
        onUrlErrorReset={addFileDialog.resetUrlError} />
      <SidebarFooterMenu />
    </Sidebar>
  );
}

import { useState } from "react";
import {
  Trash2, Edit, FileOutput, Loader2, MoreHorizontal, Copy, Code, ClipboardCopy,
  Cloud, CloudUpload,
} from "lucide-react";
import type { WorkspaceFile } from "@/types/workspace";
import isPdfFile from "../utils/isPdfFile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditMetadataDialog } from "./EditMetadataDialog";

interface FileNodeActionsProps {
  fileData: WorkspaceFile;
  onFileDelete?: (file: WorkspaceFile) => void;
  onFileRename?: (file: WorkspaceFile) => void;
  onFileCopy?: (file: WorkspaceFile) => void;
  onCopyContent?: (file: WorkspaceFile) => void;
  onConvertPdf?: (workspaceFileId: string) => void;
  isConverting?: boolean;
  showConvertButton?: boolean;
  /** True when this workspace is linked to a cloud workspace. */
  isCloudLinked?: boolean;
  /** Called when the user clicks "Upload to cloud" for a local-only file. */
  onUploadToCloud?: (file: WorkspaceFile) => void;
  /** True while this specific file is being uploaded. */
  isUploading?: boolean;
}

export function FileNodeActions({
  fileData, onFileDelete, onFileRename, onFileCopy, onCopyContent,
  onConvertPdf, isConverting, showConvertButton,
  isCloudLinked, onUploadToCloud, isUploading,
}: FileNodeActionsProps) {
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);

  if (isConverting) return null;

  const isSynced = Boolean(fileData.sync_id);
  const canUpload = isCloudLinked && !isSynced && Boolean(onUploadToCloud);

  return (
    <>
      {/*
        Cloud status badge — shown at rest, fades when the hover menu appears.
        Synced  → solid blue Cloud icon
        Uploadable (linked, not yet uploaded) → muted CloudUpload icon
      */}
      {(isSynced || canUpload) && (
        <span
          className={[
            "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
            "transition-opacity group-hover/menu-item:opacity-0",
            isSynced
              ? "text-blue-400 dark:text-blue-500"
              : "text-muted-foreground/40",
          ].join(" ")}
          title={isSynced ? "Synced with cloud" : "Not yet uploaded to cloud"}
        >
          {isUploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isSynced ? (
            <Cloud className="w-3 h-3" />
          ) : (
            <CloudUpload className="w-3 h-3" />
          )}
        </span>
      )}

      {/* Actions — hidden at rest, shown on hover */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/menu-item:opacity-100 transition-opacity flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="file-actions-trigger"
              className="p-1.5 rounded-md hover:bg-accent/80 hover:text-accent-foreground text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
              title="File actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="min-w-[11rem] py-1">

            {/* Upload to cloud — only for local-only files when workspace is linked */}
            {canUpload && (
              <>
                <DropdownMenuItem
                  data-testid="upload-to-cloud-btn"
                  className="gap-2 text-blue-600 dark:text-blue-400 focus:text-blue-700 dark:focus:text-blue-300 focus:bg-blue-500/10"
                  onClick={() => onUploadToCloud?.(fileData)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4 shrink-0" />
                  )}
                  {isUploading ? "Uploading…" : "Upload to cloud"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Synced label (informational) */}
            {isSynced && (
              <>
                <DropdownMenuItem disabled className="gap-2 opacity-60 focus:opacity-60 focus:bg-transparent cursor-default">
                  <Cloud className="w-4 h-4 shrink-0 text-blue-400" />
                  In cloud
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {showConvertButton && isPdfFile(fileData.file_name) && (
              <>
                <DropdownMenuItem
                  data-testid="convert-pdf-btn"
                  className="gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300 focus:bg-emerald-500/10"
                  onClick={() => onConvertPdf?.(fileData.id)}
                >
                  <FileOutput className="w-4 h-4 shrink-0" />
                  Convert to Markdown
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem data-testid="rename-file-btn" className="gap-2" onClick={() => onFileRename?.(fileData)}>
              <Edit className="w-4 h-4 shrink-0" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="copy-file-btn" className="gap-2" onClick={() => onFileCopy?.(fileData)}>
              <Copy className="w-4 h-4 shrink-0" />
              Copy to Workspace
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="copy-content-btn" onClick={() => onCopyContent?.(fileData)}>
              <ClipboardCopy className="w-4 h-4" />
              Copy Content
            </DropdownMenuItem>
            {import.meta.env.DEV && (
              <DropdownMenuItem data-testid="edit-metadata-btn" className="gap-2" onClick={() => setMetadataDialogOpen(true)}>
                <Code className="w-4 h-4 shrink-0" />
                Edit Metadata
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="delete-file-btn"
              className="gap-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-500/10"
              onClick={() => onFileDelete?.(fileData)}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              {isSynced ? 'Remove local copy' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditMetadataDialog
        isOpen={metadataDialogOpen}
        onClose={() => setMetadataDialogOpen(false)}
        file={fileData}
      />
    </>
  );
}

import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar.tsx";
import PdfIcon from "@/components/icons/PdfIcon.tsx";
import { File, NotebookText, ScanText } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { WorkspaceFile } from "@/types/workspace";
import isPdfFile from "../utils/isPdfFile";

import { categorizeWorkspaceFile } from "../utils/categorizeWorkspaceFile";
import { FileNodeActions } from "./FileNodeActions";
import { ConversionProgressBar } from "./ConversionProgressBar";

const normalizePath = (path?: string | null) => (path ?? "").replace(/\\/g, "/");

interface SidebarFileManagerFileNodeProps {
    name: string;
    filePath?: string;
    fileData?: WorkspaceFile;
    onFileClick?: (filePath: string, workspaceFileId: string) => void;
    activeFilePath?: string | null;
    onFileDelete?: (file: WorkspaceFile) => void;
    onFileRename?: (file: WorkspaceFile) => void;
    onFileCopy?: (file: WorkspaceFile) => void;
    onCopyContent?: (file: WorkspaceFile) => void;
    onConvertPdf?: (workspaceFileId: string) => void;
    convertingFiles?: Map<string, number>;
    hasConversion?: (pdfFileId: string) => boolean;
    /** True when the workspace is linked to a cloud workspace. */
    isCloudLinked?: boolean;
    /** Called to upload a single file to cloud. */
    onUploadToCloud?: (file: WorkspaceFile) => void;
    /** Set of file IDs currently uploading. */
    uploadingFileIds?: Set<string>;
}

export default function SidebarFileManagerFileNode({
    name, filePath, fileData, onFileClick, activeFilePath,
    onFileDelete, onFileRename, onFileCopy, onCopyContent, onConvertPdf, convertingFiles, hasConversion,
    isCloudLinked, onUploadToCloud, uploadingFileIds,
}: SidebarFileManagerFileNodeProps) {

    const normalizedActivePath = React.useMemo(() => normalizePath(activeFilePath), [activeFilePath]);
    const isActive = normalizedActivePath !== "" && normalizePath(filePath) === normalizedActivePath;
    const conversionProgress = convertingFiles?.get(fileData?.id ?? '');
    const isConverting = conversionProgress !== undefined;
    const showConvertButton = !!(fileData && isPdfFile(name) && !hasConversion?.(fileData.id));

    const handleClick = () => {
        if (onFileClick && filePath && fileData?.id) {
            onFileClick(filePath, fileData.id);
        }
    };

    const category = fileData ? categorizeWorkspaceFile(fileData) : null;
    const fileIcon = isPdfFile(name) ? <PdfIcon size={16} /> :
        category === 'Scans' ? <ScanText className="w-4 h-4" /> :
        category === 'Notes' ? <NotebookText className="w-4 h-4" /> :
        <File className="w-4 h-4" />;

    return (
        <SidebarMenuItem data-has-file-data={!!fileData} className="relative group/menu-item">
            <SidebarMenuButton
                data-testid={`file-node-${name}`}
                className={cn(
                    "data-[active=true]:border data-[active=true]:bg-blue-100/80 data-[active=true]:text-blue-900 data-[active=true]:border-blue-300",
                    "dark:data-[active=true]:bg-blue-500/10 dark:data-[active=true]:text-blue-100 dark:data-[active=true]:border-blue-500/50",
                    "hover:text-neutral-800 dark:hover:text-neutral-200",
                    fileData && "pr-8"
                )}
                isActive={isActive}
                title={name}
                onClick={handleClick}
            >
                {fileIcon}
                <span className="truncate flex-1 min-w-0">{name}</span>
                {isConverting && (
                    <span className="shrink-0 w-8 h-1 rounded-full overflow-hidden bg-emerald-500/20 dark:bg-emerald-500/10" title="Converting to Markdown…">
                        <span className="sidebar-loading-strip block w-2/5 h-full rounded-full bg-emerald-500" />
                    </span>
                )}
            </SidebarMenuButton>
            {fileData && (
                <FileNodeActions
                    fileData={fileData}
                    onFileDelete={onFileDelete}
                    onFileRename={onFileRename}
                    onFileCopy={onFileCopy}
                    onCopyContent={onCopyContent}
                    onConvertPdf={onConvertPdf}
                    isConverting={isConverting}
                    showConvertButton={showConvertButton}
                    isCloudLinked={isCloudLinked}
                    onUploadToCloud={onUploadToCloud}
                    isUploading={uploadingFileIds?.has(fileData.id)}
                />
            )}
            {isConverting && conversionProgress !== undefined && (
                <ConversionProgressBar progress={conversionProgress} />
            )}
        </SidebarMenuItem>
    );
}

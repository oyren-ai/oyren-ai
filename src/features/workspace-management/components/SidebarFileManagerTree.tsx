import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarMenuSub, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { ChevronRight, Folder } from "lucide-react";
import SidebarFileManagerFileNode from "@/features/workspace-management/components/SidebarFileManagerFileNode.tsx";
import { SidebarFileManagerTreeNode, SidebarFileManagerTreeNodeType } from "@/types/tree";
import type { WorkspaceFile } from "@/types/workspace";

interface SidebarFileManagerTreeProps {
  displayNameOfFileOrFolder: string;
  treeNodeContainingChildren: SidebarFileManagerTreeNode;
  onFileClick?: (filePath: string, workspaceFileId: string) => void;
  activeFilePath?: string | null;
  onFileDelete?: (file: WorkspaceFile) => void;
  onFileRename?: (file: WorkspaceFile) => void;
  onFileCopy?: (file: WorkspaceFile) => void;
  onCopyContent?: (file: WorkspaceFile) => void;
  onConvertPdf?: (workspaceFileId: string) => void;
  convertingFiles?: Map<string, number>;
  hasConversion?: (pdfFileId: string) => boolean;
  isCloudLinked?: boolean;
  onUploadToCloud?: (file: WorkspaceFile) => void;
  uploadingFileIds?: Set<string>;
}

export function SidebarFileManagerTree({
  displayNameOfFileOrFolder,
  treeNodeContainingChildren,
  onFileClick,
  activeFilePath,
  onFileDelete,
  onFileRename,
  onFileCopy,
  onCopyContent,
  onConvertPdf,
  convertingFiles,
  hasConversion,
  isCloudLinked,
  onUploadToCloud,
  uploadingFileIds,
}: SidebarFileManagerTreeProps) {
  if (treeNodeContainingChildren.type === SidebarFileManagerTreeNodeType.File) {
    return (
      <SidebarFileManagerFileNode
        name={displayNameOfFileOrFolder}
        filePath={treeNodeContainingChildren.data?.file_path}
        fileData={treeNodeContainingChildren.data}
        onFileClick={onFileClick}
        activeFilePath={activeFilePath}
        onFileDelete={onFileDelete}
        onFileRename={onFileRename}
        onFileCopy={onFileCopy}
        onCopyContent={onCopyContent}
        onConvertPdf={onConvertPdf}
        convertingFiles={convertingFiles}
        hasConversion={hasConversion}
        isCloudLinked={isCloudLinked}
        onUploadToCloud={onUploadToCloud}
        uploadingFileIds={uploadingFileIds}
      />
    );
  }

  const children = treeNodeContainingChildren.children
    ? Object.entries(treeNodeContainingChildren.children)
    : [];

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="w-4 h-4 transition-transform" />
            <Folder className="w-4 h-4" />
            <span className="truncate">{displayNameOfFileOrFolder}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map(([childName, childNode]) => (
              <SidebarFileManagerTree
                key={childName}
                displayNameOfFileOrFolder={childName}
                treeNodeContainingChildren={childNode}
                onFileClick={onFileClick}
                activeFilePath={activeFilePath}
                onFileDelete={onFileDelete}
                onFileRename={onFileRename}
                onFileCopy={onFileCopy}
                onCopyContent={onCopyContent}
                onConvertPdf={onConvertPdf}
                convertingFiles={convertingFiles}
                hasConversion={hasConversion}
                isCloudLinked={isCloudLinked}
                onUploadToCloud={onUploadToCloud}
                uploadingFileIds={uploadingFileIds}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
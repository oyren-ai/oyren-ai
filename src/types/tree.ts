import type { WorkspaceFile } from "@/types/workspace";

export enum SidebarFileManagerTreeNodeType {
  File = 'file',
  Folder = 'folder'
}

export type SidebarFileManagerTreeNode =
  | { type: SidebarFileManagerTreeNodeType.File; data: WorkspaceFile }
  | { type: SidebarFileManagerTreeNodeType.Folder; children: Record<string, SidebarFileManagerTreeNode> };

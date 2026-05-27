import type { WorkspaceFile } from '@/types/workspace';
import { type SidebarFileManagerTreeNode, SidebarFileManagerTreeNodeType } from '@/types/tree';
import { type FileCategory, categorizeWorkspaceFile } from './categorizeWorkspaceFile';

const CATEGORY_ORDER: FileCategory[] = ['Documents', 'Scans', 'Notes', 'LatexNotes', 'Other'];

/** Display name for sidebar folder (e.g. "LatexNotes" → "LaTeX Notes") */
export const CATEGORY_DISPLAY_NAMES: Record<FileCategory, string> = {
  Documents: 'Documents',
  Scans: 'Scans',
  Notes: 'Notes',
  LatexNotes: 'LaTeX Notes',
  Other: 'Other',
};

/**
 * Organizes a flat list of workspace files into a tree grouped by category.
 * Categories: Documents (.pdf), Scans (.md with source_pdf_id), Notes (.md), LaTeX Notes (.tex), Other.
 */
export function organizeFilesIntoTree(files: WorkspaceFile[]): Record<string, SidebarFileManagerTreeNode> {
  const grouped: Record<FileCategory, WorkspaceFile[]> = {
    Documents: [], Scans: [], Notes: [], LatexNotes: [], Other: [],
  };

  files.forEach((file) => {
    if (!file || !file.file_name || !file.workspace_id) return;
    const category = categorizeWorkspaceFile(file);
    grouped[category].push(file);
  });

  const tree: Record<string, SidebarFileManagerTreeNode> = {};

  CATEGORY_ORDER.forEach((category) => {
    const categoryFiles = grouped[category];
    if (categoryFiles.length === 0) return;

    const children: Record<string, SidebarFileManagerTreeNode> = {};
    categoryFiles.forEach((file) => {
      children[file.file_name] = { type: SidebarFileManagerTreeNodeType.File, data: file };
    });

    const displayName = CATEGORY_DISPLAY_NAMES[category];
    tree[displayName] = { type: SidebarFileManagerTreeNodeType.Folder, children };
  });

  return tree;
}

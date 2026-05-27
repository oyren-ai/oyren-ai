import type { WorkspaceFile } from '@/types/workspace';

export type FileCategory = 'Documents' | 'Scans' | 'Notes' | 'LatexNotes' | 'Other';

export function categorizeWorkspaceFile(file: WorkspaceFile): FileCategory {
  const isPdf = file.file_name.toLowerCase().endsWith('.pdf');
  if (isPdf) return 'Documents';

  const isTex = file.file_name.toLowerCase().endsWith('.tex');
  if (isTex) return 'LatexNotes';

  const isMd = file.file_name.toLowerCase().endsWith('.md');
  if (isMd) {
    if (file.metadata) {
      try {
        const parsed = JSON.parse(file.metadata);
        if (parsed.source_pdf_id) return 'Scans';
      } catch { /* invalid JSON, treat as regular note */ }
    }
    return 'Notes';
  }

  return 'Other';
}

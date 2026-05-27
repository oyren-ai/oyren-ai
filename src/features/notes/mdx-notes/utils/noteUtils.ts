import type { WorkspaceFile } from '@/types/workspace';

export type NoteKind = 'markdown' | 'latex';

export function getNoteType(file: WorkspaceFile): NoteKind {
  if (file.file_name.toLowerCase().endsWith('.tex')) return 'latex';
  return 'markdown';
}

/**
 * Display name for a note (strips .md and .tex).
 */
export function getNoteName(file: WorkspaceFile): string {
  const parts = file.file_path.split('/');
  if (parts[parts.length - 1] === 'slides.md' && parts.length >= 2) {
    return parts[parts.length - 2] || 'Untitled';
  }
  if (file.file_name) {
    return file.file_name.replace(/\.(md|tex)$/i, '') || 'Untitled';
  }
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(md|tex)$/i, '') || 'Untitled';
}

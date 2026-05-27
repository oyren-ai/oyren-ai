import type { PdfHighlightColorId, PdfHighlightRecord } from './pdfHighlightTypes';
import { isPdfHighlightColorId } from './pdfHighlightTypes';

const STORAGE_PREFIX = 'oyren:pdfHighlights:v1:';

function storageKey(workspaceUuid: string | undefined, fileId: string): string {
  const ws = workspaceUuid?.trim() || 'local';
  return `${STORAGE_PREFIX}${ws}:${fileId}`;
}

function parseRecord(raw: unknown): PdfHighlightRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.text !== 'string') return null;
  if (!isPdfHighlightColorId(String(o.colorId))) return null;
  if (!Array.isArray(o.areas)) return null;
  const areas = o.areas.filter((a): a is PdfHighlightRecord['areas'][number] => {
    if (!a || typeof a !== 'object') return false;
    const x = a as Record<string, unknown>;
    return (
      typeof x.pageIndex === 'number' &&
      typeof x.left === 'number' &&
      typeof x.top === 'number' &&
      typeof x.width === 'number' &&
      typeof x.height === 'number'
    );
  });
  if (areas.length === 0) return null;
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString();
  return {
    id: o.id,
    text: o.text,
    colorId: o.colorId as PdfHighlightColorId,
    areas,
    createdAt,
  };
}

export function readPdfHighlights(
  workspaceUuid: string | undefined,
  fileId: string,
): PdfHighlightRecord[] {
  if (typeof window === 'undefined' || !fileId) return [];
  try {
    const raw = localStorage.getItem(storageKey(workspaceUuid, fileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseRecord).filter((x): x is PdfHighlightRecord => x !== null);
  } catch {
    return [];
  }
}

export function writePdfHighlights(
  workspaceUuid: string | undefined,
  fileId: string,
  highlights: PdfHighlightRecord[],
): void {
  if (typeof window === 'undefined' || !fileId) return;
  try {
    localStorage.setItem(storageKey(workspaceUuid, fileId), JSON.stringify(highlights));
  } catch {
    /* quota / private mode */
  }
}

import type { PdfHighlightColorId } from '@/lib/pdfHighlightTypes';

export const PDF_HIGHLIGHT_COLOR_OPTIONS: {
  id: PdfHighlightColorId;
  label: string;
  fill: string;
  accent: string;
}[] = [
  { id: 'yellow', label: 'Yellow', fill: 'rgba(251, 191, 36, 0.40)', accent: '#f59e0b' },
  { id: 'green', label: 'Green', fill: 'rgba(52, 211, 153, 0.40)', accent: '#10b981' },
  { id: 'blue', label: 'Blue', fill: 'rgba(96, 165, 250, 0.40)', accent: '#3b82f6' },
  { id: 'red', label: 'Red', fill: 'rgba(248, 113, 113, 0.40)', accent: '#ef4444' },
  { id: 'purple', label: 'Purple', fill: 'rgba(192, 132, 252, 0.40)', accent: '#a855f7' },
  { id: 'orange', label: 'Orange', fill: 'rgba(251, 146, 60, 0.40)', accent: '#f97316' },
];

export function pdfHighlightFill(colorId: PdfHighlightColorId): string {
  return (
    PDF_HIGHLIGHT_COLOR_OPTIONS.find((c) => c.id === colorId)?.fill ??
    PDF_HIGHLIGHT_COLOR_OPTIONS[0].fill
  );
}

export function pdfHighlightAccent(colorId: PdfHighlightColorId): string {
  return (
    PDF_HIGHLIGHT_COLOR_OPTIONS.find((c) => c.id === colorId)?.accent ??
    PDF_HIGHLIGHT_COLOR_OPTIONS[0].accent
  );
}

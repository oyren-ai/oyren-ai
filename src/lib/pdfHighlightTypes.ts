/**
 * Serializable highlight geometry (matches @react-pdf-viewer/highlight `HighlightArea` — percentages on page).
 */
export interface PdfHighlightArea {
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export type PdfHighlightColorId = 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange';

export interface PdfHighlightRecord {
  id: string;
  text: string;
  colorId: PdfHighlightColorId;
  areas: PdfHighlightArea[];
  createdAt: string;
}

export function isPdfHighlightColorId(v: string): v is PdfHighlightColorId {
  return (
    v === 'yellow' ||
    v === 'green' ||
    v === 'blue' ||
    v === 'red' ||
    v === 'purple' ||
    v === 'orange'
  );
}

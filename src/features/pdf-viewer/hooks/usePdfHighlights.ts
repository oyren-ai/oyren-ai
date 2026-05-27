import { useCallback, useEffect, useState } from 'react';
import type { HighlightArea } from '@react-pdf-viewer/highlight';
import type { PdfHighlightColorId, PdfHighlightRecord } from '@/lib/pdfHighlightTypes';
import { readPdfHighlights, writePdfHighlights } from '@/lib/pdfHighlightStorage';

export function usePdfHighlights(workspaceUuid: string | undefined, fileId: string | null) {
  const [highlights, setHighlights] = useState<PdfHighlightRecord[]>([]);

  useEffect(() => {
    if (!fileId) {
      setHighlights([]);
      return;
    }
    setHighlights(readPdfHighlights(workspaceUuid, fileId));
  }, [workspaceUuid, fileId]);

  const addHighlight = useCallback(
    (text: string, areas: HighlightArea[], colorId: PdfHighlightColorId) => {
      if (!fileId || areas.length === 0) return;
      const record: PdfHighlightRecord = {
        id: crypto.randomUUID(),
        text: text.trim() || '(empty selection)',
        colorId,
        areas: areas.map((a) => ({
          pageIndex: a.pageIndex,
          left: a.left,
          top: a.top,
          width: a.width,
          height: a.height,
        })),
        createdAt: new Date().toISOString(),
      };
      setHighlights((prev) => {
        const next = [...prev, record];
        writePdfHighlights(workspaceUuid, fileId, next);
        return next;
      });
    },
    [fileId, workspaceUuid],
  );

  const updateHighlightColor = useCallback(
    (id: string, colorId: PdfHighlightColorId) => {
      if (!fileId) return;
      setHighlights((prev) => {
        const next = prev.map((h) => (h.id === id ? { ...h, colorId } : h));
        writePdfHighlights(workspaceUuid, fileId, next);
        return next;
      });
    },
    [fileId, workspaceUuid],
  );

  const removeHighlight = useCallback(
    (id: string) => {
      if (!fileId) return;
      setHighlights((prev) => {
        const next = prev.filter((h) => h.id !== id);
        writePdfHighlights(workspaceUuid, fileId, next);
        return next;
      });
    },
    [fileId, workspaceUuid],
  );

  const primaryArea = useCallback((h: PdfHighlightRecord): HighlightArea | null => {
    const a = h.areas[0];
    if (!a) return null;
    return {
      pageIndex: a.pageIndex,
      left: a.left,
      top: a.top,
      width: a.width,
      height: a.height,
    };
  }, []);

  return {
    highlights,
    addHighlight,
    updateHighlightColor,
    removeHighlight,
    primaryArea,
  };
}

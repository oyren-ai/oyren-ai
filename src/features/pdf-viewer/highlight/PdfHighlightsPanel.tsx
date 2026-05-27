import { useState, useMemo } from 'react';
import { Highlighter, Trash2, X } from 'lucide-react';
import type { PdfHighlightColorId, PdfHighlightRecord } from '@/lib/pdfHighlightTypes';
import { PDF_HIGHLIGHT_COLOR_OPTIONS, pdfHighlightAccent } from './pdfHighlightColors';

interface PdfHighlightsPanelProps {
  highlights: PdfHighlightRecord[];
  onJump: (h: PdfHighlightRecord) => void;
  onChangeColor: (id: string, colorId: PdfHighlightColorId) => void;
  onDelete: (id: string) => void;
  embedded?: boolean;
}

export function PdfHighlightsPanel({
  highlights,
  onJump,
  onChangeColor,
  onDelete,
  embedded,
}: PdfHighlightsPanelProps) {
  const [activeColors, setActiveColors] = useState<Set<PdfHighlightColorId>>(new Set());

  const usedColors = useMemo(
    () => PDF_HIGHLIGHT_COLOR_OPTIONS.filter((c) => highlights.some((h) => h.colorId === c.id)),
    [highlights],
  );

  const filtered = useMemo(
    () =>
      activeColors.size === 0 ? highlights : highlights.filter((h) => activeColors.has(h.colorId)),
    [highlights, activeColors],
  );

  const toggleColor = (id: PdfHighlightColorId) => {
    setActiveColors((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearFilters = () => setActiveColors(new Set());

  const isFiltered = activeColors.size > 0;

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${embedded ? '' : 'p-2'}`}>
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <Highlighter className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
          {isFiltered ? (
            <>
              <span className="text-neutral-900 dark:text-neutral-100">{filtered.length}</span>
              <span className="text-neutral-400 dark:text-neutral-500"> / {highlights.length}</span>
            </>
          ) : (
            <>
              {highlights.length} highlight{highlights.length === 1 ? '' : 's'}
            </>
          )}
        </span>
      </div>

      {usedColors.length >= 2 && (
        <div className="flex items-center gap-1.5 border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          {usedColors.map((c) => {
            const on = activeColors.has(c.id);
            const count = highlights.filter((h) => h.colorId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                title={`${c.label} (${count})`}
                aria-pressed={on}
                onClick={() => toggleColor(c.id)}
                className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                style={{
                  backgroundColor: c.accent,
                  boxShadow: on ? `0 0 0 2px white, 0 0 0 3.5px ${c.accent}` : undefined,
                }}
              >
                <span
                  className="pointer-events-none absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-white px-0.5 text-[8px] font-bold leading-none text-neutral-700 shadow dark:bg-neutral-800 dark:text-neutral-200"
                  style={{ display: on ? 'flex' : undefined }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              title="Clear filter"
              className="ml-auto flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <X className="h-2.5 w-2.5" />
              Clear
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2 custom-scrollbar">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <Highlighter className="h-6 w-6 text-neutral-300 dark:text-neutral-600" />
            <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-500">
              Select text in the PDF and click a color to create a highlight.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <p className="text-[11px] text-neutral-500 dark:text-neutral-500">
              No highlights match the selected color{activeColors.size > 1 ? 's' : ''}.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] text-neutral-400 underline hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              Clear filter
            </button>
          </div>
        ) : (
          filtered.map((h) => {
            const page = (h.areas[0]?.pageIndex ?? 0) + 1;
            const preview = h.text.length > 140 ? `${h.text.slice(0, 140)}…` : h.text;
            const accent = pdfHighlightAccent(h.colorId);
            return (
              <div
                key={h.id}
                className="group overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/60"
                style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
              >
                <button
                  type="button"
                  className="w-full px-2.5 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                  onClick={() => onJump(h)}
                  title="Scroll to highlight"
                >
                  <span className="mb-0.5 block text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    Page {page}
                  </span>
                  <span className="line-clamp-2 text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {preview}
                  </span>
                </button>

                <div className="flex items-center justify-between border-t border-neutral-100 px-2.5 py-1.5 dark:border-neutral-700/50">
                  <div className="flex items-center gap-1" role="group" aria-label="Change color">
                    {PDF_HIGHLIGHT_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.label}
                        aria-label={`${c.label}${h.colorId === c.id ? ' (current)' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeColor(h.id, c.id);
                        }}
                        className="h-4 w-4 shrink-0 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.accent,
                          borderColor: h.colorId === c.id ? '#000' : 'transparent',
                          outline: h.colorId === c.id ? '2px solid rgba(255,255,255,0.9)' : undefined,
                          outlineOffset: h.colorId === c.id ? '-3px' : undefined,
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="rounded p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    aria-label="Delete highlight"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(h.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

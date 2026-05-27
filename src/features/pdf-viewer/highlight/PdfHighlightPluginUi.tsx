import { useEffect, useRef, type MutableRefObject } from 'react';
import { Sparkles } from 'lucide-react';
import type {
  HighlightArea,
  RenderHighlightContentProps,
  RenderHighlightTargetProps,
} from '@react-pdf-viewer/highlight';
import type { PdfHighlightColorId } from '@/lib/pdfHighlightTypes';
import { PDF_HIGHLIGHT_COLOR_OPTIONS } from './pdfHighlightColors';

function popoverStyle(selectionRegion: RenderHighlightTargetProps['selectionRegion']) {
  const { left, top, height } = selectionRegion;
  return {
    position: 'absolute' as const,
    left: `${left}%`,
    top: `${top + height}%`,
    transform: 'translate(0, 8px)',
    zIndex: 50,
  };
}

/**
 * Step 1 — shown on text selection. Color swatch → transitions to HighlightContent.
 */
function HighlightTarget({
  pendingColorRef,
  ...props
}: RenderHighlightTargetProps & {
  pendingColorRef: MutableRefObject<PdfHighlightColorId>;
}) {
  return (
    <div
      style={popoverStyle(props.selectionRegion)}
      className="flex items-center gap-1.5 rounded-full border border-neutral-600 bg-[#1a1a1a] px-2.5 py-1.5 shadow-lg"
    >
      <span className="mr-0.5 text-[10px] font-medium text-neutral-500">Highlight</span>
      {PDF_HIGHLIGHT_COLOR_OPTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.label}
          className="h-5 w-5 shrink-0 rounded-full border-2 border-transparent transition-transform hover:scale-125"
          style={{ backgroundColor: c.accent }}
          onClick={() => {
            pendingColorRef.current = c.id;
            props.toggle();
          }}
        />
      ))}
      <button
        type="button"
        aria-label="Ask AI"
        title="Ask AI"
        className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('ask-ai', { detail: { text: props.selectedText } }),
          );
          props.cancel();
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Cancel"
        className="ml-0.5 text-base leading-none text-neutral-300 hover:text-white"
        onClick={() => props.cancel()}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Step 2 — commits highlight with chosen color then cancels (invisible bridge).
 */
function HighlightContent({
  pendingColorRef,
  onCommit,
  ...props
}: RenderHighlightContentProps & {
  pendingColorRef: MutableRefObject<PdfHighlightColorId>;
  onCommit: (areas: HighlightArea[], colorId: PdfHighlightColorId) => void;
}) {
  const committedRef = useRef(false);

  useEffect(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(props.highlightAreas, pendingColorRef.current);
    props.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commit once on mount
  }, []);

  return null;
}

export function usePdfHighlightRenderers(
  onCommit: (text: string, areas: HighlightArea[], colorId: PdfHighlightColorId) => void,
) {
  const pendingColorRef = useRef<PdfHighlightColorId>('yellow');
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const renderHighlightTarget = useRef((props: RenderHighlightTargetProps) => (
    <HighlightTarget {...props} pendingColorRef={pendingColorRef} />
  )).current;

  const renderHighlightContent = useRef((props: RenderHighlightContentProps) => (
    <HighlightContent
      {...props}
      pendingColorRef={pendingColorRef}
      onCommit={(areas, colorId) => onCommitRef.current(props.selectedText, areas, colorId)}
    />
  )).current;

  return { renderHighlightTarget, renderHighlightContent };
}

/**
 * LaTeX Viewer - Renders LaTeX source to HTML using latex.js
 * For full LaTeX documents (e.g. \documentclass, \section) and note-taking → LaTeX use cases.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { parse, HtmlGenerator } from 'latex.js';

const LATEX_JS_CDN_BASE = 'https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist';
/** Fallback KaTeX CSS so math (e.g. superscripts) always has styles even if latex.js injection fails */
const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';

export interface LatexViewerProps {
  /** LaTeX source (full document or fragment without preamble) */
  latex: string;
  className?: string;
  /** Disable hyphenation (default: true for simpler rendering) */
  hyphenate?: boolean;
}

export default function LatexViewer({
  latex,
  className = '',
  hyphenate = false,
}: LatexViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Nodes we inject into document.head (latex.js styles/scripts + fallback KaTeX CSS) for cleanup */
  const headNodesRef = useRef<HTMLElement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerReady, setContainerReady] = useState(false);

  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    setContainerReady(!!el);
  }, []);

  useEffect(() => {
    if (!latex || !latex.trim()) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);
    if (!containerReady) setLoading(true);

    try {
      const generator = new HtmlGenerator({ hyphenate });
      parse(latex, { generator });
      if (cancelled) return;

      const fragment = generator.domFragment();
      const styleNodes = generator.stylesAndScripts(LATEX_JS_CDN_BASE);

      if (!containerRef.current) {
        if (!cancelled) setLoading(false);
        return;
      }
      const container = containerRef.current;

      const contentWrap = document.createElement('div');
      contentWrap.className = 'latex-viewer-content';
      contentWrap.setAttribute('data-latexjs', 'content');
      contentWrap.appendChild(fragment);

      // Inject latex.js styles/scripts into document.head so they apply globally (fixes KaTeX math styling)
      const headNodes: HTMLElement[] = [];
      while (styleNodes.firstChild) {
        const node = styleNodes.firstChild as HTMLElement;
        document.head.appendChild(node);
        headNodes.push(node);
      }
      // Fallback KaTeX CSS so math (superscripts, etc.) always renders correctly (shared; do not remove on unmount)
      if (!document.querySelector(`link[href="${KATEX_CSS_URL}"]`)) {
        const katexLink = document.createElement('link');
        katexLink.rel = 'stylesheet';
        katexLink.href = KATEX_CSS_URL;
        document.head.appendChild(katexLink);
      }
      headNodesRef.current = headNodes;

      container.innerHTML = '';
      container.appendChild(contentWrap);

      if (!cancelled) setError(null);
    } catch (err: unknown) {
      if (!cancelled) {
        const raw = err instanceof Error ? err.message : 'LaTeX render failed';
        const looksLikeMarkdown =
          /#|paragraph break|but ".*" found/i.test(raw) ||
          (/^[#*\-]|^\d+\.\s/m.test(latex.trim()) && !latex.includes('\\'));
        const hasMathDelimiters = /\$|\\\(|\\\[/.test(latex);
        const isUnsupportedDocumentClass =
          /documentclass|document class|class.*not found|unknown class/i.test(raw) ||
          /error loading documentclass/i.test(raw);

        let message: string;
        if (isUnsupportedDocumentClass) {
          message =
            'This application only supports standard LaTeX classes (article, report, book). ' +
            'Use \\documentclass{article} (or report/book) for preview; to get the full template, use TeX Live or Overleaf.';
        } else if (looksLikeMarkdown) {
          message = hasMathDelimiters
            ? 'Mathematical formulas ($...$ and $$...$$) are displayed in Markdown. Switch to Markdown to view it.'
            : 'This content looks like Markdown, not LaTeX. Use the Markdown tab to view it.';
        } else {
          message = raw;
        }
        setError(message);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
      headNodesRef.current.forEach((node) => {
        if (node.parentNode === document.head) document.head.removeChild(node);
      });
      headNodesRef.current = [];
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [latex, hyphenate, containerReady]);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-border bg-muted/30 ${className}`}
        role="alert"
      >
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}
        aria-busy
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Rendering LaTeX…</p>
      </div>
    );
  }

  if (!latex || !latex.trim()) {
    return (
      <div
        className={`flex items-center justify-center p-6 text-muted-foreground text-sm ${className}`}
      >
        No LaTeX content
      </div>
    );
  }

  return (
    <div
      ref={setContainerRef}
      className={`latex-viewer overflow-x-auto custom-scrollbar ${className}`}
      data-testid="latex-viewer"
    />
  );
}

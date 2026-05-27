import React, { useState, useEffect, useMemo } from 'react';
import { MDXProvider } from '@mdx-js/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeMathjax from 'rehype-mathjax';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { convertFileSrc, isTauri } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import MdxErrorBoundary from './MdxErrorBoundary';

const AUTH_TOKEN_KEY = 'oyren_auth_token';

function isRelativeImageSrc(src: string | undefined): boolean {
  if (!src || typeof src !== 'string') return false;
  return !/^https?:\/\//i.test(src) && !/^data:/i.test(src);
}

/** True when imageBasePath is an OS path (Tauri workspace files), not a remote marker job prefix. */
function isAbsoluteFsPath(p: string | undefined): boolean {
  if (!p || typeof p !== 'string') return false;
  if (/^[A-Za-z]:[\\/]/.test(p)) return true;
  if (p.startsWith('\\\\')) return true;
  if (p.startsWith('/') && !p.startsWith('//')) return true;
  return false;
}

/** Resolves relative images: Tauri local disk → convertFileSrc; remote marker dir → authenticated fetch. */
function ResolvedImage({
  src,
  alt,
  imageBasePath,
  imageBaseUrl,
  className,
  ...props
}: {
  src?: string;
  alt?: string;
  imageBasePath?: string;
  imageBaseUrl?: string;
  className?: string;
  [k: string]: unknown;
}) {
  type Phase = 'loading' | 'ready' | 'error';
  const [phase, setPhase] = useState<Phase>('loading');
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    const finish = (url: string | null, next: Phase) => {
      if (cancelled) return;
      setDisplayUrl(url);
      setPhase(next);
    };

    if (!src) {
      finish(null, 'ready');
      return () => {
        cancelled = true;
      };
    }
    if (!isRelativeImageSrc(src)) {
      finish(src, 'ready');
      return () => {
        cancelled = true;
      };
    }

    const normalized = src.replace(/^\.\//, '').replace(/\\/g, '/');

    // Tauri: workspace markdown + files on disk → asset URL (no Next /api/marker/asset).
    if (isTauri() && imageBasePath && isAbsoluteFsPath(imageBasePath)) {
      setPhase('loading');
      (async () => {
        try {
          const abs = await join(imageBasePath, normalized);
          const assetUrl = convertFileSrc(abs);
          finish(assetUrl, 'ready');
        } catch {
          finish(null, 'error');
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (!imageBasePath || !imageBaseUrl) {
      finish(src, 'ready');
      return () => {
        cancelled = true;
      };
    }

    const fullPath = `${imageBasePath.replace(/[/\\]+$/, '')}/${normalized}`;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const url = `${imageBaseUrl}/api/marker/asset?path=${encodeURIComponent(fullPath)}`;

    setPhase('loading');
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Image load failed: ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        const created = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(created);
          return;
        }
        blobUrl = created;
        finish(blobUrl, 'ready');
      })
      .catch(() => {
        finish(null, 'error');
      });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src, imageBasePath, imageBaseUrl]);

  if (!src) {
    return null;
  }

  if (phase === 'loading') {
    return (
      <span
        className="inline-block h-40 max-w-full min-w-[10rem] rounded-md bg-muted/50 animate-pulse"
        aria-label="Loading image"
      />
    );
  }

  if (phase === 'error' || !displayUrl) {
    const shortAlt =
      alt && alt.length > 160 ? `${alt.slice(0, 157)}…` : alt || 'Image';
    return (
      <span className="inline-block max-w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground line-clamp-4">
        {shortAlt}
      </span>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt && alt.length > 500 ? `${alt.slice(0, 497)}…` : alt || 'Image'}
      className={className ?? 'max-w-full h-auto rounded-md my-2 border border-border shadow-sm'}
      loading="lazy"
      {...props}
    />
  );
}

interface MdxRendererProps {
  content: string;
  className?: string;
  /** Base path for resolving relative image URLs (e.g. dirname of markdown path). */
  imageBasePath?: string;
  /** API base URL for fetching marker assets (optional if only local Tauri paths). */
  imageBaseUrl?: string;
}

// Custom components for MDX rendering
const components = {
  // Headings
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl font-bold mb-2 mt-4 text-foreground border-b border-border pb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl font-semibold mb-1.5 mt-3 text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl font-semibold mb-1 mt-2.5 text-foreground" {...props}>
      {children}
    </h3>
  ),
  
  // Paragraph (compact spacing for chat/notes)
  p: ({ children, ...props }: any) => (
    <p className="mb-2 text-muted-foreground leading-7 text-[15px]" {...props}>
      {children}
    </p>
  ),
  
  // Lists (tighter vertical spacing)
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-2 space-y-1 ml-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-2 space-y-1 ml-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-muted-foreground leading-7" {...props}>
      {children}
    </li>
  ),
  
  // Blockquote
  blockquote: ({ children, ...props }: any) => (
    <blockquote 
      className="border-l-4 border-primary pl-4 py-2 mb-2 italic text-muted-foreground bg-muted/30 rounded-r-lg" 
      {...props}
    >
      {children}
    </blockquote>
  ),
  
  // Code
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    
    if (!inline && match) {
      return (
        <div className="mb-2">
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    return (
      <code 
        className="px-2 py-0.5 bg-muted rounded-md text-sm font-mono text-foreground border border-border" 
        {...props}
      >
        {children}
      </code>
    );
  },
  
  // Links
  a: ({ children, href, ...props }: any) => (
    <a 
      href={href}
      className="text-primary hover:underline underline-offset-4 font-medium"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  
  // Strong/Bold
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  
  // Emphasis/Italic
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  
  // Horizontal Rule
  hr: (props: any) => (
    <hr className="my-4 border-border" {...props} />
  ),

  // Image (default: direct src; overridden below when imageBasePath + imageBaseUrl provided)
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt || 'Image'}
      className="max-w-full h-auto rounded-md my-2 border border-border shadow-sm"
      loading="lazy"
      {...props}
    />
  ),

  // Table
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto mb-2 rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-border bg-background" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>{children}</tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-sm text-muted-foreground" {...props}>
      {children}
    </td>
  ),
};

const MdxRenderer: React.FC<MdxRendererProps> = ({
  content,
  className = '',
  imageBasePath,
  imageBaseUrl,
}) => {
  const componentsWithImages = useMemo(() => {
    // Use ResolvedImage whenever imageBasePath is provided — even without imageBaseUrl.
    // Tauri workspace files only supply imageBasePath (local disk path); ResolvedImage
    // handles that branch internally via isTauri() + convertFileSrc without needing
    // imageBaseUrl. The web/server marker path supplies both.
    if (imageBasePath) {
      return {
        ...components,
        img: ({ src, alt, ...props }: any) => (
          <ResolvedImage
            src={src}
            alt={alt}
            imageBasePath={imageBasePath}
            imageBaseUrl={imageBaseUrl}
            className="max-w-full h-auto rounded-md my-2 border border-border shadow-sm"
            {...props}
          />
        ),
      };
    }
    return components;
  }, [imageBasePath, imageBaseUrl]);

  return (
    <div className={`mdx-content ${className}`} data-testid="mdx-renderer">
      <style>{`
        /* Trim first/last block margins for neater AI response */
        .mdx-content > *:first-child { margin-top: 0; }
        .mdx-content > *:last-child { margin-bottom: 0; }
        /* Tighter paragraph spacing */
        .mdx-content p { margin-bottom: 0.5rem; }
        .mdx-content p:last-child { margin-bottom: 0; }
        /* Less gap between paragraph and list / between list items */
        .mdx-content ul, .mdx-content ol { margin-top: 0.375rem; margin-bottom: 0.375rem; }
        /* Inline math: no extra margin, align with text to avoid gaps */
        .mdx-content mjx-container:not([display="true"]) {
          margin: 0;
          padding: 0 1px;
          display: inline-block;
          vertical-align: middle;
        }
        .mdx-content mjx-container {
          font-size: 1.1em;
        }
        /* Display math: keep margin but tighter */
        .mdx-content mjx-container[display="true"] {
          margin: 0.4em 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .dark .mdx-content mjx-container {
          color: #e5e7eb;
        }
        /* Tighter spacing inside list items */
        .mdx-content li > p {
          margin: 0.2em 0;
        }
        .mdx-content li > p:first-child { margin-top: 0; }
        .mdx-content li > p:last-child { margin-bottom: 0; }
        .mdx-content li mjx-container[display="true"] {
          margin: 0.3em 0;
        }
        .mdx-content pre {
          margin: 0.5em 0;
          overflow-x: auto;
        }
        .mdx-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5em 0;
        }
        .mdx-content blockquote { margin: 0.5em 0; }
        .mdx-content table { margin: 0.5em 0; }
      `}</style>
      <MdxErrorBoundary fallbackContent={content}>
        <MDXProvider components={componentsWithImages}>
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeMathjax]}
            components={componentsWithImages}
          >
            {content}
          </ReactMarkdown>
        </MDXProvider>
      </MdxErrorBoundary>
    </div>
  );
};

export default MdxRenderer;

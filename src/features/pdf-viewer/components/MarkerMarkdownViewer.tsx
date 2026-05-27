/**
 * Marker Markdown Viewer - Displays Marker-generated Markdown content
 */

import { useState, useEffect } from 'react';
import MarkdownViewer from '@/features/notes/mdx-notes/MarkdownViewer';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { markerApi } from '@/api/markerApi';
import { getOyrenWebApiBaseUrl } from '@/api/oyrenWebApiBaseUrl';

interface MarkerMarkdownViewerProps {
  markdownPath: string;
  pdfFileName?: string;
  onClose?: () => void;
}

/**
 * Viewer component for Marker-generated Markdown content
 * Fetches markdown content from the backend and displays it
 */
export default function MarkerMarkdownViewer({
  markdownPath,
  pdfFileName,
  onClose,
}: MarkerMarkdownViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageBasePath, setImageBasePath] = useState<string>('');
  const [imageBaseUrl, setImageBaseUrl] = useState<string>('');

  useEffect(() => {
    // Fetch markdown content from backend
    const fetchMarkdown = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const API_BASE_URL = getOyrenWebApiBaseUrl();

        const token = localStorage.getItem('oyren_auth_token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Extract relative path from full path
        // markdownPath format: /path/to/marker-output/userId/jobId.md
        // We need: userId/jobId.md
        const pathParts = markdownPath.split(/[/\\]/);
        const markerOutputIndex = pathParts.findIndex(part => part === 'marker-output');
        const relativePath = markerOutputIndex >= 0 
          ? pathParts.slice(markerOutputIndex + 1).join('/')
          : markdownPath;

        const response = await fetch(
          `${API_BASE_URL}/api/marker/content?path=${encodeURIComponent(relativePath)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setContent(data.content || '');

        // Base path for resolving relative image URLs (dirname of the .md file)
        const dirname = relativePath.replace(/[/\\][^/\\]+$/, '').trim() || '';
        setImageBasePath(dirname);
        setImageBaseUrl(API_BASE_URL);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching markdown:', err);
        setError(err.message || 'Failed to load markdown content');
        setIsLoading(false);
      }
    };

    if (markdownPath) {
      fetchMarkdown();
    }
  }, [markdownPath]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Markdown content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      {pdfFileName && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {pdfFileName.replace(/\.pdf$/i, '')} (Markdown)
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          )}
        </div>
      )}

      {/* Markdown Content */}
      <div className="flex-1 overflow-hidden">
        <MarkdownViewer
          content={content}
          isLoading={false}
          imageBasePath={imageBasePath || undefined}
          imageBaseUrl={imageBaseUrl || undefined}
        />
      </div>
    </div>
  );
}


/**
 * Button to open Marker-generated Markdown version of PDF
 */

import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markerApi } from '@/api/markerApi';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface MarkerMarkdownButtonProps {
  pdfFilePath: string;
}

/**
 * Button that shows Marker-generated Markdown version if available
 * Shows loading state while checking/processing
 */
export function MarkerMarkdownButton({ pdfFilePath }: MarkerMarkdownButtonProps) {
  const [jobStatus, setJobStatus] = useState<{ job: any; allJobs: any[] } | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { setCurrentMarkdown } = useAppContext();

  // Check if Marker job exists for this PDF (once per path; cache in markerApi limits repeated requests)
  useEffect(() => {
    if (!pdfFilePath) {
      setIsChecking(false);
      return;
    }
    let cancelled = false;
    setIsChecking(true);

    markerApi.getJobByFilePath(pdfFilePath)
      .then((result) => {
        if (!cancelled) {
          setJobStatus(result);
          setIsChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJobStatus({ job: null, allJobs: [] });
          setIsChecking(false);
        }
      });
    return () => { cancelled = true; };
  }, [pdfFilePath]);

  const handleOpenMarkdown = async () => {
    if (jobStatus?.job?.status === 'completed' && jobStatus.job.markdownPath) {
      const markdownPath = jobStatus.job.markdownPath;
      const pdfFileName = pdfFilePath.split(/[/\\]/).pop() || 'document.pdf';
      
      // Open markdown in viewer
      setCurrentMarkdown(markdownPath, pdfFileName);
    }
  };

  // Don't show button if still checking
  if (isChecking) {
    return null; // Don't show loading spinner in sidebar
  }

  // Show button only if markdown is available
  if (jobStatus?.job?.status === 'completed' && jobStatus.job.markdownPath) {
    return (
      <button
        type="button"
        data-testid="markdown-file-btn"
        title="Open Markdown version"
        className="p-1 rounded hover:bg-accent hover:text-accent-foreground bg-background/80 shadow-sm pointer-events-auto"
        onClick={(event) => {
          event.stopPropagation();
          handleOpenMarkdown();
        }}
      >
        <FileText className="w-3 h-3" />
      </button>
    );
  }

  // No markdown available
  return null;
}


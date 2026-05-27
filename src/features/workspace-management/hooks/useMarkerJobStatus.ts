/**
 * Hook to check Marker job status for a PDF file
 */

import { useState, useEffect } from 'react';
import { markerApi, type MarkerJobStatus } from '@/api/markerApi';

interface UseMarkerJobStatusResult {
  jobStatus: MarkerJobStatus | null;
  isLoading: boolean;
  error: string | null;
  hasMarkdown: boolean;
  markdownPath: string | null;
}

/**
 * Check if a Marker job exists for a PDF file
 * This checks the backend for any completed Marker jobs for the given PDF path
 */
export function useMarkerJobStatus(pdfFilePath: string | null): UseMarkerJobStatusResult {
  const [jobStatus, setJobStatus] = useState<MarkerJobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfFilePath) {
      setJobStatus(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // For now, we'll need to check job status by file path
    // This requires a new API endpoint: GET /api/marker/jobs?filePath=...
    // For now, we'll return empty state
    // TODO: Implement API endpoint to get job by file path
    
    setIsLoading(false);
    setJobStatus(null);
  }, [pdfFilePath]);

  const hasMarkdown = jobStatus?.status === 'completed' && !!jobStatus.markdownPath;
  const markdownPath = jobStatus?.markdownPath || null;

  return {
    jobStatus,
    isLoading,
    error,
    hasMarkdown,
    markdownPath,
  };
}


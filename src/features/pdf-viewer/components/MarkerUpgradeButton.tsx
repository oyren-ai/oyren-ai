/**
 * Marker Upgrade Button - Button to upgrade PDF to Marker Markdown view
 * 
 * Key UX improvement: After submitting job, user is NOT blocked.
 * The button shows status indicator and allows user to continue working.
 * When job completes, a notification-style update appears.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { markerApi, type MarkerJobStatus } from '@/api/markerApi';

interface MarkerUpgradeButtonProps {
  pdfFilePath: string;
  onSuccess?: (markdownPath: string) => void;
  onError?: (error: string) => void;
}

type JobState = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

export default function MarkerUpgradeButton({
  pdfFilePath,
  onSuccess,
  onError,
}: MarkerUpgradeButtonProps) {
  const [jobState, setJobState] = useState<JobState>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsRequired, setCreditsRequired] = useState<number | null>(null);
  const [markdownPath, setMarkdownPath] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, []);

  // Background polling - non-blocking
  const startBackgroundPolling = useCallback((jobIdToPoll: string) => {
    // Clear any existing intervals
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    
    startTimeRef.current = Date.now();
    
    // Elapsed time counter
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Poll every 5 seconds (not blocking UI)
    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await markerApi.getJobStatus(jobIdToPoll);
        
        if (status.status === 'completed' && status.markdownPath) {
          // ✅ Job completed
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
          
          setJobState('completed');
          setMarkdownPath(status.markdownPath);
          setStatusText('Markdown ready!');
          window.dispatchEvent(new CustomEvent('credits-should-refresh'));
          if (onSuccess) onSuccess(status.markdownPath);
        } else if (status.status === 'failed') {
          // ❌ Job failed
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
          
          setJobState('failed');
          setError(status.error || 'Processing failed');
          
          if (onError) onError(status.error || 'Processing failed');
        }
        // else: still processing, continue polling
      } catch (err) {
        console.error('[MarkerUpgrade] Poll error:', err);
        // Don't stop polling on network errors - just retry
      }
    }, 5000); // Poll every 5 seconds
  }, [onSuccess, onError]);

  const handleUpgrade = async () => {
    setJobState('submitting');
    setError(null);
    setStatusText('Submitting...');
    setElapsedSeconds(0);

    try {
      // 1. Submit job to backend
      const result = await markerApi.processPdf(pdfFilePath);

      if (result.status === 'completed' && result.markdownPath) {
        // Already completed (cache hit)
        setJobState('completed');
        setMarkdownPath(result.markdownPath);
        setStatusText('Markdown ready!');
        window.dispatchEvent(new CustomEvent('credits-should-refresh'));
        if (onSuccess) onSuccess(result.markdownPath);
        return;
      }

      // 2. Job submitted - switch to background processing (credits already deducted)
      setJobId(result.jobId);
      setJobState('processing');
      setStatusText(`Submitted (${result.creditsDeducted} credits)`);
      window.dispatchEvent(new CustomEvent('credits-should-refresh'));
      
      // 3. Start non-blocking background poll
      startBackgroundPolling(result.jobId);
      
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to submit job';
      
      if (err.details) {
        errorMessage = `${errorMessage}: ${err.details}`;
      }
      
      setError(errorMessage);
      setJobState('failed');
      
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('credits')) {
        if (err.required) {
          setCreditsRequired(err.required);
        }
      }
      
      console.error('[MarkerUpgradeButton] Error:', err);
      if (onError) onError(errorMessage);
    }
  };

  const handleRetry = () => {
    setJobState('idle');
    setError(null);
    setStatusText(null);
    setCreditsRequired(null);
    setMarkdownPath(null);
    setJobId(null);
  };

  const handleDismiss = () => {
    setJobState('idle');
    setError(null);
    setStatusText(null);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ── COMPLETED STATE ──
  if (jobState === 'completed') {
    return (
      <button
        onClick={handleDismiss}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 transition-colors"
        title="Markdown ready! Click to dismiss"
      >
        <CheckCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Ready!</span>
      </button>
    );
  }

  // ── ERROR STATE ──
  if (jobState === 'failed') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors"
          title={error || 'Processing failed. Click to retry.'}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {creditsRequired ? `Need ${creditsRequired} credits` : 'Retry'}
          </span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          title="Dismiss error"
        >
          <X className="h-3 w-3 text-neutral-500" />
        </button>
      </div>
    );
  }

  // ── PROCESSING STATE (non-blocking!) - Clear loading UI (Vorashil: convert to markdown loading UI) ──
  if (jobState === 'processing' || jobState === 'submitting') {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-500/15 dark:bg-purple-500/20 border border-purple-300/50 dark:border-purple-500/30 text-purple-700 dark:text-purple-300"
        title="Converting to Markdown in the background. You can keep working."
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        <span className="hidden sm:inline text-xs">
          {jobState === 'submitting' ? 'Submitting…' : `Converting… ${formatTime(elapsedSeconds)}`}
        </span>
        <span className="sm:hidden text-xs">{jobState === 'submitting' ? '…' : formatTime(elapsedSeconds)}</span>
      </div>
    );
  }

  // ── IDLE STATE ──
  return (
    <button
      onClick={handleUpgrade}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95"
      title="Upgrade to Marker (High-quality Markdown conversion)"
    >
      <Sparkles className="h-4 w-4" />
      <span className="hidden sm:inline">Upgrade to Marker</span>
      <span className="sm:hidden">Marker</span>
    </button>
  );
}

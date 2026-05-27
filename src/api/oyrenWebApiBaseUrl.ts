/**
 * Base URL for oyren-ai-next (Marker, credits, workspace backup, etc.).
 * Override with VITE_OYREN_WEB_API_URL when Next.js runs on another host/port.
 */

export function getOyrenWebApiBaseUrl(): string {
  const raw = import.meta.env.VITE_OYREN_WEB_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return import.meta.env.DEV ? 'http://localhost:3000' : 'https://oyren.ai';
}

function devReachabilityHint(): string {
  return 'Start oyren-ai-next (e.g. pnpm dev, usually port 3000), or set VITE_OYREN_WEB_API_URL in .env to your API base URL.';
}

/** User-facing message when fetch fails (connection refused, offline, CORS, etc.). */
export function getOyrenWebApiConnectionErrorMessage(baseUrl: string): string {
  const hint = import.meta.env.DEV ? devReachabilityHint() : 'Check your network and try again.';
  return `Cannot reach the server at ${baseUrl}. ${hint}`;
}

export function normalizeOyrenWebFetchError(err: unknown, baseUrl: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    err instanceof TypeError ||
    msg.includes('Failed to fetch') ||
    msg.includes('Load failed') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed')
  ) {
    return getOyrenWebApiConnectionErrorMessage(baseUrl);
  }
  return msg;
}

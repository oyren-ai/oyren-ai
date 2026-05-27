
/**
 * Marker API Client - Handles Marker PDF processing API calls to Next.js backend
 */

import { getOyrenWebApiBaseUrl } from '@/api/oyrenWebApiBaseUrl';

/** Base URL for Marker/PDF-scan API (used by Tauri convert_pdf_with_marker). */
export function getMarkerApiBaseUrl(): string {
  return getOyrenWebApiBaseUrl();
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('oyren_auth_token')
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('Not authenticated. Please log in.')
  }

  const url = `${getOyrenWebApiBaseUrl()}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    
    // Handle specific error codes
    if (response.status === 402) {
      // Payment Required - Insufficient credits
      throw new Error(error.error || 'Insufficient credits')
    }
    
    if (response.status === 401) {
      throw new Error('Unauthorized. Please log in.')
    }
    
    throw new Error(error.error || `API request failed: ${response.statusText}`)
  }

  return response.json()
}

// ============================================
// TYPES
// ============================================

export interface ProcessPdfRequest {
  filePath: string
}

export interface ProcessPdfResponse {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  markdownPath?: string
  pageCount: number
  creditsDeducted: number
  error?: string
  message?: string
}

export interface MarkerJobStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  markdownPath?: string
  pageCount?: number
  creditsCost?: number
  error?: string
  fileName?: string
  dateCreated: string
  dateCompleted?: string
}

/** Result of converting a workspace PDF to Markdown via backend */
export interface ConversionResult {
  markdown_file_id: string
  markdown_file_path: string
  markdown_file_name: string
  image_count: number
}

// ============================================
// API FUNCTIONS
// ============================================

export const markerApi = {
  /**
   * Convert workspace PDF to Markdown (backend creates/converts and returns file info).
   * Uses same auth as other API requests (Bearer token).
   */
  async convertPdf(
    workspaceId: string,
    workspaceFileId: string,
    _authToken: string,
    estimatedPages?: number
  ): Promise<ConversionResult> {
    return apiRequest<ConversionResult>('/api/marker/convert', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId,
        workspaceFileId,
        estimatedPages: estimatedPages ?? null,
      }),
    })
  },

  /**
   * Process PDF with Marker and convert to Markdown
   * @param filePath - Path to the PDF file
   * @returns Job information with status
   */
  async processPdf(filePath: string): Promise<ProcessPdfResponse> {
    return apiRequest<ProcessPdfResponse>('/api/marker/process', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    })
  },

  /**
   * Get Marker job status
   * @param jobId - Job UUID
   * @returns Current job status
   */
  async getJobStatus(jobId: string): Promise<MarkerJobStatus> {
    return apiRequest<MarkerJobStatus>(`/api/marker/status/${jobId}`)
  },

  /**
   * Poll job status until completion or failure
   * @param jobId - Job UUID
   * @param options - Polling options
   * @returns Final job status
   */
  async pollJobStatus(
    jobId: string,
    options: {
      interval?: number // Polling interval in ms (default: 2000)
      maxAttempts?: number // Maximum polling attempts (default: 150 = 5 minutes)
      onProgress?: (status: MarkerJobStatus) => void // Progress callback
    } = {}
  ): Promise<MarkerJobStatus> {
    const {
      interval = 2000, // 2 seconds
      maxAttempts = 150, // 5 minutes total
      onProgress,
    } = options

    let attempts = 0

    while (attempts < maxAttempts) {
      const status = await this.getJobStatus(jobId)

      if (onProgress) {
        onProgress(status)
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval))
      attempts++
    }

    // Timeout - return last status
    const lastStatus = await this.getJobStatus(jobId)
    return lastStatus
  },

  /**
   * Get Marker job by file path.
   * When backend is unavailable, returns empty result instead of throwing.
   * Results are cached per path for CACHE_TTL_MS to avoid repeated requests (e.g. sidebar re-renders).
   */
  async getJobByFilePath(filePath: string): Promise<{ job: MarkerJobStatus | null; allJobs: MarkerJobStatus[] }> {
    const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
    const EMPTY_CACHE_TTL_MS = 30 * 1000 // 30s for empty/error so we don't hammer when backend is down
    const key = filePath
    const now = Date.now()
    const cached = jobByFilePathCache.get(key)
    const hasResult = cached?.data && (cached.data.job != null || (cached.data.allJobs?.length ?? 0) > 0)
    const ttl = hasResult ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS
    if (cached && now - cached.at < ttl) {
      return cached.data
    }
    try {
      const data = await apiRequest<{ job: MarkerJobStatus | null; allJobs: MarkerJobStatus[] }>(
        `/api/marker/jobs?filePath=${encodeURIComponent(filePath)}`
      )
      jobByFilePathCache.set(key, { data, at: now })
      return data
    } catch (err) {
      const empty = { job: null as MarkerJobStatus | null, allJobs: [] as MarkerJobStatus[] }
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        jobByFilePathCache.set(key, { data: empty, at: now })
        return empty
      }
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) {
        jobByFilePathCache.set(key, { data: empty, at: now })
        return empty
      }
      throw err
    }
  },
}

const jobByFilePathCache = new Map<string, { data: { job: MarkerJobStatus | null; allJobs: MarkerJobStatus[] }; at: number }>()

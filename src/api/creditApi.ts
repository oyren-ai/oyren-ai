/**
 * Credit API Client - Handles credit-related API calls to Next.js backend
 */

import { getOyrenWebApiBaseUrl } from '@/api/oyrenWebApiBaseUrl'

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
      'Authorization': `Bearer ${token}`, // Send JWT token in Authorization header
      ...options.headers,
    },
    // Don't use credentials: 'include' - causes CORS issues with wildcard origins
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API request failed: ${response.statusText}`)
  }

  return response.json()
}

export interface CreditBalance {
  credits: number
  lastUpdated: string
  userId: string
}

export interface CreditTransaction {
  id: number
  uuid: string
  transaction_type: string
  amount: number
  balance_after: number
  description: string
  metadata: string | null
  date_created: string
}

export interface CreditHistory {
  transactions: CreditTransaction[]
  count: number
}

export interface DeductCreditsRequest {
  amount: number
  metadata?: {
    feature?: string
    pages?: number
    file_name?: string
    model?: string
    tokens?: number
    [key: string]: any
  }
}

export interface DeductCreditsResponse {
  success: boolean
  newBalance: number
  deducted: number
  transactionId: string
}

export const creditApi = {
  /**
   * Get user's current credit balance
   */
  async getBalance(): Promise<CreditBalance> {
    return apiRequest<CreditBalance>('/api/user/credits')
  },

  /**
   * Get credit transaction history
   * @param limit - Maximum number of transactions to return (default: 50)
   */
  async getHistory(limit: number = 50): Promise<CreditHistory> {
    return apiRequest<CreditHistory>(`/api/user/credits/history?limit=${limit}`)
  },

  /**
   * Deduct credits from user balance
   * @param amount - Amount of credits to deduct
   * @param metadata - Additional metadata about the transaction
   */
  async deductCredits(
    amount: number,
    metadata?: DeductCreditsRequest['metadata']
  ): Promise<DeductCreditsResponse> {
    return apiRequest<DeductCreditsResponse>('/api/user/credits/deduct', {
      method: 'POST',
      body: JSON.stringify({ amount, metadata }),
    })
  },
}

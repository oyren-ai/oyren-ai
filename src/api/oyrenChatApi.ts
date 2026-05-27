/**
 * Oyren Credits Chat API
 * Routes AI chat through the Oyren web backend using the user's credit balance.
 * No local API key required — authentication is via the stored JWT token.
 */

import { getOyrenWebApiBaseUrl } from '@/api/oyrenWebApiBaseUrl'
import type { AIChatResponse } from '@/api/types/ai'

function getAuthToken(): string | null {
  return localStorage.getItem('oyren_auth_token')
}

// In-memory model cache — avoids repeated network calls on settings/navigation changes
interface ModelsCache {
  models: OyrenCatalogModel[]
  fetchedAt: number
}
let modelsCache: ModelsCache | null = null
const MODELS_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCachedModels(): OyrenCatalogModel[] | null {
  if (!modelsCache) return null
  if (Date.now() - modelsCache.fetchedAt > MODELS_CACHE_TTL_MS) {
    modelsCache = null
    return null
  }
  return modelsCache.models
}

function setCachedModels(models: OyrenCatalogModel[]): void {
  modelsCache = { models, fetchedAt: Date.now() }
}

export function clearOyrenModelsCache(): void {
  modelsCache = null
}

export interface OyrenCatalogModel {
  modelId: string
  label: string
  description: string | null
  contextWindow: number | null
  inputCreditsPerM: number
  outputCreditsPerM: number
}

export interface OyrenChatRequest {
  message: string
  images?: Array<{ data: string; mime_type: string }>
  conversationHistory?: Array<{ role: string; content: string }>
  model: string
  temperature?: number
  answerMode?: 'short' | 'concise' | 'detailed'
  fileContext?: string
}

export interface OyrenChatResult {
  response: string
  creditCost: number
  usage: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = getAuthToken()
  if (!token) throw new Error('Not authenticated. Please sign in to use Oyren Credits.')

  const url = `${getOyrenWebApiBaseUrl()}${endpoint}`
  const res = await fetch(url, {
    ...options,
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (res.status === 402) {
    throw new Error('Insufficient credits. Please top up your balance.')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let detail = res.statusText
    const trimmed = text.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as { error?: unknown }
        if (parsed?.error != null) {
          detail = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error)
        }
      } catch {
        if (trimmed) detail = trimmed.slice(0, 300)
      }
    } else if (trimmed) {
      detail = trimmed.slice(0, 300)
    }
    throw new Error(`[HTTP ${res.status}] ${detail}`)
  }

  return res.json() as Promise<T>
}

export const oyrenChatApi = {
  /**
   * Fetch available models from the Oyren catalog.
   * Results are cached for 5 minutes to avoid repeated network calls on
   * settings changes and navigation events.
   */
  async getModels(): Promise<OyrenCatalogModel[]> {
    const cached = getCachedModels()
    if (cached) return cached

    const data = await request<{ models: OyrenCatalogModel[] }>('/api/ai/models')
    setCachedModels(data.models)
    return data.models
  },

  /**
   * Send a chat message through the Oyren web API.
   * Credits are deducted automatically based on token usage.
   */
  async chat(
    req: OyrenChatRequest,
    signal?: AbortSignal,
  ): Promise<AIChatResponse> {
    const imagesForWeb = req.images?.map(img => {
      // Web endpoint expects full base64 data URLs
      const data = img.data.startsWith('data:')
        ? img.data
        : `data:${img.mime_type};base64,${img.data}`
      return data
    }) ?? []

    const result = await request<OyrenChatResult>(
      '/api/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify({
          message: req.message,
          images: imagesForWeb,
          conversationHistory: req.conversationHistory ?? [],
          model: req.model,
          temperature: req.temperature ?? 0.3,
          answerMode: req.answerMode ?? 'concise',
          fileContext: req.fileContext,
        }),
      },
      signal,
    )

    return {
      response: result.response,
      usage_metadata: {
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        total_tokens: result.usage.totalTokens,
      },
    }
  },
}

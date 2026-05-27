/**
 * Builds a virtual AiProviderKey for the Oyren Credits provider.
 * This provider does not require a local API key — it uses the signed-in
 * user's credit balance via the Oyren web backend.
 */

import type { AiProviderKey, AiModel } from '@/types/aiProviderKey'
import type { OyrenCatalogModel } from '@/api/oyrenChatApi'

export const OYREN_CREDITS_PROVIDER_ID = 'oyren-credits'
export const OYREN_CREDITS_PROVIDER_NAME = 'oyren'

export function buildOyrenCreditsProvider(
  models: OyrenCatalogModel[],
): AiProviderKey {
  const aiModels: AiModel[] = models.map((m) => ({
    id: m.modelId,
    name: m.label,
    provider: OYREN_CREDITS_PROVIDER_NAME,
    enabled: true,
  }))

  return {
    id: OYREN_CREDITS_PROVIDER_ID,
    name: 'Oyren Credits',
    key: '',
    date_added: new Date().toISOString(),
    last_used_date: null,
    is_local: false,
    ai_provider: {
      id: OYREN_CREDITS_PROVIDER_NAME,
      name: OYREN_CREDITS_PROVIDER_NAME,
      created_at: '',
    },
    models: aiModels,
  }
}

export function isOyrenCreditsProvider(provider: string | null): boolean {
  return provider?.toLowerCase() === OYREN_CREDITS_PROVIDER_NAME
}

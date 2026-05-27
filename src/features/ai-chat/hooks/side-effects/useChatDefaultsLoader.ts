import { useCallback, useEffect, useRef, useState } from 'react';
import { aiProviderApi } from '@/api/aiProviderApi';
import { oyrenChatApi } from '@/api/oyrenChatApi';
import { useOptionalAuth } from '@/contexts/AuthContext';
import type { AiProviderKey } from '@/types/aiProviderKey';
import { getDefaultModelFromModels } from '../../utils/modelOptions';
import {
  getActiveProviderKeyId,
  setActiveProviderKeyId,
  ACTIVE_PROVIDER_KEY_EVENT,
} from '../../utils/activeProviderKeyStorage';
import {
  buildOyrenCreditsProvider,
  OYREN_CREDITS_PROVIDER_ID,
} from '../../utils/oyrenCreditsProvider';

// Module-level flag: first load shows spinner, subsequent event-driven reloads are silent
let _initialLoadDone = false;

export interface ChatDefaultsLoaderResult {
  selectedProviderKey: AiProviderKey | null;
  selectedModel: string;
  isLoadingDefaults: boolean;
  setSelectedProviderKey: (key: AiProviderKey | null) => void;
  setSelectedModel: (model: string) => void;
}

export const useChatDefaultsLoader = (): ChatDefaultsLoaderResult => {
  const auth = useOptionalAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [selectedProviderKey, setSelectedProviderKey] = useState<AiProviderKey | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  // Track auth transitions to detect fresh logins
  const prevIsAuthenticatedRef = useRef<boolean | null>(null);

  const loadDefaults = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingDefaults(true);
    try {
      // Detect fresh login (auth just changed false → true, not app startup)
      const isJustLoggedIn =
        isAuthenticated && prevIsAuthenticatedRef.current === false;
      prevIsAuthenticatedRef.current = isAuthenticated;

      // Build Oyren Credits virtual provider when signed in
      // getModels() uses in-memory cache after first fetch — no network hit on repeated calls
      let oyrenProvider: AiProviderKey | null = null;
      if (isAuthenticated) {
        try {
          const models = await oyrenChatApi.getModels();
          oyrenProvider = buildOyrenCreditsProvider(models);
        } catch {
          oyrenProvider = buildOyrenCreditsProvider([]);
        }
      }

      // Load local API keys from SQLite
      const localKeys = await aiProviderApi.list();

      // Combine: Oyren Credits first (when signed in), then local keys
      const allKeys: AiProviderKey[] = [
        ...(oyrenProvider ? [oyrenProvider] : []),
        ...localKeys,
      ];

      if (allKeys.length === 0) return;

      // On fresh login, automatically switch to Oyren Credits
      if (isJustLoggedIn && oyrenProvider) {
        setActiveProviderKeyId(OYREN_CREDITS_PROVIDER_ID);
      }

      const persistedId = getActiveProviderKeyId();

      // Resolve the active key: persisted → first available
      const activeKey =
        persistedId
          ? allKeys.find((k) => k.id === persistedId) ?? allKeys[0]
          : allKeys[0];

      setSelectedProviderKey(activeKey);

      const defaultModel = getDefaultModelFromModels(activeKey.models);
      if (defaultModel) {
        setSelectedModel(defaultModel);
      }
    } catch (error) {
      console.error('Failed to load default provider:', error);
    } finally {
      _initialLoadDone = true;
      setIsLoadingDefaults(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadDefaults();

    // Subsequent reloads (settings changes, key events) are silent —
    // they update selectedProviderKey/selectedModel without showing a loading spinner
    const handleReload = () => void loadDefaults(/* silent= */ _initialLoadDone);
    window.addEventListener('api-key-created', handleReload);
    window.addEventListener('api-key-deleted', handleReload);
    window.addEventListener(ACTIVE_PROVIDER_KEY_EVENT, handleReload);

    return () => {
      window.removeEventListener('api-key-created', handleReload);
      window.removeEventListener('api-key-deleted', handleReload);
      window.removeEventListener(ACTIVE_PROVIDER_KEY_EVENT, handleReload);
    };
  }, [loadDefaults]);

  return {
    selectedProviderKey,
    selectedModel,
    isLoadingDefaults,
    setSelectedProviderKey,
    setSelectedModel,
  };
};

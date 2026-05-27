import { useState, useEffect } from 'react';
import { aiProviderApi } from '@/api/aiProviderApi';
import { oyrenChatApi } from '@/api/oyrenChatApi';
import { aiAgentApi } from '@/api/aiAgentApi';
import type { AiProviderKey } from '@/types/aiProviderKey';
import { useOllamaModels } from './useOllamaModels';
import { useOptionalAuth } from '@/contexts/AuthContext';
import { getActiveProviderKeyId } from '@/features/ai-chat/utils/activeProviderKeyStorage';
import {
  buildOyrenCreditsProvider,
  OYREN_CREDITS_PROVIDER_ID,
  isOyrenCreditsProvider,
} from '@/features/ai-chat/utils/oyrenCreditsProvider';

export function useChatSettingsState(isOpen: boolean, currentTemperature: number) {
  const auth = useOptionalAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [providerKeys, setProviderKeys] = useState<AiProviderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(currentTemperature);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');

  const selectedKey = providerKeys.find(key => key.id === selectedKeyId);
  const { models, loadingModels, selectedModel, setSelectedModel } = useOllamaModels(
    selectedKey?.ai_provider.name
  );

  useEffect(() => {
    if (isOpen) {
      void loadProviderKeys();
      setTemperature(currentTemperature);
    }
  }, [isOpen, currentTemperature]);

  useEffect(() => {
    const handleKeyCreated = () => void loadProviderKeys();
    const handleKeyDeleted = () => void loadProviderKeys();
    window.addEventListener('api-key-created', handleKeyCreated);
    window.addEventListener('api-key-deleted', handleKeyDeleted);
    return () => {
      window.removeEventListener('api-key-created', handleKeyCreated);
      window.removeEventListener('api-key-deleted', handleKeyDeleted);
    };
  }, []);

  const loadProviderKeys = async () => {
    try {
      const localKeys = await aiProviderApi.list();

      let oyrenProvider: AiProviderKey | null = null;
      if (isAuthenticated) {
        const models = await oyrenChatApi.getModels().catch(() => []);
        oyrenProvider = buildOyrenCreditsProvider(models);
      }

      const allKeys: AiProviderKey[] = [
        ...(oyrenProvider ? [oyrenProvider] : []),
        ...localKeys,
      ];

      setProviderKeys(allKeys);

      if (allKeys.length > 0 && !selectedKeyId) {
        const persistedId = getActiveProviderKeyId();
        const defaultKey = persistedId
          ? allKeys.find(k => k.id === persistedId) ?? allKeys[0]
          : allKeys[0];
        setSelectedKeyId(defaultKey.id);
        // Sync selected model when defaulting to Oyren Credits
        if (defaultKey.models.length > 0 && !selectedModel) {
          setSelectedModel(defaultKey.models[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load provider keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedKey || isOyrenCreditsProvider(selectedKey.ai_provider.name)) return;
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionError('');

    try {
      const defaultModel = selectedKey.models.find(m => m.enabled)?.id || selectedKey.models[0]?.id;
      const modelToTest = selectedModel || defaultModel || '';
      const result = await aiAgentApi.testConnection(
        selectedKey.ai_provider.name, selectedKey.key, modelToTest
      );
      setConnectionStatus(result.success ? 'success' : 'error');
      if (!result.success) setConnectionError(result.message);
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleProviderChange = (keyId: string) => {
    setSelectedKeyId(keyId);
    setConnectionStatus('idle');
    setConnectionError('');
  };

  const isOyrenSelected = selectedKeyId === OYREN_CREDITS_PROVIDER_ID;

  return {
    providerKeys, loading, selectedKey, selectedKeyId, temperature, setTemperature,
    isTestingConnection, connectionStatus, connectionError,
    models, loadingModels, selectedModel, setSelectedModel,
    handleTestConnection, handleProviderChange, isOyrenSelected,
  };
}

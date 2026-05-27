import { useState, useEffect, useCallback } from "react";
import type { AiProviderKey } from "@/types/aiProviderKey";
import { useApiKeyModal, useDeleteApiKeyModal } from "@/contexts/ModalContext";
import { aiProviderApi } from "@/api/aiProviderApi";
import {
  getActiveProviderKeyId,
  setActiveProviderKeyId,
} from "@/features/ai-chat/utils/activeProviderKeyStorage";
import { OYREN_CREDITS_PROVIDER_ID } from "@/features/ai-chat/utils/oyrenCreditsProvider";

interface UseModelSettingsApiKeysParams {
  onProviderSelect: (providerKey: AiProviderKey) => void;
  oyrenProvider?: AiProviderKey | null;
}

export function useModelSettingsApiKeys({
  onProviderSelect,
  oyrenProvider,
}: UseModelSettingsApiKeysParams) {
  const apiKeyModal = useApiKeyModal();
  const deleteApiKeyModal = useDeleteApiKeyModal();
  const [providerKeys, setProviderKeys] = useState<AiProviderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const keys = await aiProviderApi.list();
      const apiKeysOnly = keys.filter((key) => !key.is_local);
      setProviderKeys(apiKeysOnly);

      if (selectedApiKeyId) return;

      const persistedId = getActiveProviderKeyId();

      // If Oyren Credits is the persisted provider, mark it selected
      if (persistedId === OYREN_CREDITS_PROVIDER_ID) {
        setSelectedApiKeyId(OYREN_CREDITS_PROVIDER_ID);
        if (oyrenProvider) {
          onProviderSelect(oyrenProvider);
        }
        return;
      }

      // Auto-select persisted local key
      if (apiKeysOnly.length > 0) {
        const defaultKey = persistedId
          ? apiKeysOnly.find((k) => k.id === persistedId) ?? apiKeysOnly[0]
          : apiKeysOnly[0];
        setSelectedApiKeyId(defaultKey.id);
        onProviderSelect(defaultKey);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  }, [oyrenProvider]);

  useEffect(() => {
    void loadApiKeys();
  }, [loadApiKeys]);

  useEffect(() => {
    const handler = () => void loadApiKeys();
    window.addEventListener("api-key-created", handler);
    window.addEventListener("api-key-updated", handler);
    window.addEventListener("api-key-deleted", handler);
    return () => {
      window.removeEventListener("api-key-created", handler);
      window.removeEventListener("api-key-updated", handler);
      window.removeEventListener("api-key-deleted", handler);
    };
  }, [loadApiKeys]);

  const handleCardClick = (apiKey: AiProviderKey) => {
    setSelectedApiKeyId(apiKey.id);
    setActiveProviderKeyId(apiKey.id);
    onProviderSelect(apiKey);
  };

  const handleOyrenClick = (oyren: AiProviderKey) => {
    setSelectedApiKeyId(OYREN_CREDITS_PROVIDER_ID);
    setActiveProviderKeyId(OYREN_CREDITS_PROVIDER_ID);
    onProviderSelect(oyren);
  };

  const handleEdit = (apiKey: AiProviderKey) => {
    apiKeyModal.open({ apiKey, mode: "edit" });
  };

  const handleDelete = (apiKey: AiProviderKey) => {
    deleteApiKeyModal.open({ apiKey });
  };

  const handleAddKey = () => {
    apiKeyModal.open({ mode: "create" });
  };

  return {
    providerKeys,
    loading,
    selectedApiKeyId,
    handleCardClick,
    handleOyrenClick,
    handleEdit,
    handleDelete,
    handleAddKey,
  };
}

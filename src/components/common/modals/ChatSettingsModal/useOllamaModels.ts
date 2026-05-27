import { useState, useEffect } from 'react';
import { aiAgentApi } from '@/api/aiAgentApi';
import type { OllamaModel } from '@/api/types/ai';

export function useOllamaModels(providerName: string | undefined) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    if (providerName?.toLowerCase() === 'ollama') {
      void loadModels();
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [providerName]);

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const ollamaModels = await aiAgentApi.detectOllamaModels();
      setModels(ollamaModels);
      if (ollamaModels.length > 0 && !selectedModel) {
        setSelectedModel(ollamaModels[0].name);
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  return {
    models,
    loadingModels,
    selectedModel,
    setSelectedModel,
  };
}

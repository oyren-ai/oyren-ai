import {useState, useCallback} from "react";
import {aiProviderModelApi} from "@/api/aiProviderModelApi";
import {aiAgentApi} from "@/api/aiAgentApi";
import type {AiProviderKey} from "@/types/aiProviderKey";

export type TestingState = Record<string, 'testing' | 'success' | 'error'>;

interface UseModelToggleParams {
    selectedProviderKey: AiProviderKey | null;
    setSelectedProviderKey: React.Dispatch<React.SetStateAction<AiProviderKey | null>>;
}

export function useModelToggle({selectedProviderKey, setSelectedProviderKey}: UseModelToggleParams) {
    const [testingModels, setTestingModels] = useState<TestingState>({});

    const updateModel = useCallback((modelId: string, enabled: boolean) => {
        setSelectedProviderKey(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                models: prev.models.map(m =>
                    m.id === modelId ? {...m, enabled} : m
                ),
            };
        });
    }, [setSelectedProviderKey]);

    const handleToggle = useCallback(async (modelId: string, newState: boolean) => {
        if (!selectedProviderKey) return;

        if (!newState) {
            updateModel(modelId, false);
            try {
                await aiProviderModelApi.updateActive(modelId, false);
            } catch {
                updateModel(modelId, true);
            }
            return;
        }

        setTestingModels(prev => ({...prev, [modelId]: 'testing'}));

        try {
            const result = await aiAgentApi.testConnection(
                selectedProviderKey.ai_provider.name,
                selectedProviderKey.key,
                modelId,
            );

            if (result.success) {
                setTestingModels(prev => ({...prev, [modelId]: 'success'}));
                updateModel(modelId, true);
                await aiProviderModelApi.updateActive(modelId, true);
            } else {
                setTestingModels(prev => ({...prev, [modelId]: 'error'}));
            }
        } catch {
            setTestingModels(prev => ({...prev, [modelId]: 'error'}));
        }

        setTimeout(() => {
            setTestingModels(prev => {
                const next = {...prev};
                delete next[modelId];
                return next;
            });
        }, 3000);
    }, [selectedProviderKey, updateModel]);

    return {testingModels, handleToggle};
}

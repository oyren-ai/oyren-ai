import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiChatService } from '@/features/ai-chat/services/aiChatService';
import { getModelOptionsFromModels } from '../../utils/modelOptions';
import type { AiModel } from '@/types/aiProviderKey';
import NoModelsButton from './NoModelsButton';

interface ModelSelectorProps {
  currentProvider: string | null;
  currentModel: string;
  onModelChange: (model: string) => void;
  availableModels: AiModel[];
  isLoading: boolean;
}

export default function ModelSelector({
  currentProvider,
  currentModel,
  onModelChange,
  availableModels,
  isLoading
}: ModelSelectorProps) {
  const modelOptions = getModelOptionsFromModels(availableModels);

  if (modelOptions.length === 0) {
    return <NoModelsButton />;
  }

  const handleModelSelect = (modelValue: string) => {
    onModelChange(modelValue);

    if (!currentProvider) return;

    localStorage.setItem(`selected-ai-model-${currentProvider}`, modelValue);

    // Update aiChatService with the new model
    aiChatService.updateConfig(currentProvider, modelValue, 0.7);

    window.dispatchEvent(new CustomEvent('ai-model-changed', {
      detail: { model: modelValue, provider: currentProvider }
    }));
  };


  const selectedModelOption = modelOptions.find(opt => opt.value === currentModel);
  const displayLabel = selectedModelOption?.label || currentModel;

  return (
    <Select value={currentModel} onValueChange={handleModelSelect} disabled={isLoading}>
      <SelectTrigger
        className="h-7 px-2 pr-6 flex items-center gap-1.5 text-xs rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-colors max-w-[200px] min-w-[120px]"
        data-testid="model-selector-button"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {selectedModelOption ? (
            <>
              <div className={`w-1.5 h-1.5 rounded-full ${selectedModelOption.color} flex-shrink-0`}></div>
              <span className="truncate flex-1 min-w-0">{displayLabel}</span>
            </>
          ) : (
            <SelectValue placeholder="Select Model" className="truncate flex-1 min-w-0" />
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="min-w-[200px] max-w-[280px]">
        {modelOptions.map((model) => (
          <SelectItem key={model.value} value={model.value} textValue={model.label}>
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full ${model.color} mt-1.5 flex-shrink-0`}></div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${currentModel === model.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {model.label}
                </div>
                {model.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {model.description}
                  </div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

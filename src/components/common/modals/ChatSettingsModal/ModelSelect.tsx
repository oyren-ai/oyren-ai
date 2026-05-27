import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OllamaModel } from '@/api/types/ai';

export interface ModelOption {
  /** Value sent to the API (model ID) */
  value: string;
  /** Human-readable display label */
  label: string;
}

interface ModelSelectProps {
  /** Ollama models (legacy path — value and label are both `model.name`) */
  models?: OllamaModel[];
  /** Explicit model options with separate value/label (used for Oyren catalog) */
  options?: ModelOption[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  loadingModels: boolean;
}

const ModelSelect: React.FC<ModelSelectProps> = ({
  models = [],
  options,
  selectedModel,
  onModelChange,
  loadingModels,
}) => {
  // Prefer explicit options if provided, otherwise derive from Ollama model list
  const items: ModelOption[] = options
    ? options
    : models.map((m) => ({ value: m.name, label: m.name }));

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="model">Model</Label>
      {loadingModels ? (
        <div className="text-sm text-muted-foreground">Loading models...</div>
      ) : (
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger id="model">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ModelSelect;

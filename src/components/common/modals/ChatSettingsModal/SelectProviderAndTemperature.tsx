import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Coins, Zap } from 'lucide-react';
import type { AiProviderKey } from '@/types/aiProviderKey';
import type { OllamaModel } from '@/api/types/ai';
import ModelSelect, { type ModelOption } from './ModelSelect';
import {
  OYREN_CREDITS_PROVIDER_ID,
  isOyrenCreditsProvider,
} from '@/features/ai-chat/utils/oyrenCreditsProvider';

interface SelectProviderAndTemperatureProps {
  providerKeys: AiProviderKey[];
  selectedKeyId: string;
  temperature: number;
  onProviderChange: (keyId: string) => void;
  onTemperatureChange: (temp: number) => void;
  ollamaModels?: OllamaModel[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  loadingModels?: boolean;
}

const SelectProviderAndTemperature: React.FC<SelectProviderAndTemperatureProps> = ({
  providerKeys,
  selectedKeyId,
  temperature,
  onProviderChange,
  onTemperatureChange,
  ollamaModels = [],
  selectedModel,
  onModelChange,
  loadingModels = false,
}) => {
  const selectedKey = providerKeys.find(k => k.id === selectedKeyId);
  const isOyren = isOyrenCreditsProvider(selectedKey?.ai_provider.name ?? null);

  // For Oyren, build rich options from catalog (label + id)
  const oyrenOptions: ModelOption[] = isOyren
    ? (selectedKey?.models ?? []).map(m => ({ value: m.id, label: m.name }))
    : [];

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select value={selectedKeyId} onValueChange={onProviderChange}>
          <SelectTrigger id="provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providerKeys.map((key) => (
              <SelectItem key={key.id} value={key.id}>
                <span className="flex items-center gap-2">
                  {key.id === OYREN_CREDITS_PROVIDER_ID && (
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {key.name}
                  {key.id !== OYREN_CREDITS_PROVIDER_ID && (
                    <span className="text-muted-foreground">({key.ai_provider.name})</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Oyren Credits info banner */}
      {isOyren && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm">
          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-700 dark:text-amber-300">
            Charged from your Oyren credit balance
          </span>
          <Badge variant="secondary" className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            No key needed
          </Badge>
        </div>
      )}

      {/* Model selection */}
      {isOyren ? (
        <ModelSelect
          options={oyrenOptions}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          loadingModels={loadingModels}
        />
      ) : (
        <ModelSelect
          models={ollamaModels}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          loadingModels={loadingModels}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature: {temperature}</Label>
        <Slider
          id="temperature"
          min={0}
          max={1}
          step={0.1}
          value={[temperature]}
          onValueChange={(value) => onTemperatureChange(value[0])}
          className="w-full"
        />
      </div>
    </>
  );
};

export default SelectProviderAndTemperature;

import React, { useState, useEffect } from 'react';
import { useApiKeyModal } from '@/contexts/ModalContext';
import type { AiProviderKey } from '@/types/aiProviderKey';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { aiProviderApi } from '@/api/aiProviderApi';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_PROVIDERS = [
  { id: 'gemini', name: 'Gemini' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'openrouter', name: 'OpenRouter' },
];

export function ApiKeyDialog({ isOpen, onClose }: ApiKeyDialogProps) {
  const apiKeyModal = useApiKeyModal();
  const apiKey = apiKeyModal.data?.apiKey as AiProviderKey | undefined;
  const mode = apiKeyModal.data?.mode as 'view' | 'edit' | 'create' | undefined;
  const aiModels = apiKeyModal.data?.aiModels as string[] | undefined;

  const [selectedProvider, setSelectedProvider] = useState('');
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  useEffect(() => {
    if (!isOpen) {
      setSelectedProvider('');
      setKeyName('');
      setKeyValue('');
      setError('');
      setShowKey(false);
    } else if (isEditMode && apiKey) {
      setKeyName(apiKey.name);
    }
  }, [isOpen, isEditMode, apiKey]);

  const handleCreate = async () => {
    if (!selectedProvider || !keyName.trim() || !keyValue.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await aiProviderApi.create(selectedProvider, keyName.trim(), keyValue.trim());
      window.dispatchEvent(new CustomEvent('api-key-created'));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!apiKey || !keyName.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await aiProviderApi.update(apiKey.id, keyName.trim());

      window.dispatchEvent(new CustomEvent('api-key-updated'));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode && 'AI Models'}
            {isEditMode && 'Edit API Key'}
            {isCreateMode && 'Add New API Key'}
            {!mode && 'API Key'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isViewMode && apiKey && aiModels && (
            <>
              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="text-sm px-3 py-2 bg-muted rounded-md">
                  {apiKey.ai_provider.name}
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key Name</Label>
                <div className="text-sm px-3 py-2 bg-muted rounded-md">
                  {apiKey.name}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Supported AI Models</Label>
                <div className="grid gap-2">
                  {aiModels.map((model, index) => (
                    <div
                      key={index}
                      className="text-sm px-3 py-2 bg-muted rounded-md"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isEditMode && apiKey && (
            <>
              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="text-sm px-3 py-2 bg-muted rounded-md">
                  {apiKey.ai_provider.name}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editKeyName">Name</Label>
                <Input
                  id="editKeyName"
                  placeholder="e.g., Production Key"
                  value={keyName}
                  autoCorrect='off'
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          )}

          {isCreateMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyName">Name</Label>
                <Input
                  id="keyName"
                  autoCorrect='off'
                  placeholder="e.g., Production Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyValue">API Key</Label>
                <div className="relative">
                  <Input
                    id="keyValue"
                    autoCorrect='off'
                    type={showKey ? "text" : "password"}
                    className="font-mono pr-10"
                    placeholder="Enter your API key"
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {isCreateMode && (
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            )}
            {isEditMode && (
              <Button onClick={handleEdit} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

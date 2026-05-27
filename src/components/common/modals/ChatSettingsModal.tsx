import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { AiProviderKey } from '@/types/aiProviderKey';
import { useViewNavigation } from '@/contexts/NavigationContext';
import AddFirstApiKeyGuide from './ChatSettingsModal/AddFirstApiKeyGuide';
import SelectProviderAndTemperature from './ChatSettingsModal/SelectProviderAndTemperature';
import ChatSettingsModalFooter from './ChatSettingsModal/ChatSettingsModalFooter';
import { useChatSettingsState } from './ChatSettingsModal/useChatSettingsState';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemperature: number;
  onSettingsChange: (settings: {
    providerKey: AiProviderKey;
    temperature: number;
    model?: string;
  }) => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen, onClose, currentTemperature, onSettingsChange,
}) => {
  const { navigateToSettings } = useViewNavigation();
  const state = useChatSettingsState(isOpen, currentTemperature);

  const handleSave = () => {
    if (!state.selectedKey) return;
    onSettingsChange({
      providerKey: state.selectedKey,
      temperature: state.temperature,
      ...(state.selectedModel && { model: state.selectedModel }),
    });
    onClose();
  };

  const handleOpenSettings = () => {
    onClose();
    navigateToSettings();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Chat Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">API Provider</Label>
            {state.loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : state.providerKeys.length === 0 ? (
              <AddFirstApiKeyGuide onOpenSettings={handleOpenSettings} />
            ) : (
              <SelectProviderAndTemperature
                providerKeys={state.providerKeys}
                selectedKeyId={state.selectedKeyId}
                temperature={state.temperature}
                onProviderChange={state.handleProviderChange}
                onTemperatureChange={state.setTemperature}
              />
            )}
          </div>
        </div>

        <ChatSettingsModalFooter
          selectedKey={state.selectedKey}
          connectionStatus={state.connectionStatus}
          connectionError={state.connectionError}
          isTestingConnection={state.isTestingConnection}
          onTestConnection={state.handleTestConnection}
          onClose={onClose}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChatSettingsModal;

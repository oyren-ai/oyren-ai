import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { AiProviderKey } from '@/types/aiProviderKey';
import { isOyrenCreditsProvider } from '@/features/ai-chat/utils/oyrenCreditsProvider';

interface ChatSettingsModalFooterProps {
  selectedKey: AiProviderKey | undefined;
  connectionStatus: 'idle' | 'success' | 'error';
  connectionError: string;
  isTestingConnection: boolean;
  onTestConnection: () => void;
  onClose: () => void;
  onSave: () => void;
}

const ChatSettingsModalFooter: React.FC<ChatSettingsModalFooterProps> = ({
  selectedKey,
  connectionStatus,
  connectionError,
  isTestingConnection,
  onTestConnection,
  onClose,
  onSave,
}) => {
  const showTestButton =
    selectedKey &&
    selectedKey.ai_provider.name.toLowerCase() !== 'ollama' &&
    !isOyrenCreditsProvider(selectedKey.ai_provider.name);

  return (
    <>
      {connectionStatus !== 'idle' && (
        <div className="space-y-2 pb-2">
          {connectionStatus === 'success' && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Connection successful!
            </p>
          )}
          {connectionStatus === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {connectionError}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between gap-3">
        {showTestButton ? (
          <Button
            variant="secondary"
            onClick={onTestConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!selectedKey}>Apply</Button>
        </div>
      </div>
    </>
  );
};

export default ChatSettingsModalFooter;

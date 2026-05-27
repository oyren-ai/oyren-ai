import React, { useState } from 'react';
import { ExternalLink, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../Button';
import { useApiContext } from '@/contexts/ApiContext.tsx';
import {aiChatService} from "@/features/ai-chat/services/aiChatService.ts";


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { refreshApiKeyStatus } = useApiContext();
  
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    return localStorage.getItem('ai-provider') || 'gemini';
  });
  
  // Load API key for the current provider
  const [apiKey, setApiKey] = useState<string>(() => {
    const provider = localStorage.getItem('ai-provider') || 'gemini';
    return localStorage.getItem(`ai-api-key-${provider}`) || '';
  });
  
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');

  const aiProviders = [
    { id: 'gemini', name: 'Google Gemini', available: true },
    { id: 'deepseek', name: 'DeepSeek', available: true },
    { id: 'openai', name: 'OpenAI GPT', available: false },
    { id: 'claude', name: 'Anthropic Claude', available: false }
  ];
  
  // Handle provider change
  const handleProviderChange = (newProvider: string) => {
    // Save the current API key for the current provider
    if (apiKey) {
      localStorage.setItem(`ai-api-key-${selectedProvider}`, apiKey);
    }
    
    // Switch to a new provider
    setSelectedProvider(newProvider);
    
    // Load API key for the new provider
    const savedKey = localStorage.getItem(`ai-api-key-${newProvider}`) || '';
    setApiKey(savedKey);
    
    // Reset connection status when switching providers
    setConnectionStatus('idle');
    setConnectionError('');
  };

  const handleSave = async () => {
    try {
      // Save settings to localStorage
      localStorage.setItem('ai-provider', selectedProvider);
      
      // Save a provider-specific API key
      if (apiKey) {
        localStorage.setItem(`ai-api-key-${selectedProvider}`, apiKey);
      } else {
        localStorage.removeItem(`ai-api-key-${selectedProvider}`);
      }
      
      // Also save as the current active API key for backward compatibility
      localStorage.setItem('ai-api-key', apiKey);
      
      // Refresh API context
      await refreshApiKeyStatus();
      
      // Dispatch custom event for same-window updates
      window.dispatchEvent(new CustomEvent('api-key-updated'));
      
      onClose();
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Failed to save settings');
    }
  };

  
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus('error');
      setConnectionError('Please enter an API key');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionError('');

    try {
      // Save the API key and provider temporarily for testing
      const previousKey = localStorage.getItem('ai-api-key');
      const previousProvider = localStorage.getItem('ai-provider');
      
      // Set test values
      localStorage.setItem('ai-api-key', apiKey.trim());
      localStorage.setItem(`ai-api-key-${selectedProvider}`, apiKey.trim());
      localStorage.setItem('ai-provider', selectedProvider);
      
      // Update service configuration
      const defaultModel = aiChatService.getDefaultModel(selectedProvider);
      aiChatService.updateConfig(
        selectedProvider,
        defaultModel,
        0.7 // default temperature
      );
      
      // Test the connection
      const result = await aiChatService.testConnection();

      if (result.success) {
        setConnectionStatus('success');
        // Save the successful key for this provider
        localStorage.setItem(`ai-api-key-${selectedProvider}`, apiKey.trim());
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Connection test failed');
        // Restore previous values if test fails
        if (previousKey !== null) {
          localStorage.setItem('ai-api-key', previousKey);
        } else {
          localStorage.removeItem('ai-api-key');
        }
        if (previousProvider !== null) {
          localStorage.setItem('ai-provider', previousProvider);
        }
      }
    } catch (error) {
      setConnectionStatus('error');
      // Make error messages more user-friendly
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('finish_reason')) {
          errorMessage = 'API response format error. Please try again.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Invalid API key. Please check your key and try again.';
        } else if (error.message.includes('403')) {
          errorMessage = 'API key does not have access. Please check your Google AI Studio settings.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      setConnectionError(errorMessage);
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const isValidApiKey = (key: string, provider: string): boolean => {
    if (provider === 'gemini') {
      // Gemini API keys start with 'AIza' and are 39 characters long
      return key.startsWith('AIza') && key.length === 39;
    } else if (provider === 'deepseek') {
      // DeepSeek API keys start with 'sk-' and are typically 32+ characters
      return key.startsWith('sk-') && key.length >= 32;
    }
    // For other providers, just check if the key is not empty
    return key.length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-950 rounded-lg p-8 max-w-lg mx-4 w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Settings</h2>
        
        <div className="space-y-6">
          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              AI Provider
            </label>
            <div className="space-y-2">
              {aiProviders.map((provider) => (
                <div key={provider.id} className="flex items-center">
                  <input
                    type="radio"
                    id={provider.id}
                    name="ai-provider"
                    value={provider.id}
                    checked={selectedProvider === provider.id}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    disabled={!provider.available}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <label 
                    htmlFor={provider.id} 
                    className={`ml-3 block text-sm ${
                      provider.available 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {provider.name}
                    {!provider.available && (
                      <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            
            {apiKey && !isValidApiKey(apiKey, selectedProvider) && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {selectedProvider === 'gemini' 
                  ? 'Invalid API key format. Gemini API keys should start with "AIza" and be 39 characters long.'
                  : selectedProvider === 'deepseek'
                  ? 'Invalid API key format. DeepSeek API keys should start with "sk-" and be at least 32 characters long.'
                  : 'Invalid API key format.'}
              </p>
            )}
            
            {selectedProvider === 'gemini' && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <p className="mb-1">Get your free API key from:</p>
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            
            {selectedProvider === 'deepseek' && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <p className="mb-1">Get your API key from:</p>
                <a 
                  href="https://platform.deepseek.com/api_keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  DeepSeek Platform <ExternalLink className="w-3 h-3" />
                </a>
                <p className="mt-1 text-xs">DeepSeek offers competitive pricing with high-quality responses.</p>
              </div>
            )}
            
            {/* Connection Test */}
            {(selectedProvider === 'gemini' || selectedProvider === 'deepseek') && apiKey.trim() && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Connection Test
                  </span>
                  <div title="Sends a 'Hello, world!' message to test your API key. This will use a small amount of tokens (~10 tokens).">
                    <Button
                      onClick={handleTestConnection}
                      disabled={!apiKey.trim() || isTestingConnection}
                      variant="secondary"
                      size="sm"
                    >
                      {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </div>
                
                {connectionStatus === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Connection successful! AI is ready to use.
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
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
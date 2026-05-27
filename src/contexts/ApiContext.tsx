import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiProviderApi } from '../api/aiProviderApi';
import { useOptionalAuth } from './AuthContext';

interface ApiContextType {
  // API Key Status
  hasApiKey: boolean;
  isCheckingApiKey: boolean;
  refreshApiKeyStatus: () => Promise<void>;

  // API Configuration
  apiKeySource: 'none' | 'localStorage' | 'oyren';

  /** True when the user is signed in and can use Oyren Credits for AI chat */
  hasOyrenAccess: boolean;

  // Error handling
  apiError: string | null;
  clearApiError: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApiContext = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiContext must be used within ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const auth = useOptionalAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [apiKeySource, setApiKeySource] = useState<'none' | 'localStorage' | 'oyren'>('none');
  const [apiError, setApiError] = useState<string | null>(null);

  const clearApiError = () => setApiError(null);

  const refreshApiKeyStatus = async () => {
    setIsCheckingApiKey(true);
    setApiError(null);

    try {
      // Primary check: Database (new storage method)
      try {
        const providerKeys = await aiProviderApi.list();
        if (providerKeys.length > 0) {
          setHasApiKey(true);
          setApiKeySource('localStorage');
          return;
        }
      } catch (dbError) {
        console.warn('ApiContext: Failed to check database for API keys:', dbError);
      }

      // Fallback: localStorage (legacy)
      const localStorageApiKey = localStorage.getItem('ai-api-key');
      if (localStorageApiKey?.trim()) {
        setHasApiKey(true);
        setApiKeySource('localStorage');
        return;
      }

      // Oyren Credits: signed-in users can chat without a local API key
      if (isAuthenticated) {
        setHasApiKey(true);
        setApiKeySource('oyren');
        return;
      }

      setHasApiKey(false);
      setApiKeySource('none');
    } catch (error) {
      console.error('ApiContext: Failed to check API key status:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error checking API key');
      setHasApiKey(false);
      setApiKeySource('none');
    } finally {
      setIsCheckingApiKey(false);
    }
  };

  useEffect(() => {
    refreshApiKeyStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleApiKeyUpdate = () => { refreshApiKeyStatus(); };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai-api-key' || e.key === 'ai-provider') {
        refreshApiKeyStatus();
      }
    };

    window.addEventListener('api-key-updated', handleApiKeyUpdate);
    window.addEventListener('api-key-created', handleApiKeyUpdate);
    window.addEventListener('api-key-deleted', handleApiKeyUpdate);
    window.addEventListener('config-updated', handleApiKeyUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('api-key-updated', handleApiKeyUpdate);
      window.removeEventListener('api-key-created', handleApiKeyUpdate);
      window.removeEventListener('api-key-deleted', handleApiKeyUpdate);
      window.removeEventListener('config-updated', handleApiKeyUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value: ApiContextType = {
    hasApiKey,
    isCheckingApiKey,
    refreshApiKeyStatus,
    apiKeySource,
    hasOyrenAccess: isAuthenticated,
    apiError,
    clearApiError,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

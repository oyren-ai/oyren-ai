import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {listen} from '@tauri-apps/api/event';
import {onOpenUrl} from '@tauri-apps/plugin-deep-link';
import {decodeJwtPayload, isTokenExpired} from '@/utils/jwt';
import {User, JwtPayload} from '@/types/auth';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Development vs Production detection
const isDev = import.meta.env.DEV;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = async (token: string): Promise<User | null> => {
    try {
      const payload = decodeJwtPayload<JwtPayload>(token);

      return isTokenExpired(payload) ? null : {
        userId: payload.userId || payload.sub || '',
        email: payload.email,
        name: payload.name,
        image: payload.image || payload.picture,
      };
    } catch (error) {
      return null;
    }
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('oyren_auth_token');
      if (token) {
        const userData = await validateToken(token);
        if (userData) {
          setUser(userData);
        } else {
          localStorage.removeItem('oyren_auth_token');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      // Callback server port hazır olana qədər Rust tərəfi gözləyir, sonra brauzeri açır
      await invoke('open_auth_browser', { isDev });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Failed to open auth browser:', error);
      if (msg.includes('callback server not ready') || msg.includes('not ready')) {
        alert('Giriş hazır deyil. Bir neçə saniyə sonra yenidən "Sign in" düyməsini sınayın.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('oyren_auth_token');
    setUser(null);
  };

  useEffect(() => {
    // Initial auth check
    checkAuthStatus();

    let unlistenAuthSuccess: (() => void) | null = null;
    let unlistenDeepLink: (() => void) | null = null;
    let unlistenCheckAuthFn: (() => void) | null = null;

    // Listen for auth-success event from backend (sent by Rust deep link handler)
    const setupAuthSuccessListener = async () => {
      try {
        unlistenAuthSuccess = await listen<string>('auth-success', async (event) => {
          const token = event.payload;
          localStorage.setItem('oyren_auth_token', token);

          const userData = await validateToken(token);
          if (userData) {
            setUser(userData);
          } else {
            console.error('❌ Token validation failed');
          }
        });
      } catch (err) {
      }
    };

    // Listen for deep link URLs using the official plugin API
    const setupDeepLinkListener = async () => {
      try {
        unlistenDeepLink = await onOpenUrl(async (urls) => {
          for (const url of urls) {
            // Forward to backend for window management and token parsing
            if (url.startsWith('oyren://')) {
              try {
                await invoke('handle_deep_link_command', {url});
                console.log('✅ Deep link forwarded successfully');
              } catch (error) {
                console.error('❌ Failed to forward deep link to backend:', error);
              }
            }
          }
        });
      } catch (err) {
        console.error('❌ Failed to register deep link listener:', err);
      }
    };

    setupAuthSuccessListener();
    setupDeepLinkListener();

    // Listen for window focus events to recheck auth
    listen('check-auth-status', () => {
      checkAuthStatus();
    }).then(unlisten => {
      unlistenCheckAuthFn = unlisten;
    }).catch(err => console.error('Failed to register check-auth listener:', err));

    return () => {
      if (unlistenAuthSuccess) unlistenAuthSuccess();
      if (unlistenDeepLink) unlistenDeepLink();
      if (unlistenCheckAuthFn) unlistenCheckAuthFn();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/** When outside AuthProvider, returns undefined (used by ApiProvider and tests that omit auth). */
export const useOptionalAuth = (): AuthContextType | undefined => {
  return useContext(AuthContext);
};


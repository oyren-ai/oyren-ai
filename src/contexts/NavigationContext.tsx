import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Workspace } from '../types/workspace';
import { useAppContext } from './AppContext';

export type ViewType = 'home-page' | 'workspace' | 'settings';

interface NavigationContextType {
  currentView: ViewType;
  selectedWorkspace: Workspace | null;
  settingsTab: string | null;
  navigateToWorkspace: (workspace: Workspace) => void;
  navigateToSettings: (tab?: string) => void;
  navigateToHome: () => void;
  navigateBack: () => void;
  clearSettingsTab: () => void;
  updateSelectedWorkspace: (updated: Partial<Workspace>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useViewNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export function ViewNavigationProvider({ children }: NavigationProviderProps) {
  const [currentView, setCurrentView] = useState<ViewType>('home-page');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [settingsTab, setSettingsTab] = useState<string | null>(null);
  const [previousWorkspace, setPreviousWorkspace] = useState<Workspace | null>(null);
  const { clearAllTabs } = useAppContext();

  const navigateToWorkspace = (workspace: Workspace) => {
    // Clear all PDF tabs when switching workspaces
    clearAllTabs();

    setSelectedWorkspace(workspace);
    setCurrentView('workspace');
  };

  const navigateToSettings = (tab?: string) => {
    setPreviousWorkspace(selectedWorkspace);
    setSettingsTab(tab ?? null);
    setCurrentView('settings');
    setSelectedWorkspace(null);
  };

  const clearSettingsTab = () => {
    setSettingsTab(null);
  };

  const navigateToHome = () => {
    setCurrentView('home-page');
    setSelectedWorkspace(null);
  };

  const updateSelectedWorkspace = (updated: Partial<Workspace>) => {
    setSelectedWorkspace((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const navigateBack = () => {
    if (previousWorkspace) {
      setSelectedWorkspace(previousWorkspace);
      setCurrentView('workspace');
    } else {
      setCurrentView('home-page');
    }
    setPreviousWorkspace(null);
  };

  const value = {
    currentView,
    selectedWorkspace,
    settingsTab,
    navigateToWorkspace,
    navigateToSettings,
    navigateToHome,
    navigateBack,
    clearSettingsTab,
    updateSelectedWorkspace,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
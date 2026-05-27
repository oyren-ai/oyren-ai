import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AppContent from '../../../AppContent.tsx';
import { AppProvider } from '@/contexts/AppContext.tsx';
import { ApiProvider } from '@/contexts/ApiContext.tsx';
import { ModalProvider } from '@/contexts/ModalContext.tsx';
import { AuthProvider } from '@/contexts/AuthContext.tsx';
import {ViewNavigationProvider} from "@/contexts/NavigationContext.tsx";

// Mock components
vi.mock('@/features/home/HomePageView', () => ({
  HomePageView: () => (
    <div data-testid="home-page">
      HomePageView Mock
    </div>
  ),
}));

vi.mock('@/features/workspace-view/WorkspaceView', () => ({
  default: () => <div data-testid="main-content">WorkspaceView Mock</div>,
}));

vi.mock('@/features/settings/SettingsView', () => ({
  SettingsView: () => <div data-testid="settings-view">SettingsView Mock</div>,
}));

const mockUseViewNavigation = vi.fn();
vi.mock('../../../contexts/NavigationContext', () => ({
  ViewNavigationProvider: ({ children }: any) => <div>{children}</div>,
  useViewNavigation: () => mockUseViewNavigation(),
}));

vi.mock('../../../contexts/AppContext', () => ({
  AppProvider: ({ children }: any) => <div>{children}</div>,
  useAppContext: () => ({
    isDarkMode: true,
    openPdfs: [],
    currentPdfPath: null,
    setCurrentPdfPath: vi.fn(),
    closePdfTab: vi.fn(),
    isAiChatCollapsed: false,
    isSidebarCollapsed: false,
    setIsAiChatCollapsed: vi.fn(),
    setIsSidebarCollapsed: vi.fn(),
    currentSessionId: null,
    setCurrentSessionId: vi.fn(),
    sidebarWidth: 250,
    handleMouseDown: vi.fn(),
  }),
}));

vi.mock('../../../contexts/ModalContext', () => ({
  ModalProvider: ({ children }: any) => <div>{children}</div>,
  useSettingsModal: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  }),
  useCreateWorkspaceModal: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  }),
  useEditWorkspaceModal: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  }),
  useDeleteWorkspaceModal: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

const mockNavigationContext = {
  currentView: 'home-page',
  selectedWorkspace: null,
  navigateToWorkspace: vi.fn(),
  navigateToSettings: vi.fn(),
  navigateToHome: vi.fn(),
  navigateBack: vi.fn(),
  settingsTab: null,
  clearSettingsTab: vi.fn(),
};

describe('AppContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseViewNavigation.mockReturnValue(mockNavigationContext);
  });

  it('should render HomePage when currentView is home-page', () => {
    render(
      <ViewNavigationProvider>
        <AppProvider>
          <AuthProvider>
            <ApiProvider>
              <ModalProvider>
                <AppContent />
              </ModalProvider>
            </ApiProvider>
          </AuthProvider>
        </AppProvider>
      </ViewNavigationProvider>
    );

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('HomePageView Mock')).toBeInTheDocument();
  });

  it('should render SettingsView when currentView is settings', () => {
    mockUseViewNavigation.mockReturnValue({
      ...mockNavigationContext,
      currentView: 'settings',
    });

    render(
      <ViewNavigationProvider>
        <AppProvider>
          <AuthProvider>
            <ApiProvider>
              <ModalProvider>
                <AppContent />
              </ModalProvider>
            </ApiProvider>
          </AuthProvider>
        </AppProvider>
      </ViewNavigationProvider>
    );

    expect(screen.getByTestId('settings-view')).toBeInTheDocument();
    expect(screen.getByText('SettingsView Mock')).toBeInTheDocument();
  });

  it('should render MainContent when currentView is workspace', () => {
    mockUseViewNavigation.mockReturnValue({
      ...mockNavigationContext,
      currentView: 'workspace',
      selectedWorkspace: {
        id: 'workspace-123',
        name: 'Test Workspace',
      },
    });

    render(
      <ViewNavigationProvider>
        <AppProvider>
          <AuthProvider>
            <ApiProvider>
              <ModalProvider>
                <AppContent />
              </ModalProvider>
            </ApiProvider>
          </AuthProvider>
        </AppProvider>
      </ViewNavigationProvider>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('WorkspaceView Mock')).toBeInTheDocument();
  });

  it('should render error message for unknown view', () => {
    mockUseViewNavigation.mockReturnValue({
      ...mockNavigationContext,
      currentView: 'unknown-view',
    });

    render(
      <ViewNavigationProvider>
        <AppProvider>
          <AuthProvider>
            <ApiProvider>
              <ModalProvider>
                <AppContent />
              </ModalProvider>
            </ApiProvider>
          </AuthProvider>
        </AppProvider>
      </ViewNavigationProvider>
    );

    expect(screen.getByText('View not implemented: unknown-view')).toBeInTheDocument();
  });
});

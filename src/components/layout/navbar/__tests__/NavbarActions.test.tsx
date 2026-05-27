import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NavbarActions, { NavbarActionsProps } from '../NavbarActions';
import { SidebarProvider } from '@/components/ui/sidebar';

// Mock the contexts
const mockSetCurrentPdfPath = vi.fn();
const mockClosePdfTab = vi.fn();
const mockNavigateToHome = vi.fn();
const mockNavigateToSettings = vi.fn();
const mockToggleTheme = vi.fn();

// Create a mutable object for the mock context
let mockAppContextValue = {
  openPdfs: [] as any[],
  currentPdfPath: null as string | null,
  isDarkMode: false,
  toggleTheme: mockToggleTheme,
  setCurrentPdfPath: mockSetCurrentPdfPath,
  closePdfTab: mockClosePdfTab,
  isSidebarCollapsed: false,
  toggleSidebar: vi.fn(),
  isNotesCollapsed: false,
  toggleNotes: vi.fn(),
  isAiChatCollapsed: false,
  toggleAiChat: vi.fn(),
};

vi.mock('../../../../contexts/AppContext', () => ({
  useAppContext: () => mockAppContextValue,
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useViewNavigation: () => ({
    currentView: 'home-page',
    selectedWorkspace: null,
    navigateToWorkspace: vi.fn(),
    navigateToSettings: mockNavigateToSettings,
    navigateToHome: mockNavigateToHome,
    navigateBack: vi.fn(),
    settingsTab: null,
    clearSettingsTab: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    flags: {
      enableDarkMode: true,
      showHomeTab: true,
      showChatsTab: true,
    }
  })
}));

describe('NavbarActions', () => {
  const mockOnOpenPdf = vi.fn();
  const mockOnToggleSidebar = vi.fn();

  const renderWithProviders = (props: Partial<NavbarActionsProps> = {}) => {
    return render(
      <SidebarProvider>
        <NavbarActions
          onOpenPdf={mockOnOpenPdf}
          onToggleSidebar={mockOnToggleSidebar}
          {...props}
        />
      </SidebarProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock context value
    mockAppContextValue.openPdfs = [];
    mockAppContextValue.currentPdfPath = null;
  });

  it('renders the sidebar trigger button', () => {
    const { container } = renderWithProviders();
    const sidebarTrigger = container.querySelector('[data-sidebar="trigger"]');
    expect(sidebarTrigger).toBeInTheDocument();
  });

  it('renders the home button', () => {
    renderWithProviders();
    expect(screen.getByTestId('home-button')).toBeInTheDocument();
  });

  it('does not call onToggleSidebar when sidebar trigger is clicked (currently non-functional)', () => {
    renderWithProviders();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // First button is the sidebar trigger
    expect(mockOnToggleSidebar).not.toHaveBeenCalled();
  });

  it('calls navigateToHome when home button is clicked', () => {
    renderWithProviders();
    fireEvent.click(screen.getByTestId('home-button'));
    expect(mockNavigateToHome).toHaveBeenCalledTimes(1);
  });

  it('does not show tabs when no PDF is open', () => {
    renderWithProviders();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('does not render the settings button (moved to ChatHeader)', () => {
    renderWithProviders();
    expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
  });

  it('does not render the theme toggle button (feature removed from navbar)', () => {
    renderWithProviders();
    expect(screen.queryByTestId('theme-toggle')).not.toBeInTheDocument();
  });
});

describe('NavbarActions with PDF', () => {
  const mockOnOpenPdf = vi.fn();
  const mockOnToggleSidebar = vi.fn();

  const renderWithProviders = (props: Partial<NavbarActionsProps> = {}) => {
    return render(
      <SidebarProvider>
        <NavbarActions
          onOpenPdf={mockOnOpenPdf}
          onToggleSidebar={mockOnToggleSidebar}
          {...props}
        />
      </SidebarProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppContextValue.openPdfs = [{
      id: '/path/to/document.pdf',
      name: 'document.pdf',
      path: '/path/to/document.pdf'
    }];
    mockAppContextValue.currentPdfPath = '/path/to/document.pdf';
  });

  afterEach(() => {
    mockAppContextValue.openPdfs = [];
    mockAppContextValue.currentPdfPath = null;
  });

  it('shows a tab when a PDF is open', () => {
    renderWithProviders();
    expect(screen.getByTestId('tab-/path/to/document.pdf')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    renderWithProviders({ loading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('closes PDF when tab close button is clicked', () => {
    renderWithProviders();
    fireEvent.click(screen.getByTestId('tab-close-/path/to/document.pdf'));
    expect(mockClosePdfTab).toHaveBeenCalledWith('/path/to/document.pdf');
  });
});

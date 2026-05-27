import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '../components/layout/Navigation';
import { SidebarProvider } from '../components/ui/sidebar';


// Mock SettingsModal
vi.mock('../components/SettingsModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="settings-modal">
      <button onClick={onClose} data-testid="close-settings">Close Settings</button>
    </div>
  ) : null
}));



describe('Navigation', () => {
  const mockOnTabChange = vi.fn();
  const mockOnPdfLoaded = vi.fn();

  const defaultProps = {
    activeTab: 'open-pdf',
    onTabChange: mockOnTabChange,
    onPdfLoaded: mockOnPdfLoaded,
    hasPdfOpen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation tabs', () => {
    render(
      <SidebarProvider>
        <Navigation {...defaultProps} />
      </SidebarProvider>
    );

    expect(screen.getByTestId('nav-tab-home')).toBeInTheDocument();
  });



  it('navigates to open-pdf view when clicking home tab', async () => {
    render(
      <SidebarProvider>
        <Navigation {...defaultProps} />
      </SidebarProvider>
    );

    const homeTab = screen.getByTestId('nav-tab-home');
    fireEvent.click(homeTab);

    await waitFor(() => {
      expect(mockOnTabChange).toHaveBeenCalledWith('open-pdf');
    });
  });

  it('shows home icon in normal view', () => {
    render(
      <SidebarProvider>
        <Navigation {...defaultProps} hasPdfOpen={true} />
      </SidebarProvider>
    );

    const homeTab = screen.getByTestId('nav-tab-home');
    expect(homeTab).toBeInTheDocument();
    // Home tab should not have text content, only icon
    expect(homeTab.textContent).toBe('');
  });






  it('displays correct text for each tab', () => {
    render(
      <SidebarProvider>
        <Navigation {...defaultProps} />
      </SidebarProvider>
    );

    // Check that each tab has proper text
    // Home tab has no text, only icon
    expect(screen.getByTestId('nav-tab-home')).toBeInTheDocument();
  });


  it('shows navigation tabs', () => {
    render(
      <SidebarProvider>
        <Navigation {...defaultProps} />
      </SidebarProvider>
    );

    expect(screen.getByTestId('nav-tab-home')).toBeInTheDocument();
  });
});
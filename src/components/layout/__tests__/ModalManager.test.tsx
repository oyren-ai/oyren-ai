import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModalManager from '../ModalManager';
import { AppProvider } from '@/contexts/AppContext.tsx';
import { ModalProvider, useSettingsModal, useCreateWorkspaceModal } from '@/contexts/ModalContext.tsx';
import {ViewNavigationProvider} from "@/contexts/NavigationContext.tsx";

// Mock the modal components
vi.mock('../../common/modals/SettingsModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="settings-modal">
        Settings Modal
        <button onClick={onClose}>Close Settings</button>
      </div>
    ) : null
}));

vi.mock('@/features/home/components', () => ({
  CreateWorkspaceDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-workspace-dialog">
        Create Workspace Dialog
        <button onClick={onClose}>Close Dialog</button>
      </div>
    ) : null,
  SyncWorkspaceDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="sync-workspace-dialog">
        Sync Workspace Dialog
        <button type="button" onClick={onClose}>
          Close Sync
        </button>
      </div>
    ) : null,
  EditWorkspaceDialog: () => null,
  DeleteWorkspaceDialog: () => null,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    <ViewNavigationProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </ViewNavigationProvider>
  </AppProvider>
);

describe('ModalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without showing any modals initially', () => {
    render(
      <TestWrapper>
        <ModalManager />
      </TestWrapper>
    );

    expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('create-workspace-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sync-workspace-dialog')).not.toBeInTheDocument();
  });

  it('should show settings modal when triggered', async () => {
    // Create a test component that uses the modal context
    const TestComponent = () => {
      const settingsModal = useSettingsModal();
      return (
        <div>
          <button onClick={settingsModal.open}>Open Settings</button>
          <ModalManager />
        </div>
      );
    };

    render(<TestComponent />, { wrapper: TestWrapper });

    // Trigger settings modal
    const openButton = screen.getByText('Open Settings');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });
  });

  it('should close settings modal when close is called', async () => {
    const TestComponent = () => {
      const settingsModal = useSettingsModal();
      return (
        <div>
          <button onClick={settingsModal.open}>Open Settings</button>
          <ModalManager />
        </div>
      );
    };

    render(<TestComponent />, { wrapper: TestWrapper });

    // Open modal
    const openButton = screen.getByText('Open Settings');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close Settings');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });
  });

  it('should show create workspace dialog when triggered', async () => {
    const TestComponent = () => {
      const createWorkspaceModal = useCreateWorkspaceModal();
      return (
        <div>
          <button onClick={createWorkspaceModal.open}>Open Create Workspace</button>
          <ModalManager />
        </div>
      );
    };

    render(<TestComponent />, { wrapper: TestWrapper });

    // Trigger create workspace dialog
    const openButton = screen.getByText('Open Create Workspace');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('create-workspace-dialog')).toBeInTheDocument();
    });
  });

  it('should close create workspace dialog when close is called', async () => {
    const TestComponent = () => {
      const createWorkspaceModal = useCreateWorkspaceModal();
      return (
        <div>
          <button onClick={createWorkspaceModal.open}>Open Create Workspace</button>
          <ModalManager />
        </div>
      );
    };

    render(<TestComponent />, { wrapper: TestWrapper });

    // Open dialog
    const openButton = screen.getByText('Open Create Workspace');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('create-workspace-dialog')).toBeInTheDocument();
    });

    // Close dialog
    const closeButton = screen.getByText('Close Dialog');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('create-workspace-dialog')).not.toBeInTheDocument();
    });
  });

  it('should only show one modal at a time', async () => {
    const TestComponent = () => {
      const settingsModal = useSettingsModal();
      const createWorkspaceModal = useCreateWorkspaceModal();
      return (
        <div>
          <button onClick={settingsModal.open}>Open Settings</button>
          <button onClick={createWorkspaceModal.open}>Open Create Workspace</button>
          <ModalManager />
        </div>
      );
    };

    render(<TestComponent />, { wrapper: TestWrapper });

    // Open settings modal
    const settingsButton = screen.getByText('Open Settings');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });

    // Open create workspace dialog (should close settings)
    const createButton = screen.getByText('Open Create Workspace');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('create-workspace-dialog')).toBeInTheDocument();
    });
  });

  it('should handle multiple open/close cycles', async () => {
    const TestComponent = () => {
      const settingsModal = useSettingsModal();
      const createWorkspaceModal = useCreateWorkspaceModal();
      return (
        <div>
          <button onClick={settingsModal.open}>Open Settings</button>
          <button onClick={createWorkspaceModal.open}>Open Create Workspace</button>
          <ModalManager />
        </div>
      );
    };

    render(<TestComponent />, { wrapper: TestWrapper });

    // First cycle - settings
    const settingsButton = screen.getByText('Open Settings');
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Settings'));
    await waitFor(() => {
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });

    // Second cycle - create workspace
    const createButton = screen.getByText('Open Create Workspace');
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(screen.getByTestId('create-workspace-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Dialog'));
    await waitFor(() => {
      expect(screen.queryByTestId('create-workspace-dialog')).not.toBeInTheDocument();
    });
  });
});
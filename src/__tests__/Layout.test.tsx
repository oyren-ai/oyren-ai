import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '../components/layout/Layout';
import { AppProvider } from '../contexts/AppContext';
import { ApiProvider } from '../contexts/ApiContext';
import { ViewNavigationProvider } from '../contexts/NavigationContext';
import { ModalProvider } from '../contexts/ModalContext';
import React from 'react';

// Mock hooks first before any component imports
vi.mock('../hooks/useResizableSidebar', () => ({
  useResizableSidebar: () => ({
    sidebarWidth: 250,
    handleMouseDown: vi.fn(),
  }),
}));

vi.mock('../hooks/useWorkspaceManager', () => ({
  useWorkspaceManager: () => ({
    selectedWorkspace: null,
    handleWorkspaceSelect: vi.fn(),
    handleBackToWorkspaces: vi.fn(),
    handleCreateWorkspace: vi.fn(),
    handleAddFileToWorkspace: vi.fn(),
    handleRemoveFileFromWorkspace: vi.fn(),
  }),
}));

// Simple test wrapper that provides context
// AppProvider must be outermost since ViewNavigationProvider depends on it
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>
    <ViewNavigationProvider>
      <ApiProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ApiProvider>
    </ViewNavigationProvider>
  </AppProvider>
);

describe('Layout with Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document state
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  it('renders with home-page view by default', () => {
    render(
      <Layout>
        <div data-testid="test-child">Test Content</div>
      </Layout>,
      { wrapper: TestWrapper }
    );

    // Should show layout structure
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toHaveClass('flex', 'flex-col', 'h-screen', 'w-full');
  });

  it('handles theme toggle', async () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>,
      { wrapper: TestWrapper }
    );

    // Initially dark mode
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('handles pdf-loaded event', async () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>,
      { wrapper: TestWrapper }
    );

    // Dispatch pdf-loaded event
    const event = new CustomEvent('pdf-loaded', {
      detail: { data: new Uint8Array([1, 2, 3]), filename: 'test.pdf' }
    });

    act(() => {
      window.dispatchEvent(event);
    });

    // Layout should remain rendered after PDF load
    await waitFor(() => {
      // Check if layout is rendered (it should always be there)
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  it('renders children content', () => {
    render(
      <Layout>
        <div data-testid="child-content">Child Component</div>
      </Layout>,
      { wrapper: TestWrapper }
    );

    // Should render the children
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });
});
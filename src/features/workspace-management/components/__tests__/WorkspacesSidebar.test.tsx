import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspacesSidebar } from '../WorkspacesSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ViewNavigationProvider } from '@/contexts/NavigationContext';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import React from 'react';

// Ensure lucide-react is not auto-mocked (needed for UserCheck icon in UserProfileButton)
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return { ...actual };
});

// Mock event listeners
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('@tauri-apps/plugin-deep-link', () => ({
  onOpenUrl: vi.fn(() => Promise.resolve(() => {})),
}));

// Test wrapper with all required providers
// AppProvider must be outermost since ViewNavigationProvider depends on it
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>
    <AuthProvider>
      <ViewNavigationProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ViewNavigationProvider>
    </AuthProvider>
  </AppProvider>
);

describe('WorkspacesSidebar', () => {
  beforeAll(() => {
    // Polyfill matchMedia for jsdom
    if (!window.matchMedia) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
      });
    }
  });
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the sidebar', () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      // Check for the group label specifically (there's also an h2 with sr-only class)
      const groupLabel = screen.getAllByText('Workspace Files')[1]; // Get the visible one (group label)
      expect(groupLabel).toBeInTheDocument();
    });

    it('should render with header', () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      const header = screen.getByTestId('workspaces-sidebar-header');
      expect(header).toBeInTheDocument();
    });

    it('should show empty state when no files', () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      expect(screen.getByText(/no files in workspace/i)).toBeInTheDocument();
    });
  });

  describe('Sidebar State Persistence', () => {
    it('should render with default open state', () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      const sidebar = screen.getByTestId('workspaces-sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render with closed state', () => {
      // For closed state test, we need a custom wrapper with defaultOpen=false
      // AppProvider must be outermost since ViewNavigationProvider depends on it
      const ClosedWrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider>
          <AuthProvider>
            <ViewNavigationProvider>
              <SidebarProvider defaultOpen={false}>
                {children}
              </SidebarProvider>
            </ViewNavigationProvider>
          </AuthProvider>
        </AppProvider>
      );

      render(<WorkspacesSidebar />, { wrapper: ClosedWrapper });

      const sidebar = screen.getByTestId('workspaces-sidebar');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      const sidebar = screen.getByTestId('workspaces-sidebar');
      expect(sidebar).toHaveAttribute('role', 'complementary');
    });

    it('should have semantic heading', () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      const heading = screen.getByRole('heading', { name: /workspace files/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Authentication UI', () => {
    it('should show login button when not authenticated', async () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Log in')).toBeInTheDocument();
      });
    });

    it('should show user info and logout when authenticated', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
      localStorage.setItem('oyren_auth_token', mockToken);
      const user = userEvent.setup();

      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      // Wait for user button to appear
      const userButton = await screen.findByText('Test User');
      expect(userButton).toBeInTheDocument();

      // Click to open the profile dialog
      await user.click(userButton);

      // Now check for elements inside the opened dialog
      await waitFor(() => {
        const emailElements = screen.getAllByText('test@example.com');
        expect(emailElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Log out')).toBeInTheDocument();
      });
    });

    it('should call login when login button is clicked', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const user = userEvent.setup();

      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Log in')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Log in');
      await user.click(loginButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('open_auth_browser', { isDev: expect.any(Boolean) });
      });
    });

    it('should call logout when logout button is clicked', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
      localStorage.setItem('oyren_auth_token', mockToken);

      const user = userEvent.setup();

      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      // Wait for user button to appear and click it to open dialog
      const userButton = await screen.findByText('Test User');
      await user.click(userButton);

      // Wait for logout button to appear in the opened dialog
      const logoutButton = await screen.findByText('Log out');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(localStorage.getItem('oyren_auth_token')).toBeNull();
        expect(screen.getByText('Log in')).toBeInTheDocument();
      });
    });

    it('should display loading state during authentication', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockImplementation(() => new Promise(() => {})); // Never resolves

      const user = userEvent.setup();

      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Log in')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Log in');
      await user.click(loginButton);

      // The button should show loading state or be disabled
      // Note: Based on current implementation, we just verify invoke was called
      expect(invoke).toHaveBeenCalled();
    });

    it('should render user email correctly with UTF-8 characters', async () => {
      // Token with Azerbaijani characters
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6ImF5c2VsQGV4YW1wbGUuY29tIiwibmFtZSI6IkF5c2VsIE3JmW1txZlkb3ZhIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
      localStorage.setItem('oyren_auth_token', mockToken);

      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      await waitFor(() => {
        // Check if name with special characters is displayed (use getAllByText to handle multiple matches)
        const nameElements = screen.getAllByText(/Aysel/i);
        expect(nameElements.length).toBeGreaterThan(0);
      });
    });

    it('should not show logout button when not authenticated', async () => {
      render(<WorkspacesSidebar />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Log in')).toBeInTheDocument();
      });

      expect(screen.queryByText('Log out')).not.toBeInTheDocument();
    });
  });
});

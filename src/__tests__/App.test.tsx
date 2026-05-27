import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the Layout component to verify it receives children
vi.mock('../components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">
      <div data-testid="layout-content">Layout Component</div>
      {children}
    </div>
  )
}));

// Mock AppContent
vi.mock('../AppContent', () => ({
  default: () => <div data-testid="app-content">AppContent Component</div>
}));

// Mock the AppContext
vi.mock('../contexts/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAppContext: () => ({
    openPdfs: [],
    currentPdfPath: null,
    setCurrentPdfPath: vi.fn(),
    closePdfTab: vi.fn(),
  })
}));

// Mock the ApiContext
vi.mock('../contexts/ApiContext', () => ({
  ApiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock the NavigationContext
vi.mock('../contexts/NavigationContext', () => ({
  ViewNavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useViewNavigation: () => ({
    currentView: 'home-page',
    selectedWorkspace: null,
    navigateToWorkspace: vi.fn(),
    navigateToSettings: vi.fn(),
    navigateToHome: vi.fn(),
    navigateBack: vi.fn(),
    settingsTab: null,
    clearSettingsTab: vi.fn(),
  })
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('renders the Layout component', () => {
    render(<App />);
    expect(screen.getByText('Layout Component')).toBeInTheDocument();
  });

  it('renders Layout as the root component', () => {
    render(<App />);
    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toBeInTheDocument();
  });

  it('passes AppContent as child to Layout', () => {
    render(<App />);
    // Verify both Layout and AppContent are rendered
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(screen.getByText('AppContent Component')).toBeInTheDocument();
  });
});
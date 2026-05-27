import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useResizableSidebar } from '../hooks/useResizableSidebar';

export interface OpenPdf {
  id: string;
  path: string;
  name: string;
  workspaceFileId?: string; // workspace_file_id from backend
}

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // PDF Management
  openPdfs: OpenPdf[];
  currentPdfPath: string | null;
  currentWorkspaceFileId: string | null;
  setCurrentPdfPath: (path: string | null) => void;
  setCurrentWorkspaceFileId: (fileId: string | null) => void;
  closePdfTab: (path: string) => void;
  clearAllTabs: () => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  
  // Marker Markdown
  currentMarkdownPath: string | null;
  currentMarkdownPdfName: string | null;
  setCurrentMarkdown: (markdownPath: string | null, pdfName?: string | null) => void;

  // UI State
  isAiChatCollapsed: boolean;
  setIsAiChatCollapsed: (collapsed: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;

  // Sidebar Resize
  sidebarWidth: number;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Theme - Initialize from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      const initial = (() => {
        if (saved) return saved === 'dark';
        // Default to dark when not explicitly set
        return true;
      })();
      // Apply immediately so initial render reflects theme (avoids flash and helps tests)
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', initial ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', initial);
      }
      return initial;
    } catch {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
      return true;
    }
  });

  // PDF Management
  const [openPdfs, setOpenPdfs] = useState<OpenPdf[]>([]);
  const [currentPdfPath, setCurrentPdfPath] = useState<string | null>(null);
  const [currentWorkspaceFileId, setCurrentWorkspaceFileId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const currentPdfPathRef = useRef<string | null>(null);
  currentPdfPathRef.current = currentPdfPath;
  
  // Marker Markdown
  const [currentMarkdownPath, setCurrentMarkdownPath] = useState<string | null>(null);
  const [currentMarkdownPdfName, setCurrentMarkdownPdfName] = useState<string | null>(null);

  // UI State
  const [isAiChatCollapsed, setIsAiChatCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Hooks
  const { sidebarWidth, handleMouseDown } = useResizableSidebar();

  // Theme Management
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Also add dark class to html element for Tailwind dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const ensurePdfTab = useCallback((path: string) => {
    setOpenPdfs((prev) => {
      // Normalize path for comparison (handle both / and \ separators)
      const normalizedPath = path.replace(/\\/g, '/');
      const existingTab = prev.find(pdf => pdf.path.replace(/\\/g, '/') === normalizedPath);

      if (existingTab) {
        return prev;
      }

      const filename = path.split(/[/\\]/).pop() || 'document.pdf';
      return [...prev, { id: path, path, name: filename }];
    });
  }, []);

  const handleSetCurrentPdfPath = useCallback((path: string | null) => {
    setCurrentPdfPath(path);
    if (path) {
      ensurePdfTab(path);
    }
  }, [ensurePdfTab]);

  const closePdfTab = useCallback((path: string) => {
    setOpenPdfs((prev) => {
      const filtered = prev.filter((pdf) => pdf.path !== path);
      const isClosingActive = currentPdfPathRef.current === path;
      if (isClosingActive) {
        const nextActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
        setCurrentPdfPath(nextActive);
      }
      return filtered;
    });
  }, []);

  const clearAllTabs = useCallback(() => {
    setOpenPdfs([]);
    setCurrentPdfPath(null);
    setCurrentMarkdownPath(null);
    setCurrentMarkdownPdfName(null);
  }, []);
  
  const setCurrentMarkdown = useCallback((markdownPath: string | null, pdfName?: string | null) => {
    setCurrentMarkdownPath(markdownPath);
    setCurrentMarkdownPdfName(pdfName || null);
  }, []);

  // Event Listeners
  useEffect(() => {
    const handlePdfLoaded = (event: CustomEvent) => {
    };

    window.addEventListener('pdf-loaded', handlePdfLoaded as EventListener);

    return () => {
      window.removeEventListener('pdf-loaded', handlePdfLoaded as EventListener);
    };
  }, []);

  const value: AppContextType = {
    // Theme
    isDarkMode,
    toggleTheme,

    // PDF Management
    openPdfs,
    currentPdfPath,
    currentWorkspaceFileId,
    setCurrentPdfPath: handleSetCurrentPdfPath,
    setCurrentWorkspaceFileId,
    closePdfTab,
    clearAllTabs,
    currentSessionId,
    setCurrentSessionId,
    
    // Marker Markdown
    currentMarkdownPath,
    currentMarkdownPdfName,
    setCurrentMarkdown,

    // UI State
    isAiChatCollapsed,
    setIsAiChatCollapsed,
    isSidebarCollapsed,
    setIsSidebarCollapsed,

    // Sidebar Resize
    sidebarWidth,
    handleMouseDown,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;

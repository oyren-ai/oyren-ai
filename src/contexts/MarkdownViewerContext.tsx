import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { WorkspaceFile } from '@/types/workspace';

interface MarkdownViewerContextType {
  currentMarkdownFile: WorkspaceFile | null;
  setCurrentMarkdownFile: (file: WorkspaceFile | null) => void;
}

const MarkdownViewerContext = createContext<MarkdownViewerContextType | undefined>(undefined);

interface MarkdownViewerProviderProps {
  children: ReactNode;
}

export const MarkdownViewerProvider: React.FC<MarkdownViewerProviderProps> = ({ children }) => {
  const [currentMarkdownFile, setCurrentMarkdownFile] = useState<WorkspaceFile | null>(null);

  return (
    <MarkdownViewerContext.Provider value={{ currentMarkdownFile, setCurrentMarkdownFile }}>
      {children}
    </MarkdownViewerContext.Provider>
  );
};

export const useMarkdownViewer = (): MarkdownViewerContextType => {
  const context = useContext(MarkdownViewerContext);
  if (!context) {
    throw new Error('useMarkdownViewer must be used within a MarkdownViewerProvider');
  }
  return context;
};

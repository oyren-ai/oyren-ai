import React, { createContext, useContext, useState, useCallback } from 'react';

interface LatexNotesContextType {
  /** When set, LaTeX Notes panel should open this file (e.g. from sidebar click). Clear after opening. */
  fileIdToOpen: string | null;
  setFileIdToOpen: (id: string | null) => void;
}

const LatexNotesContext = createContext<LatexNotesContextType | undefined>(undefined);

export const LatexNotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fileIdToOpen, setFileIdToOpen] = useState<string | null>(null);
  return (
    <LatexNotesContext.Provider value={{ fileIdToOpen, setFileIdToOpen }}>
      {children}
    </LatexNotesContext.Provider>
  );
};

export function useLatexNotesContext(): LatexNotesContextType {
  const context = useContext(LatexNotesContext);
  if (context === undefined) {
    throw new Error('useLatexNotesContext must be used within LatexNotesProvider');
  }
  return context;
}

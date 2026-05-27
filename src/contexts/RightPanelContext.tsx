import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RightPanelContextType {
    activePanel: string | null;
    setActivePanel: (panel: string | null) => void;
    togglePanel: (panel: string) => void;
    isPanelOpen: boolean;
}

const RightPanelContext = createContext<RightPanelContextType | undefined>(undefined);

interface RightPanelProviderProps {
    children: ReactNode;
}

export const RightPanelProvider: React.FC<RightPanelProviderProps> = ({ children }) => {
    const [activePanel, setActivePanel] = useState<string | null>(null);

    const togglePanel = useCallback((panel: string) => {
        setActivePanel(prev => prev === panel ? null : panel);
    }, []);

    const isPanelOpen = activePanel !== null;

    return (
        <RightPanelContext.Provider
            value={{
                activePanel,
                setActivePanel,
                togglePanel,
                isPanelOpen
            }}
        >
            {children}
        </RightPanelContext.Provider>
    );
};

export const useRightPanel = (): RightPanelContextType => {
    const context = useContext(RightPanelContext);
    if (!context) {
        throw new Error('useRightPanel must be used within a RightPanelProvider');
    }
    return context;
};
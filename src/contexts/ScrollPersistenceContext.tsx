import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface ScrollPersistenceContextType {
    getScrollPosition: (tabId: string) => number;
    setScrollPosition: (tabId: string, scrollTop: number) => void;
    clearScrollPosition: (tabId: string) => void;
}

const ScrollPersistenceContext = createContext<ScrollPersistenceContextType | undefined>(undefined);

export function ScrollPersistenceProvider({ children }: { children: ReactNode }) {
    const scrollPositionsRef = useRef<Map<string, number>>(new Map());

    const getScrollPosition = (tabId: string): number => {
        return scrollPositionsRef.current.get(tabId) ?? 0;
    };

    const setScrollPosition = (tabId: string, scrollTop: number): void => {
        scrollPositionsRef.current.set(tabId, scrollTop);
    };

    const clearScrollPosition = (tabId: string): void => {
        scrollPositionsRef.current.delete(tabId);
    };

    return (
        <ScrollPersistenceContext.Provider value={{ getScrollPosition, setScrollPosition, clearScrollPosition }}>
            {children}
        </ScrollPersistenceContext.Provider>
    );
}

export function useScrollPersistenceContext(): ScrollPersistenceContextType {
    const context = useContext(ScrollPersistenceContext);
    if (!context) {
        throw new Error('useScrollPersistenceContext must be used within ScrollPersistenceProvider');
    }
    return context;
}

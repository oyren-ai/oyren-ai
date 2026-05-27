import React from 'react';
import {useAppContext} from '@/contexts/AppContext.tsx';
import { useMigrateBackupState } from '@/features/home/hooks/useMigrateBackupState';
import ModalManager from './ModalManager';

export interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({children}) => {
    //TODO: we probably dont need this, can get rid of it
    const {
        isDarkMode,
    } = useAppContext();

    useMigrateBackupState();

    return (
        <div
            className={`flex flex-col h-screen w-full bg-gray-100 dark:bg-black text-black dark:text-white font-sans ${isDarkMode ? 'dark' : ''}`}
            data-testid="layout"
        >
            {children}
            <ModalManager/>
        </div>
    );
};

export default Layout;

import React, { startTransition } from 'react';
import {Home} from 'lucide-react';
import {Button} from '../../ui/button';
import {useAppContext} from '@/contexts/AppContext.tsx';
import {SidebarTrigger} from '@/components/ui/sidebar';
import NavbarPdfTabs from "@/components/layout/navbar/NavbarPdfTabs.tsx";
import { useViewNavigation } from '@/contexts/NavigationContext';
import WorkspaceInfoButton from './WorkspaceInfoButton';

export interface NavbarActionsProps {
    loading?: boolean;
    onOpenPdf: () => void;
    onToggleSidebar: () => void;
}

const NavbarActions: React.FC<NavbarActionsProps> = ({
                                                         loading = false,
                                                         onOpenPdf,
                                                         onToggleSidebar,
                                                     }) => {
    const {
      currentPdfPath,
      setCurrentPdfPath,
      openPdfs,
      closePdfTab
    } = useAppContext();

    // Wrap setCurrentPdfPath in startTransition for non-blocking tab switching
    const handleSelectPdf = (path: string | null) => {
      startTransition(() => {
        setCurrentPdfPath(path);
      });
    };

    const HomeButton = () => {
        const {navigateToHome} = useViewNavigation();
        const handleHomeClick = () => {
            navigateToHome();
            setCurrentPdfPath(null);
        };
        return (
            <div className="border-r flex-shrink-0">
                <Button
                    variant="ghost"
                    onClick={handleHomeClick}
                    className="h-10 w-10 rounded-none p-0"
                    data-testid="home-button"
                >
                    <Home className="w-4 h-4"/>
                </Button>
            </div>
        )
    }

    const SideBarTrigger = () => (
        <div className="border-r flex-shrink-0">
            <SidebarTrigger className="h-10 w-10 rounded-none"/>
        </div>
    )

    return (
        <div
            className="w-full bg-neutral-100 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
            data-testid="unified-navbar"
        >
            <div className="flex items-center h-10 w-full overflow-hidden">
                <SideBarTrigger/>
                <HomeButton/>
                <NavbarPdfTabs
                      pdfs={openPdfs}
                      activePdfPath={currentPdfPath}
                      onSelectPdf={handleSelectPdf}
                      onClosePdf={closePdfTab}
                      loading={loading}
                    />
                <WorkspaceInfoButton />
            </div>
        </div>
    );
};

export default NavbarActions;

import React from 'react';
import {useViewNavigation} from '@/contexts/NavigationContext.tsx';
import WorkspaceView from '@/features/workspace-view/WorkspaceView';
import { HomePageView } from '@/features/home/HomePageView';
import { SettingsView } from '@/features/settings/SettingsView';
import NotImplementedView from '@/components/common/NotImplementedView';

const AppContent: React.FC = () => {
    const { currentView } = useViewNavigation();

    switch (currentView) {
        case 'home-page':
            return <HomePageView />;
        case 'workspace':
            return <WorkspaceView />;
        case 'settings':
            return <SettingsView />;
        default:
            return <NotImplementedView view={currentView} />;
    }
};

export default AppContent;